/**
 * FILE PURPOSE: Judge Agent - Validate fixes work correctly
 *
 * CONTEXT: Part of the Multi-Agent Evolve (MAE) pattern.
 * Validates that applied fixes don't break code by running tests and type-check.
 *
 * DEPENDENCIES:
 * - child_process: Run validation commands
 * - fs: Check file existence
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import type { FixResult } from './solver.js';

const execAsync = promisify(exec);

/**
 * Validation result for a fix
 */
export interface ValidationResult {
  /** Whether validation passed */
  success: boolean;

  /** Fix result that was validated */
  fixResult: FixResult;

  /** Validation checks performed */
  checks: ValidationCheck[];

  /** Overall validation message */
  message: string;

  /** Time taken for validation (ms) */
  executionTimeMs: number;
}

/**
 * Individual validation check
 */
export interface ValidationCheck {
  /** Name of check (e.g., 'type-check', 'lint', 'test') */
  name: string;

  /** Whether check passed */
  passed: boolean;

  /** Error message (if failed) */
  error?: string;

  /** Output from check */
  output?: string;

  /** Time taken (ms) */
  executionTimeMs: number;
}

/**
 * Judge Agent configuration
 */
export interface JudgeAgentOptions {
  /** Run type-check validation (default: true) */
  runTypeCheck?: boolean;

  /** Run lint validation (default: false, too slow) */
  runLint?: boolean;

  /** Run tests validation (default: true if tests exist) */
  runTests?: boolean;

  /** Timeout for each validation (ms, default: 30000) */
  timeoutMs?: number;

  /** Working directory (default: process.cwd()) */
  cwd?: string;
}

/**
 * Judge Agent
 *
 * WHY: Ensure applied fixes don't break code
 * HOW: Run type-check, tests, and lint after applying fixes
 *
 * PATTERN: Multi-Agent Evolve (MAE)
 * - Proposer: Suggests fixes ✅
 * - Solver: Applies fixes ✅
 * - Judge: Validates fixes (this agent) ✅
 *
 * VALIDATION FLOW:
 * 1. Type-check: Ensure no TypeScript errors
 * 2. Tests: Run tests on modified files (if test script exists)
 * 3. Lint: Check code style (optional, slow)
 *
 * EXAMPLE:
 * ```typescript
 * const judge = new JudgeAgent({ runTypeCheck: true, runTests: true });
 * const results = await judge.validateFixes(fixResults);
 * // results = [{ success: true, checks: [...] }]
 * ```
 */
export class JudgeAgent {
  private readonly runTypeCheck: boolean;
  private readonly runLint: boolean;
  private readonly runTests: boolean;
  private readonly timeoutMs: number;
  private readonly cwd: string;

  /**
   * Create Judge Agent
   *
   * @param options - Configuration options
   */
  constructor(options: JudgeAgentOptions = {}) {
    this.runTypeCheck = options.runTypeCheck !== false; // Default true
    this.runLint = options.runLint || false; // Default false (too slow)
    this.runTests = options.runTests !== false; // Default true
    this.timeoutMs = options.timeoutMs || 30000; // 30s default
    this.cwd = options.cwd || process.cwd();
  }

