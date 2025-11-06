/**
 * FILE PURPOSE: Performance Detector - Detects performance issues
 *
 * CONTEXT: Detects common performance anti-patterns in LLM-generated code
 *
 * DEPENDENCIES:
 * - types: IDetector, Issue, AnalysisFile
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import type { IDetector, DetectorResult, Issue, AnalysisFile } from './types.js';

/**
 * Performance Detector
 *
 * WHY: LLMs often generate inefficient code patterns
 * HOW: Static analysis for performance anti-patterns
 *
 * DETECTS:
 * - Inefficient loops (nested O(n²), array operations in loops)
 * - Memory leaks (event listeners, timers not cleaned up)
 * - Unnecessary re-renders (React)
 * - Synchronous blocking operations
 * - Large imports (bundle size)
 *
 * EXAMPLE:
 * ```typescript
 * const detector = new PerformanceDetector();
 * const result = await detector.detect(files);
 * ```
 */
export class PerformanceDetector implements IDetector {
  readonly name = 'performance';
  readonly version = '1.0.0';
  readonly category = 'performance' as const;
  readonly supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

  async detect(files: AnalysisFile[]): Promise<DetectorResult> {
    const startTime = Date.now();
    const issues: Issue[] = [];

    try {
      for (const file of files) {
        issues.push(...this.detectInefficientLoops(file));
        issues.push(...this.detectMemoryLeaks(file));
        issues.push(...this.detectUnnecessaryReRenders(file));
        issues.push(...this.detectBlockingOperations(file));
        issues.push(...this.detectLargeImports(file));
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
   * Detect inefficient loops
   */
  private detectInefficientLoops(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    // Nested loops (O(n²))
    let loopDepth = 0;
    lines.forEach((line, index) => {
      if (/for\s*\(|\.forEach\(|\.map\(|while\s*\(/.test(line)) {
        loopDepth++;
        if (loopDepth >= 2) {
          issues.push({
            id: `nested-loop-${file.path}-${index}`,
            severity: 'medium',
            category: 'performance',
            filePath: file.path,
            line: index + 1,
            message: 'Nested loop detected - O(n²) complexity',
            suggestion: 'Consider using a Map/Set for lookups or optimizing algorithm',
            evidence: line.trim().substring(0, 100),
          });
        }
      }
      if (line.includes('}')) {
        loopDepth = Math.max(0, loopDepth - 1);
      }
    });

    // Array operations in loops
    lines.forEach((line, index) => {
      if (/for\s*\(|\.forEach\(/.test(line)) {
        const nextLines = lines.slice(index, index + 10).join('\n');
        if (nextLines.includes('.push(') || nextLines.includes('.concat(')) {
          issues.push({
            id: `array-operation-loop-${file.path}-${index}`,
            severity: 'low',
            category: 'performance',
            filePath: file.path,
            line: index + 1,
            message: 'Array push/concat in loop - consider using map/filter',
            suggestion: 'Use map/filter/reduce for array transformations',
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Event listeners without cleanup
      if (/addEventListener\(/.test(line)) {
        const nextLines = lines.slice(index, index + 20).join('\n');
        if (!nextLines.includes('removeEventListener') && !nextLines.includes('cleanup')) {
          issues.push({
            id: `event-listener-leak-${file.path}-${index}`,
            severity: 'medium',
            category: 'performance',
            filePath: file.path,
            line: index + 1,
            message: 'addEventListener without removeEventListener - potential memory leak',
            suggestion: 'Remove event listener in cleanup/unmount',
            evidence: line.trim().substring(0, 100),
          });
        }
      }

      // Timers without cleanup
      if (/setInterval\(|setTimeout\(/.test(line)) {
        const nextLines = lines.slice(index, index + 20).join('\n');
        if (!nextLines.includes('clearInterval') && !nextLines.includes('clearTimeout')) {
          issues.push({
            id: `timer-leak-${file.path}-${index}`,
            severity: 'medium',
            category: 'performance',
            filePath: file.path,
            line: index + 1,
            message: 'Timer without cleanup - potential memory leak',
            suggestion: 'Clear timer in cleanup/unmount',
            evidence: line.trim().substring(0, 100),
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect unnecessary re-renders (React)
   */
  private detectUnnecessaryReRenders(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Inline object/array in JSX
      if (/style=\{\{/.test(line)) {
        issues.push({
          id: `inline-style-object-${file.path}-${index}`,
          severity: 'low',
          category: 'performance',
          filePath: file.path,
          line: index + 1,
          message: 'Inline style object causes re-render on every render',
          suggestion: 'Extract style object outside component',
          evidence: line.trim().substring(0, 100),
        });
      }

      // Function creation in render
      if (/onClick=\{.*=>/.test(line) || /onChange=\{.*=>/.test(line)) {
        issues.push({
          id: `inline-function-${file.path}-${index}`,
          severity: 'low',
          category: 'performance',
          filePath: file.path,
          line: index + 1,
          message: 'Inline function in JSX causes re-render',
          suggestion: 'Use useCallback or extract function outside component',
          evidence: line.trim().substring(0, 100),
        });
      }
    });

    return issues;
  }

  /**
   * Detect blocking operations
   */
  private detectBlockingOperations(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Synchronous file operations
      if (/readFileSync|writeFileSync/.test(line)) {
        issues.push({
          id: `sync-file-operation-${file.path}-${index}`,
          severity: 'medium',
          category: 'performance',
          filePath: file.path,
          line: index + 1,
          message: 'Synchronous file operation blocks event loop',
          suggestion: 'Use async readFile/writeFile instead',
          evidence: line.trim().substring(0, 100),
        });
      }

      // JSON.parse in hot path
      if (/JSON\.parse\(/.test(line) && /for\s*\(|\.map\(/.test(lines[index - 1] || '')) {
        issues.push({
          id: `json-parse-loop-${file.path}-${index}`,
          severity: 'low',
          category: 'performance',
          filePath: file.path,
          line: index + 1,
          message: 'JSON.parse in loop is expensive',
          suggestion: 'Parse once outside loop if possible',
          evidence: line.trim().substring(0, 100),
        });
      }
    });

    return issues;
  }

  /**
   * Detect large imports
   */
  private detectLargeImports(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Importing entire lodash
      if (/import\s+_\s+from\s+['"]lodash['"]/.test(line)) {
        issues.push({
          id: `large-import-lodash-${file.path}-${index}`,
          severity: 'low',
          category: 'performance',
          filePath: file.path,
          line: index + 1,
          message: 'Importing entire lodash increases bundle size',
          suggestion: 'Import specific functions: import { map } from "lodash"',
          evidence: line.trim(),
        });
      }

      // Importing entire library
      if (/import\s+\*\s+as/.test(line)) {
        issues.push({
          id: `large-import-${file.path}-${index}`,
          severity: 'low',
          category: 'performance',
          filePath: file.path,
          line: index + 1,
          message: 'Wildcard import may increase bundle size',
          suggestion: 'Import only needed exports',
          evidence: line.trim(),
        });
      }
    });

    return issues;
  }
}
