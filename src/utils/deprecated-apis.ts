/**
 * FILE PURPOSE: Database of deprecated APIs that LLMs commonly suggest
 *
 * CONTEXT: LLMs are trained on old documentation and may suggest deprecated APIs.
 * This database helps detect and suggest modern replacements.
 *
 * DEPENDENCIES: None (static data)
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

/**
 * Deprecated API entry
 */
export interface DeprecatedAPI {
  /** Package name (e.g., 'stripe', 'openai') */
  package: string;

  /** Deprecated API pattern (regex or string) */
  pattern: string | RegExp;

  /** Recommended replacement */
  replacement: string;

  /** Why it was deprecated */
  reason: string;

  /** When it was deprecated (for tracking freshness) */
  deprecatedSince?: string;

  /** Link to migration guide */
  migrationGuide?: string;
}

/**
 * Comprehensive database of deprecated APIs
 *
 * WHY: LLMs often suggest old APIs from their training data
 * HOW: Manually curated list of common deprecations (crowdsourced over time)
 *
 * MAINTENANCE: Add new entries as deprecated APIs are discovered
 * PRIORITY: Focus on most popular packages (stripe, openai, react, etc.)
 */
export const DEPRECATED_APIS: DeprecatedAPI[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // STRIPE (Payment Processing)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'stripe',
    pattern: /stripe\.charges\.create/,
    replacement: 'stripe.paymentIntents.create()',
    reason: 'Charges API replaced by Payment Intents API for better flow control',
    deprecatedSince: '2019-02',
    migrationGuide: 'https://stripe.com/docs/payments/payment-intents/migration',
  },
  {
    package: 'stripe',
    pattern: /stripe\.tokens\.create/,
    replacement: 'stripe.paymentMethods.create()',
    reason: 'Tokens API replaced by Payment Methods API for better security',
    deprecatedSince: '2019-02',
    migrationGuide: 'https://stripe.com/docs/payments/payment-methods',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // OPENAI (LLM API)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'openai',
    pattern: /openai\.Completion\.create/,
    replacement: 'openai.chat.completions.create()',
    reason: 'Completion API replaced by Chat Completions API',
    deprecatedSince: '2023-03',
    migrationGuide: 'https://platform.openai.com/docs/guides/text-generation',
  },
  {
    package: 'openai',
    pattern: /engine\s*=\s*["']text-davinci-003["']/,
    replacement: 'model="gpt-3.5-turbo" or model="gpt-4"',
    reason: 'Legacy completion models replaced by chat models',
    deprecatedSince: '2023-06',
  },
  {
    package: 'openai',
    pattern: /openai\.FineTune\./,
    replacement: 'openai.fine_tuning.jobs',
    reason: 'FineTune API replaced by fine_tuning API',
    deprecatedSince: '2023-08',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // REACT (UI Framework)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'react',
    pattern: /React\.FC</,
    replacement: 'function Component(props: Props)',
    reason: 'React.FC discouraged due to implicit children and worse TypeScript inference',
    deprecatedSince: '2020-08',
    migrationGuide: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components',
  },
  {
    package: 'react',
    pattern: /componentWillMount|componentWillReceiveProps|componentWillUpdate/,
    replacement: 'Use hooks (useEffect, useState) or getDerivedStateFromProps',
    reason: 'Unsafe lifecycle methods removed in React 17+',
    deprecatedSince: '2018-03',
    migrationGuide: 'https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html',
  },
  {
    package: 'react',
    pattern: /ReactDOM\.render\(/,
    replacement: 'ReactDOM.createRoot(container).render()',
    reason: 'Legacy render replaced by createRoot in React 18',
    deprecatedSince: '2022-03',
    migrationGuide: 'https://react.dev/blog/2022/03/08/react-18-upgrade-guide',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // NODE.JS (Runtime)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'node',
    pattern: /require\(['"]url['"]\)\.parse/,
    replacement: 'new URL(urlString)',
    reason: 'url.parse() deprecated in favor of URL constructor',
    deprecatedSince: '2018-10',
  },
  {
    package: 'node',
    pattern: /require\(['"]crypto['"]\)\.createCipher/,
    replacement: 'crypto.createCipheriv()',
    reason: 'createCipher uses weak IV generation, use createCipheriv',
    deprecatedSince: '2017-06',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MONGOOSE (MongoDB ODM)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'mongoose',
    pattern: /mongoose\.connect\([^,]+,\s*\{.*useNewUrlParser.*\}/,
    replacement: 'mongoose.connect(uri) // Remove deprecated options',
    reason: 'useNewUrlParser and useUnifiedTopology options removed in Mongoose 6',
    deprecatedSince: '2021-05',
  },
  {
    package: 'mongoose',
    pattern: /\.exec\(function\s*\(err,/,
    replacement: 'await Model.find().exec() // Use async/await',
    reason: 'Callback pattern deprecated in favor of promises',
    deprecatedSince: '2019-01',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EXPRESS (Web Framework)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'express',
    pattern: /bodyParser\./,
    replacement: 'express.json() and express.urlencoded()',
    reason: 'body-parser is now built into Express',
    deprecatedSince: '2019-02',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MOMENT.JS (Date Library - DEPRECATED ENTIRELY)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'moment',
    pattern: /import.*moment|require\(['"]moment['"]\)/,
    replacement: 'Use date-fns or dayjs (moment.js is in maintenance mode)',
    reason: 'Moment.js is no longer maintained, use modern alternatives',
    deprecatedSince: '2020-09',
    migrationGuide: 'https://momentjs.com/docs/#/-project-status/',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ZOD (Validation Library)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'zod',
    pattern: /\.refineSync\(/,
    replacement: '.superRefine() or .transform()',
    reason: 'refineSync removed in Zod 3.23+',
    deprecatedSince: '2023-09',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AXIOS (HTTP Client)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'axios',
    pattern: /axios\./,
    replacement: 'Use native fetch() API (Node 18+)',
    reason: 'Native fetch is now stable in Node.js, reduces dependencies',
    deprecatedSince: '2022-02',
    migrationGuide: 'https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PUPPETEER (Browser Automation)
  // ═══════════════════════════════════════════════════════════════════════
  {
    package: 'puppeteer',
    pattern: /puppeteer\.launch\(\{[\s\S]*executablePath:.*chromium/,
    replacement: 'Use @puppeteer/browsers or built-in Chrome',
    reason: 'Manual chromium path management deprecated',
    deprecatedSince: '2023-06',
  },
];

/**
 * Check if code contains deprecated API usage
 *
 * WHY: Detect when LLMs suggest old APIs
 * HOW: Match code against known deprecated patterns
 *
 * @param code - Source code to check
 * @param packageName - Package name being used (optional, filters checks)
 * @returns Array of detected deprecated APIs
 *
 * EXAMPLE:
 * ```typescript
 * const code = "stripe.charges.create({ amount: 1000 })";
 * const deprecated = findDeprecatedAPIs(code, 'stripe');
 * // Returns: [{ package: 'stripe', pattern: /stripe\.charges\.create/, ... }]
 * ```
 */
export function findDeprecatedAPIs(
  code: string,
  packageName?: string
): DeprecatedAPI[] {
  const detected: DeprecatedAPI[] = [];

  // Filter by package if specified
  const apisToCheck = packageName
    ? DEPRECATED_APIS.filter(api => api.package === packageName)
    : DEPRECATED_APIS;

  for (const api of apisToCheck) {
    const pattern = typeof api.pattern === 'string'
      ? new RegExp(api.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : api.pattern;

    if (pattern.test(code)) {
      detected.push(api);
    }
  }

  return detected;
}

/**
 * Get all deprecated APIs for a specific package
 *
 * WHY: Show developers all known deprecations for a package they're using
 *
 * @param packageName - Package name (e.g., 'stripe')
 * @returns Array of deprecated APIs for that package
 */
export function getDeprecatedAPIsForPackage(packageName: string): DeprecatedAPI[] {
  return DEPRECATED_APIS.filter(api => api.package === packageName);
}

/**
 * Get statistics about deprecated APIs database
 *
 * WHY: Monitor database coverage and maintenance
 *
 * @returns Stats about deprecated APIs
 */
export function getDeprecationStats(): {
  totalAPIs: number;
  packagesCovered: number;
  packages: string[];
} {
  const packages = new Set(DEPRECATED_APIS.map(api => api.package));

  return {
    totalAPIs: DEPRECATED_APIS.length,
    packagesCovered: packages.size,
    packages: Array.from(packages).sort(),
  };
}
