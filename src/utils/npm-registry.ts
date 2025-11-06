/**
 * FILE PURPOSE: npm registry integration for package validation
 *
 * CONTEXT: Check if npm packages exist using registry API.
 * Critical for hallucination detection (fake packages are a common LLM mistake).
 *
 * DEPENDENCIES: Native fetch API (Node 20+)
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

/**
 * npm package metadata from registry API
 */
export interface PackageMetadata {
  /** Package name */
  name: string;

  /** Latest version */
  version: string;

  /** Whether package exists in registry */
  exists: boolean;

  /** Package description */
  description?: string;

  /** Deprecated status and message */
  deprecated?: string;

  /** Repository URL */
  repository?: string;
}

/**
 * Cache for npm registry lookups
 *
 * WHY: Avoid hitting npm registry API repeatedly for same packages
 * HOW: In-memory cache with TTL (valid for session only)
 *
 * NOTE: Cache is cleared on process restart (no persistence needed for MVP)
 */
const packageCache = new Map<string, { metadata: PackageMetadata; timestamp: number }>();

/**
 * Cache TTL (5 minutes)
 *
 * WHY: npm packages don't change frequently during a coding session
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if npm package exists in registry
 *
 * WHY: Detect hallucinated package names (e.g., 'stripe-pro' instead of 'stripe')
 * HOW: Query npm registry API, cache results to avoid rate limiting
 *
 * @param packageName - Package name to check (e.g., 'stripe', 'openai')
 * @returns Package metadata including existence and deprecation status
 *
 * EXAMPLE:
 * ```typescript
 * const stripe = await checkPackageExists('stripe');
 * // { name: 'stripe', version: '14.0.0', exists: true, deprecated: undefined }
 *
 * const fake = await checkPackageExists('stripe-pro');
 * // { name: 'stripe-pro', version: '', exists: false }
 * ```
 *
 * EDGE CASES:
 * - Network errors: Returns exists: false (assume package doesn't exist)
 * - Rate limiting: Cache helps, but may still hit limits (acceptable for MVP)
 * - Scoped packages: Handled correctly (@anthropic-ai/sdk)
 * - Package name with slashes: Encoded properly
 */
export async function checkPackageExists(packageName: string): Promise<PackageMetadata> {
  // Check cache first
  const cached = packageCache.get(packageName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.metadata;
  }

  try {
    // Encode package name for URL (handles @scoped/packages)
    const encodedName = encodeURIComponent(packageName);

    // Query npm registry API
    // Docs: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
    const response = await fetch(`https://registry.npmjs.org/${encodedName}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // Short timeout to avoid blocking
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // Package doesn't exist (404) or other error
      const metadata: PackageMetadata = {
        name: packageName,
        version: '',
        exists: false,
      };

      // Cache negative results too (avoid repeated 404s)
      packageCache.set(packageName, { metadata, timestamp: Date.now() });
      return metadata;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();

    // Extract metadata from npm registry response
    const latestVersion = data['dist-tags']?.latest || '';
    const versionInfo = data.versions?.[latestVersion];

    const metadata: PackageMetadata = {
      name: packageName,
      version: latestVersion,
      exists: true,
      description: data.description || versionInfo?.description,
      deprecated: versionInfo?.deprecated, // npm packages can be marked deprecated
      repository: typeof data.repository === 'string'
        ? data.repository
        : data.repository?.url,
    };

    // Cache positive result
    packageCache.set(packageName, { metadata, timestamp: Date.now() });
    return metadata;

  } catch (error) {
    // Network error, timeout, or parse error
    // Default to "doesn't exist" to be conservative
    const metadata: PackageMetadata = {
      name: packageName,
      version: '',
      exists: false,
    };

    // Don't cache errors (might be temporary network issue)
    return metadata;
  }
}

/**
 * Batch check multiple packages (parallelized)
 *
 * WHY: Faster than sequential checks, respects npm registry rate limits
 * HOW: Use Promise.all for parallel requests (up to 10 concurrent)
 *
 * @param packageNames - Array of package names to check
 * @returns Map of package name to metadata
 *
 * EXAMPLE:
 * ```typescript
 * const results = await batchCheckPackages(['stripe', 'openai', 'fake-package']);
 * // Map {
 * //   'stripe' => { exists: true, version: '14.0.0' },
 * //   'openai' => { exists: true, version: '4.20.0' },
 * //   'fake-package' => { exists: false, version: '' }
 * // }
 * ```
 *
 * PERFORMANCE:
 * - Parallel requests (up to 10 concurrent)
 * - Cache hits return immediately (no API call)
 * - Total time ~= slowest request (~200ms per uncached package)
 */
export async function batchCheckPackages(
  packageNames: string[]
): Promise<Map<string, PackageMetadata>> {
  // Deduplicate package names
  const uniqueNames = [...new Set(packageNames)];

  // Process in batches of 10 to avoid overwhelming npm registry
  const BATCH_SIZE = 10;
  const results = new Map<string, PackageMetadata>();

  for (let i = 0; i < uniqueNames.length; i += BATCH_SIZE) {
    const batch = uniqueNames.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (name) => ({
        name,
        metadata: await checkPackageExists(name),
      }))
    );

    for (const { name, metadata } of batchResults) {
      results.set(name, metadata);
    }
  }

  return results;
}

/**
 * Clear package cache (useful for testing)
 *
 * WHY: Tests need fresh state, no stale cache entries
 */
export function clearPackageCache(): void {
  packageCache.clear();
}

/**
 * Get cache statistics (for debugging/monitoring)
 *
 * WHY: Understand cache hit rate, optimize performance
 *
 * @returns Cache size and hit count
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: packageCache.size,
    entries: Array.from(packageCache.keys()),
  };
}