  /**
   * Validate fixes work correctly
   *
   * WHY: Ensure fixes don't introduce new errors
   * HOW: Run validation checks (type-check, tests, lint)
   *
   * @param fixResults - Fix results from SolverAgent
   * @returns Validation results for each fix
   *
   * FLOW:
   * 1. Group fixes by file
   * 2. For each file:
   *    a. Run type-check
   *    b. Run tests (if test script exists)
   *    c. Run lint (optional)
   * 3. Return validation results
   *
   * PERFORMANCE:
   * - Type-check: ~2-5s for small projects
   * - Tests: ~5-10s for small test suites
   * - Lint: ~3-7s (skipped by default)
   * - Total: ~7-15s per validation
   *
   * ERROR HANDLING:
   * - Individual check failures don't stop other checks
   * - Validation failure = fix should be rolled back
   * - Timeout failures marked as failed checks
   */
  async validateFixes(fixResults: FixResult[]): Promise<ValidationResult[]> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    try {
      // Filter successful fixes only
      const successfulFixes = fixResults.filter(r => r.success);

      if (successfulFixes.length === 0) {
        return results;
      }

      // Get unique files that were modified
      const modifiedFiles = new Set(successfulFixes.map(r => r.filePath));

      console.log(`\n🔍 Validating ${successfulFixes.length} fix(es) across ${modifiedFiles.size} file(s)...`);

      // Run validation checks
      const checks: ValidationCheck[] = [];

      // Check 1: Type-check (if enabled)
      if (this.runTypeCheck) {
        const typeCheckResult = await this.runTypeCheckValidation();
        checks.push(typeCheckResult);
      }

      // Check 2: Tests (if enabled and test script exists)
      if (this.runTests && this.hasTestScript()) {
        const testResult = await this.runTestValidation();
        checks.push(testResult);
      }

      // Check 3: Lint (if enabled)
      if (this.runLint && this.hasLintScript()) {
        const lintResult = await this.runLintValidation();
        checks.push(lintResult);
      }

      // Create validation result for each fix
      const allChecksPassed = checks.every(c => c.passed);

      for (const fixResult of successfulFixes) {
        results.push({
          success: allChecksPassed,
          fixResult,
          checks,
          message: allChecksPassed
            ? `✅ All validation checks passed`
            : `❌ Validation failed: ${checks.filter(c => !c.passed).map(c => c.name).join(', ')}`,
          executionTimeMs: Date.now() - startTime,
        });
      }

      return results;

    } catch (error) {
      console.error('Judge Agent error:', error);
      return results;
    }
  }

  /**
   * Run type-check validation
   *
   * WHY: Ensure no TypeScript errors after fix
   * HOW: Run `npm run type-check` or `tsc --noEmit`
   *
   * @returns Validation check result
   */
  private async runTypeCheckValidation(): Promise<ValidationCheck> {
    const startTime = Date.now();

    try {
      // Try npm run type-check first, fallback to tsc --noEmit
      const command = this.hasScript('type-check')
        ? 'npm run type-check'
        : 'npx tsc --noEmit';

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.cwd,
        timeout: this.timeoutMs,
      });

      return {
        name: 'type-check',
        passed: true,
        output: stdout || stderr,
        executionTimeMs: Date.now() - startTime,
      };

    } catch (error: any) {
      return {
        name: 'type-check',
        passed: false,
        error: error.message,
        output: error.stdout || error.stderr,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Run test validation
   *
   * WHY: Ensure tests still pass after fix
   * HOW: Run `npm test`
   *
   * @returns Validation check result
   */
  private async runTestValidation(): Promise<ValidationCheck> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync('npm test', {
        cwd: this.cwd,
        timeout: this.timeoutMs,
        env: { ...process.env, CI: 'true' }, // CI mode for faster tests
      });

      return {
        name: 'test',
        passed: true,
        output: stdout || stderr,
        executionTimeMs: Date.now() - startTime,
      };

    } catch (error: any) {
      return {
        name: 'test',
        passed: false,
        error: error.message,
        output: error.stdout || error.stderr,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Run lint validation
   *
   * WHY: Ensure code style is maintained
   * HOW: Run `npm run lint`
   *
   * @returns Validation check result
   */
  private async runLintValidation(): Promise<ValidationCheck> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync('npm run lint', {
        cwd: this.cwd,
        timeout: this.timeoutMs,
      });

      return {
        name: 'lint',
        passed: true,
        output: stdout || stderr,
        executionTimeMs: Date.now() - startTime,
      };

    } catch (error: any) {
      return {
        name: 'lint',
        passed: false,
        error: error.message,
        output: error.stdout || error.stderr,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if package.json has a script
   *
   * @param scriptName - Script name to check
   * @returns true if script exists
   */
  private hasScript(scriptName: string): boolean {
    try {
      const packageJsonPath = `${this.cwd}/package.json`;
      if (!existsSync(packageJsonPath)) {
        return false;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      return !!packageJson.scripts?.[scriptName];
    } catch {
      return false;
    }
  }

  /**
   * Check if test script exists
   */
  private hasTestScript(): boolean {
    return this.hasScript('test');
  }

  /**
   * Check if lint script exists
   */
  private hasLintScript(): boolean {
    return this.hasScript('lint');
  }

  /**
   * Get statistics about validation results
   *
   * WHY: Report summary of validation
   * HOW: Count passed/failed validations
   *
   * @param results - Validation results
   * @returns Statistics
   */
  static getStatistics(results: ValidationResult[]): {
    total: number;
    passed: number;
    failed: number;
    checksRun: Set<string>;
    avgExecutionTimeMs: number;
  } {
    const checksRun = new Set<string>();
    let totalTime = 0;

    for (const result of results) {
      for (const check of result.checks) {
        checksRun.add(check.name);
      }
      totalTime += result.executionTimeMs;
    }

    return {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      checksRun,
      avgExecutionTimeMs: results.length > 0 ? totalTime / results.length : 0,
    };
  }
}

export default JudgeAgent;
