/**
 * FILE PURPOSE: Git integration utilities
 *
 * CONTEXT: Get staged files for pre-commit analysis or all files for manual checks.
 * Only analyze files with supported extensions (.ts, .tsx, .js, .jsx, .mjs, .cjs).
 *
 * DEPENDENCIES:
 * - child_process: Execute git commands
 * - fs: Read file contents
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { extname, resolve } from 'path';
import type { AnalysisFile } from '../../detectors/types.js';

/**
 * Supported file extensions for analysis
 */
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

/**
 * Get staged files from git
 *
 * WHY: Pre-commit hook needs to analyze only files being committed
 * HOW: Run `git diff --cached --name-only --diff-filter=ACM`
 *
 * @returns Array of AnalysisFile objects for staged files
 *
 * FILTERS:
 * - A: Added files
 * - C: Copied files
 * - M: Modified files
 * (Excludes: D=Deleted, R=Renamed without modification)
 *
 * EDGE CASES:
 * - No git repo: Throws error
 * - No staged files: Returns empty array
 * - Binary files: Skipped (only text files analyzed)
 * - Unsupported extensions: Filtered out
 *
 * EXAMPLE:
 * ```typescript
 * const files = await getStagedFiles();
 * // files = [
 * //   { path: 'src/foo.ts', content: '...', extension: '.ts' },
 * //   { path: 'src/bar.tsx', content: '...', extension: '.tsx' }
 * // ]
 * ```
 */
export async function getStagedFiles(): Promise<AnalysisFile[]> {
  try {
    // Get list of staged files
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stagedPaths = output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (stagedPaths.length === 0) {
      return [];
    }

    // Filter by supported extensions
    const supportedPaths = stagedPaths.filter(path => {
      const ext = extname(path);
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    // Read file contents
    const files: AnalysisFile[] = [];
    for (const path of supportedPaths) {
      const fullPath = resolve(process.cwd(), path);
      if (!existsSync(fullPath)) {
        // File might have been deleted after staging
        continue;
      }

      try {
        const content = readFileSync(fullPath, 'utf-8');
        files.push({
          path,
          content,
          extension: extname(path),
        });
      } catch (error) {
        // Skip files that can't be read (binary, permissions, etc.)
        console.warn(`Warning: Could not read file ${path}`);
        continue;
      }
    }

    return files;

  } catch (error) {
    if (error instanceof Error && error.message.includes('not a git repository')) {
      throw new Error('Not a git repository. LLM Guardian requires git for file tracking.');
    }
    throw new Error(`Failed to get staged files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get all supported files in project
 *
 * WHY: Manual `llm-guardian check --all` should analyze entire codebase
 * HOW: Run `git ls-files` to get tracked files, filter by extension
 *
 * @returns Array of AnalysisFile objects for all tracked files
 *
 * ADVANTAGES OF `git ls-files`:
 * - Respects .gitignore (no node_modules, dist, etc.)
 * - Only tracked files (clean project scan)
 * - Fast (git's internal index)
 *
 * EDGE CASES:
 * - Large repos: Could be slow, but filtered by extension first
 * - No git repo: Throws error
 * - Untracked files: Not included (by design)
 *
 * EXAMPLE:
 * ```typescript
 * const files = await getAllSupportedFiles();
 * // files = all .ts/.tsx/.js/.jsx/.mjs/.cjs files in project
 * ```
 */
export async function getAllSupportedFiles(): Promise<AnalysisFile[]> {
  try {
    // Get all tracked files
    const output = execSync('git ls-files', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const allPaths = output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Filter by supported extensions
    const supportedPaths = allPaths.filter(path => {
      const ext = extname(path);
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    // Read file contents
    const files: AnalysisFile[] = [];
    for (const path of supportedPaths) {
      const fullPath = resolve(process.cwd(), path);
      if (!existsSync(fullPath)) {
        continue;
      }

      try {
        const content = readFileSync(fullPath, 'utf-8');
        files.push({
          path,
          content,
          extension: extname(path),
        });
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Warning: Could not read file ${path}`);
        continue;
      }
    }

    return files;

  } catch (error) {
    if (error instanceof Error && error.message.includes('not a git repository')) {
      throw new Error('Not a git repository. LLM Guardian requires git for file tracking.');
    }
    throw new Error(`Failed to get project files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if current directory is a git repository
 *
 * WHY: Fail fast if not in git repo
 * HOW: Run `git rev-parse --git-dir`
 *
 * @returns true if git repo, false otherwise
 *
 * EXAMPLE:
 * ```typescript
 * if (!isGitRepository()) {
 *   throw new Error('Not a git repository');
 * }
 * ```
 */
export function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git root directory
 *
 * WHY: Resolve file paths relative to git root
 * HOW: Run `git rev-parse --show-toplevel`
 *
 * @returns Absolute path to git root
 * @throws Error if not a git repository
 *
 * EXAMPLE:
 * ```typescript
 * const gitRoot = getGitRoot();
 * // gitRoot = '/Users/user/projects/my-app'
 * ```
 */
export function getGitRoot(): string {
  try {
    const output = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim();
  } catch (error) {
    throw new Error('Not a git repository');
  }
}
