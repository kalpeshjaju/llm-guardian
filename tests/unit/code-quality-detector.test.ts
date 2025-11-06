/**
 * FILE PURPOSE: Unit tests for Code Quality Detector
 *
 * CONTEXT: Test all 5 code quality checks:
 * 1. 'any' type usage
 * 2. File size validation
 * 3. Function size validation
 * 4. Error handling detection
 * 5. Console statement detection
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeQualityDetector } from '../../src/detectors/code-quality-detector.js';
import type { AnalysisFile } from '../../src/detectors/types.js';

describe('CodeQualityDetector', () => {
  let detector: CodeQualityDetector;

  beforeEach(() => {
    detector = new CodeQualityDetector();
  });

  describe('Any Type Detection', () => {
    it('should detect "any" type in variable declarations', async () => {
      const file: AnalysisFile = {
        path: '/test/types.ts',
        content: `
          const data: any = fetchData();
          let value: any;
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const anyTypeIssues = result.issues.filter(i => i.id === 'any-type-usage');
      expect(anyTypeIssues.length).toBeGreaterThan(0);
      expect(anyTypeIssues[0]?.severity).toBe('medium');
    });

    it('should detect "any" in function parameters', async () => {
      const file: AnalysisFile = {
        path: '/test/function.ts',
        content: `
          function process(data: any) {
            return data;
          }
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const anyTypeIssues = result.issues.filter(i => i.id === 'any-type-usage');
      expect(anyTypeIssues.length).toBeGreaterThan(0);
    });

    it('should detect "any" in type assertions', async () => {
      const file: AnalysisFile = {
        path: '/test/assertion.ts',
        content: `
          const value = data as any;
          const result = <any>response;
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const anyTypeIssues = result.issues.filter(i => i.id === 'any-type-usage');
      expect(anyTypeIssues.length).toBeGreaterThan(0);
    });

    it('should detect "any" in arrays and generics', async () => {
      const file: AnalysisFile = {
        path: '/test/generics.ts',
        content: `
          const items: any[] = [];
          const list: Array<any> = [];
          const map: Record<string, any> = {};
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const anyTypeIssues = result.issues.filter(i => i.id === 'any-type-usage');
      expect(anyTypeIssues.length).toBeGreaterThan(0);
    });

    it('should flag excessive "any" usage (>3 instances)', async () => {
      const file: AnalysisFile = {
        path: '/test/excessive.ts',
        content: `
          const a: any = 1;
          const b: any = 2;
          const c: any = 3;
          const d: any = 4;
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const excessiveIssue = result.issues.find(i => i.id === 'excessive-any-types');
      expect(excessiveIssue).toBeDefined();
      expect(excessiveIssue?.severity).toBe('high');
    });

    it('should NOT flag "any" in comments', async () => {
      const file: AnalysisFile = {
        path: '/test/comments.ts',
        content: `
          // This is any comment
          /* This is any block comment */
          const value: string = 'test';
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const anyTypeIssues = result.issues.filter(i => i.id === 'any-type-usage');
      expect(anyTypeIssues.length).toBe(0);
    });

    it('should only check TypeScript files', async () => {
      const file: AnalysisFile = {
        path: '/test/script.js',
        content: `const data = fetchData(); // Not TypeScript, no "any" check`,
        extension: '.js',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const anyTypeIssues = result.issues.filter(i => i.id === 'any-type-usage');
      expect(anyTypeIssues.length).toBe(0);
    });
  });

  describe('File Size Detection', () => {
    it('should flag files larger than 600 lines', async () => {
      // Generate file with 650 lines
      const lines = Array.from({ length: 650 }, (_, i) => `const line${i} = ${i};`);
      const file: AnalysisFile = {
        path: '/test/large-file.ts',
        content: lines.join('\n'),
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const sizeIssue = result.issues.find(i => i.id === 'file-too-large');
      expect(sizeIssue).toBeDefined();
      expect(sizeIssue?.severity).toBe('high');
      expect(sizeIssue?.metadata?.lineCount).toBe(650);
    });

    it('should NOT flag files under 600 lines', async () => {
      const lines = Array.from({ length: 500 }, (_, i) => `const line${i} = ${i};`);
      const file: AnalysisFile = {
        path: '/test/normal-file.ts',
        content: lines.join('\n'),
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const sizeIssue = result.issues.find(i => i.id === 'file-too-large');
      expect(sizeIssue).toBeUndefined();
    });
  });

  describe('Function Size Detection', () => {
    it('should detect functions larger than 150 lines', async () => {
      // Generate function with 160 lines
      const functionBody = Array.from({ length: 160 }, (_, i) => `  const x${i} = ${i};`).join('\n');
      const file: AnalysisFile = {
        path: '/test/large-function.ts',
        content: `
function largeFunction() {
${functionBody}
}
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const functionIssue = result.issues.find(i => i.id === 'function-too-large');
      expect(functionIssue).toBeDefined();
      expect(functionIssue?.severity).toBe('high');
      expect(functionIssue?.metadata?.functionName).toBe('largeFunction');
    });

    it('should detect large arrow functions', async () => {
      const functionBody = Array.from({ length: 160 }, (_, i) => `  const x${i} = ${i};`).join('\n');
      const file: AnalysisFile = {
        path: '/test/large-arrow.ts',
        content: `
const processData = () => {
${functionBody}
};
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const functionIssue = result.issues.find(i => i.id === 'function-too-large');
      expect(functionIssue).toBeDefined();
    });

    it('should NOT flag small functions', async () => {
      const file: AnalysisFile = {
        path: '/test/small-function.ts',
        content: `
function smallFunction() {
  const x = 1;
  const y = 2;
  return x + y;
}
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const functionIssue = result.issues.find(i => i.id === 'function-too-large');
      expect(functionIssue).toBeUndefined();
    });
  });

  describe('Error Handling Detection', () => {
    it('should detect await without try/catch', async () => {
      const file: AnalysisFile = {
        path: '/test/no-error-handling.ts',
        content: `
async function fetchData() {
  const data = await fetch('/api/data');
  return data.json();
}
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const errorIssues = result.issues.filter(i => i.id === 'missing-error-handling');
      expect(errorIssues.length).toBeGreaterThan(0);
      expect(errorIssues[0]?.severity).toBe('high');
    });

    it('should NOT flag await inside try/catch', async () => {
      const file: AnalysisFile = {
        path: '/test/with-error-handling.ts',
        content: `
async function fetchData() {
  try {
    const data = await fetch('/api/data');
    return await data.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const errorIssues = result.issues.filter(i => i.id === 'missing-error-handling');
      expect(errorIssues.length).toBe(0);
    });

    it('should NOT flag await with .catch()', async () => {
      const file: AnalysisFile = {
        path: '/test/with-catch.ts',
        content: `
async function fetchData() {
  const data = await fetch('/api/data').catch(err => handleError(err));
  return data;
}
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const errorIssues = result.issues.filter(i => i.id === 'missing-error-handling');
      expect(errorIssues.length).toBe(0);
    });

    it('should detect .then() without .catch()', async () => {
      const file: AnalysisFile = {
        path: '/test/promise-no-catch.ts',
        content: `
function getData() {
  return fetch('/api/data')
    .then(res => res.json())
    .then(data => processData(data));
}
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const errorIssues = result.issues.filter(i => i.id === 'missing-error-handling');
      expect(errorIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Console Statement Detection', () => {
    it('should detect console.log statements', async () => {
      const file: AnalysisFile = {
        path: '/test/debug.ts',
        content: `
function process() {
  console.log('Debug message');
  return true;
}
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const consoleIssues = result.issues.filter(i => i.id === 'console-statement');
      expect(consoleIssues.length).toBeGreaterThan(0);
      expect(consoleIssues[0]?.severity).toBe('low');
    });

    it('should detect all console methods', async () => {
      const file: AnalysisFile = {
        path: '/test/all-console.ts',
        content: `
console.log('log');
console.warn('warn');
console.error('error');
console.debug('debug');
console.info('info');
console.table(data);
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const consoleIssues = result.issues.filter(i => i.id === 'console-statement');
      expect(consoleIssues.length).toBe(6); // All 6 console methods
    });

    it('should NOT flag console in comments', async () => {
      const file: AnalysisFile = {
        path: '/test/console-comment.ts',
        content: `
// console.log('This is a comment');
/* console.error('This is also a comment'); */
const value = 5;
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const consoleIssues = result.issues.filter(i => i.id === 'console-statement');
      expect(consoleIssues.length).toBe(0);
    });

    it('should provide auto-fix for console statements', async () => {
      const file: AnalysisFile = {
        path: '/test/console-fix.ts',
        content: `console.log('test');`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const consoleIssue = result.issues.find(i => i.id === 'console-statement');
      expect(consoleIssue?.fix).toBeDefined();
      expect(consoleIssue?.fix?.type).toBe('string-replace');
      expect(consoleIssue?.fix?.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Multiple Issues', () => {
    it('should detect multiple issue types in one file', async () => {
      const file: AnalysisFile = {
        path: '/test/multiple-issues.ts',
        content: `
const data: any = await fetch('/api/data');
console.log(data);
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      expect(result.issues.length).toBeGreaterThan(2);

      const issueTypes = new Set(result.issues.map(i => i.id));
      expect(issueTypes.has('any-type-usage')).toBe(true);
      expect(issueTypes.has('missing-error-handling')).toBe(true);
      expect(issueTypes.has('console-statement')).toBe(true);
    });

    it('should analyze multiple files', async () => {
      const files: AnalysisFile[] = [
        {
          path: '/test/file1.ts',
          content: `const x: any = 1;`,
          extension: '.ts',
        },
        {
          path: '/test/file2.ts',
          content: `console.log('test');`,
          extension: '.ts',
        },
      ];

      const result = await detector.detect(files);

      expect(result.success).toBe(true);
      expect(result.metadata.filesAnalyzed).toBe(2);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', async () => {
      const file: AnalysisFile = {
        path: '/test/empty.ts',
        content: '',
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should handle files with only comments', async () => {
      const file: AnalysisFile = {
        path: '/test/comments-only.ts',
        content: `
// This is a comment
/* This is a block comment */
// Another comment
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should complete within performance budget (<100ms for 10 files)', async () => {
      const files: AnalysisFile[] = Array.from({ length: 10 }, (_, i) => ({
        path: `/test/file${i}.ts`,
        content: `
          const data: any = fetchData();
          console.log(data);
          await processData(data);
        `,
        extension: '.ts',
      }));

      const startTime = Date.now();
      const result = await detector.detect(files);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // <100ms for 10 small files
    });
  });
});
