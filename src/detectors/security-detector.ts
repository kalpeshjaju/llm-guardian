/**
 * FILE PURPOSE: Security Detector - Detects security vulnerabilities
 *
 * CONTEXT: Detects common security issues in LLM-generated code like
 * hardcoded secrets, SQL injection, XSS, command injection, etc.
 *
 * DEPENDENCIES:
 * - types: IDetector, Issue, AnalysisFile
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import type { IDetector, DetectorResult, Issue, AnalysisFile } from './types.js';

/**
 * Security Detector
 *
 * WHY: LLMs often generate insecure code patterns
 * HOW: Pattern matching for common vulnerabilities
 *
 * DETECTS:
 * - Hardcoded secrets (API keys, passwords, tokens)
 * - SQL injection vulnerabilities
 * - XSS vulnerabilities
 * - Command injection vulnerabilities
 * - Insecure cryptography
 * - Path traversal
 *
 * EXAMPLE:
 * ```typescript
 * const detector = new SecurityDetector();
 * const result = await detector.detect(files);
 * // result.issues = [{ severity: 'critical', category: 'security', ... }]
 * ```
 */
export class SecurityDetector implements IDetector {
  readonly name = 'security';
  readonly version = '1.0.0';
  readonly category = 'security' as const;
  readonly supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

  /**
   * Detect security issues
   *
   * @param files - Files to analyze
   * @returns Detector result with security issues
   */
  async detect(files: AnalysisFile[]): Promise<DetectorResult> {
    const startTime = Date.now();
    const issues: Issue[] = [];

    try {
      for (const file of files) {
        // Check for hardcoded secrets
        issues.push(...this.detectHardcodedSecrets(file));

        // Check for SQL injection
        issues.push(...this.detectSQLInjection(file));

        // Check for XSS vulnerabilities
        issues.push(...this.detectXSS(file));

        // Check for command injection
        issues.push(...this.detectCommandInjection(file));

        // Check for insecure cryptography
        issues.push(...this.detectInsecureCrypto(file));

        // Check for path traversal
        issues.push(...this.detectPathTraversal(file));
      }

      return {
        detectorName: this.name,
        success: true,
        issues,
        metadata: {
          filesAnalyzed: files.length,
          executionTimeMs: Math.max(1, Date.now() - startTime),
        },
      };

    } catch (error) {
      return {
        detectorName: this.name,
        success: false,
        issues: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          filesAnalyzed: files.length,
          executionTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Detect hardcoded secrets
   */
  private detectHardcodedSecrets(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    // Patterns for common secrets
    const secretPatterns = [
      { pattern: /['"]([A-Za-z0-9]{32,})['"]/, name: 'API Key', minLength: 32 },
      { pattern: /(AKIA[0-9A-Z]{16})/, name: 'AWS Access Key' },
      { pattern: /['"]([0-9a-zA-Z\-_]{43})['"]/, name: 'AWS Secret Key', minLength: 43 },
      { pattern: /sk-[a-zA-Z0-9\-_]{20,}/, name: 'OpenAI API Key' },
      { pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/, name: 'Slack Token' },
      { pattern: /ghp_[a-zA-Z0-9]{20,}/, name: 'GitHub Token' },
      { pattern: /(password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/, name: 'Hardcoded Password' },
      { pattern: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/, name: 'JWT Token' },
    ];

    lines.forEach((line, index) => {
      // Skip environment variable assignments (acceptable)
      if (line.includes('process.env.') || line.includes('import.meta.env.')) {
        return;
      }

      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(line)) {
          issues.push({
            id: `hardcoded-secret-${file.path}-${index}`,
            severity: 'critical',
            category: 'security',
            filePath: file.path,
            line: index + 1,
            message: `Hardcoded ${name} detected - use environment variables instead`,
            suggestion: `Store secrets in environment variables or use a secrets manager`,
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect SQL injection vulnerabilities
   */
  private detectSQLInjection(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    // Patterns for SQL injection
    const sqlInjectionPatterns = [
      /query\s*\(\s*[`'"]\s*SELECT.*\$\{.*\}/i,
      /query\s*\(\s*[`'"]\s*INSERT.*\$\{.*\}/i,
      /query\s*\(\s*[`'"]\s*UPDATE.*\$\{.*\}/i,
      /query\s*\(\s*[`'"]\s*DELETE.*\$\{.*\}/i,
      /execute\s*\(\s*[`'"].*\+.*\)/i,
      /\.raw\s*\(\s*[`'"].*\$\{.*\}/i,
    ];

    lines.forEach((line, index) => {
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(line)) {
          issues.push({
            id: `sql-injection-${file.path}-${index}`,
            severity: 'critical',
            category: 'security',
            filePath: file.path,
            line: index + 1,
            message: 'Potential SQL injection vulnerability - use parameterized queries',
            suggestion: 'Use prepared statements or ORM methods with parameters',
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect XSS vulnerabilities
   */
  private detectXSS(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    // Patterns for XSS
    const xssPatterns = [
      /dangerouslySetInnerHTML/,
      /\.innerHTML\s*=/,
      /document\.write\s*\(/,
      /eval\s*\(/,
      /new\s+Function\s*\(/,
    ];

    lines.forEach((line, index) => {
      for (const pattern of xssPatterns) {
        if (pattern.test(line)) {
          issues.push({
            id: `xss-${file.path}-${index}`,
            severity: 'high',
            category: 'security',
            filePath: file.path,
            line: index + 1,
            message: 'Potential XSS vulnerability - avoid inserting untrusted content',
            suggestion: 'Sanitize user input or use safe rendering methods',
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect command injection vulnerabilities
   */
  private detectCommandInjection(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    // Patterns for command injection
    const commandInjectionPatterns = [
      /exec\s*\(\s*[`'"].*\$\{.*\}/,
      /spawn\s*\(\s*[`'"].*\$\{.*\}/,
      /execSync\s*\(\s*[`'"].*\$\{.*\}/,
      /child_process\.exec.*\+/,
      /exec\s*\(.*\+/,
      /spawn\s*\(.*\+/,
      /execSync\s*\(.*\+/,
    ];

    lines.forEach((line, index) => {
      for (const pattern of commandInjectionPatterns) {
        if (pattern.test(line)) {
          issues.push({
            id: `command-injection-${file.path}-${index}`,
            severity: 'critical',
            category: 'security',
            filePath: file.path,
            line: index + 1,
            message: 'Potential command injection vulnerability',
            suggestion: 'Use execFile or spawn with array arguments instead',
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect insecure cryptography
   */
  private detectInsecureCrypto(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    // Patterns for insecure crypto
    const insecureCryptoPatterns = [
      { pattern: /createCipher\(/, message: 'Use createCipheriv instead (createCipher uses weak IV)' },
      { pattern: /MD5|SHA1/i, message: 'MD5 and SHA1 are cryptographically broken - use SHA256+' },
      { pattern: /Math\.random\(\)/, message: 'Math.random() is not cryptographically secure - use crypto.randomBytes()' },
    ];

    lines.forEach((line, index) => {
      for (const { pattern, message } of insecureCryptoPatterns) {
        if (pattern.test(line)) {
          issues.push({
            id: `insecure-crypto-${file.path}-${index}`,
            severity: 'high',
            category: 'security',
            filePath: file.path,
            line: index + 1,
            message: `Insecure cryptography: ${message}`,
            suggestion: message,
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect path traversal vulnerabilities
   */
  private detectPathTraversal(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    // Patterns for path traversal
    const pathTraversalPatterns = [
      /readFileSync\s*\(\s*.*\+/,
      /writeFileSync\s*\(\s*.*\+/,
      /\.\.\/\.\.\//,
    ];

    lines.forEach((line, index) => {
      for (const pattern of pathTraversalPatterns) {
        if (pattern.test(line) && !line.includes('path.join')) {
          issues.push({
            id: `path-traversal-${file.path}-${index}`,
            severity: 'high',
            category: 'security',
            filePath: file.path,
            line: index + 1,
            message: 'Potential path traversal vulnerability',
            suggestion: 'Use path.join() or validate user input against allowed paths',
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }
}
