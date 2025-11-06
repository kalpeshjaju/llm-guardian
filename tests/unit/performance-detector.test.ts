/**
 * FILE PURPOSE: Tests for PerformanceDetector
 *
 * CONTEXT: Verifies performance anti-pattern detection
 *
 * DEPENDENCIES: vitest, PerformanceDetector
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { describe, it, expect } from 'vitest';
import { PerformanceDetector } from '../../src/detectors/performance-detector.js';
import type { AnalysisFile } from '../../src/detectors/types.js';

describe('PerformanceDetector', () => {
  const detector = new PerformanceDetector();

  describe('Inefficient Loops', () => {
    it('should detect nested loops (O(n²))', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    if (users[i].id === posts[j].userId) {
      console.log('match');
    }
  }
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Nested loop'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
      expect(issue?.suggestion).toContain('Map/Set');
    });

    it('should detect nested forEach', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
users.forEach(user => {
  posts.forEach(post => {
    processMatch(user, post);
  });
});
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Nested loop'));
      expect(issue).toBeDefined();
    });

    it('should detect nested map', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const result = items.map(item => {
  return relatedItems.map(related => {
    return { item, related };
  });
});
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Nested loop'));
      expect(issue).toBeDefined();
    });

    it('should detect array push in loop', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const result = [];
for (let i = 0; i < items.length; i++) {
  result.push(items[i] * 2);
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('push/concat in loop'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
      expect(issue?.suggestion).toContain('map/filter/reduce');
    });

    it('should detect array concat in loop', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
let result = [];
for (const item of items) {
  result = result.concat(processItem(item));
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('push/concat in loop'));
      expect(issue).toBeDefined();
    });

    it('should NOT flag single-level loops', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const nestedIssues = result.issues.filter(i => i.message.includes('Nested loop'));
      expect(nestedIssues).toHaveLength(0);
    });
  });

  describe('Memory Leaks', () => {
    it('should detect addEventListener without removeEventListener', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
function setupListeners() {
  window.addEventListener('resize', handleResize);
  document.addEventListener('click', handleClick);
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issues = result.issues.filter(i =>
        i.message.includes('addEventListener') && i.message.includes('memory leak')
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('medium');
      expect(issues[0].suggestion).toContain('cleanup');
    });

    it('should NOT flag addEventListener with removeEventListener', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
function setupListeners() {
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issues = result.issues.filter(i => i.message.includes('addEventListener'));
      expect(issues).toHaveLength(0);
    });

    it('should NOT flag addEventListener with cleanup function', async () => {
      const file: AnalysisFile = {
        path: 'test.tsx',
        content: `
useEffect(() => {
  window.addEventListener('scroll', handleScroll);

  return () => cleanup();
}, []);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issues = result.issues.filter(i => i.message.includes('addEventListener'));
      expect(issues).toHaveLength(0);
    });

    it('should detect setInterval without clearInterval', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
function startPolling() {
  setInterval(() => {
    fetchData();
  }, 5000);
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i =>
        i.message.includes('Timer') && i.message.includes('memory leak')
      );
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
      expect(issue?.suggestion).toContain('Clear timer');
    });

    it('should detect setTimeout without clearTimeout', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
function delayedAction() {
  setTimeout(() => {
    performAction();
  }, 1000);
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Timer'));
      expect(issue).toBeDefined();
    });

    it('should NOT flag setInterval with clearInterval', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
function startPolling() {
  const intervalId = setInterval(() => {
    fetchData();
  }, 5000);

  return () => clearInterval(intervalId);
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issues = result.issues.filter(i => i.message.includes('setInterval'));
      expect(issues).toHaveLength(0);
    });
  });

  describe('Unnecessary Re-renders (React)', () => {
    it('should detect inline style objects', async () => {
      const file: AnalysisFile = {
        path: 'Component.tsx',
        content: `
return (
  <div style={{ padding: '10px', margin: '20px' }}>
    Content
  </div>
);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Inline style object'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
      expect(issue?.suggestion).toContain('Extract style object');
    });

    it('should detect inline onClick functions', async () => {
      const file: AnalysisFile = {
        path: 'Component.tsx',
        content: `
return (
  <button onClick={() => handleClick(id)}>
    Click Me
  </button>
);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Inline function'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
      expect(issue?.suggestion).toContain('useCallback');
    });

    it('should detect inline onChange functions', async () => {
      const file: AnalysisFile = {
        path: 'Component.tsx',
        content: `
return (
  <input onChange={(e) => setValue(e.target.value)} />
);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i =>
        i.message.includes('Inline function') && i.evidence?.includes('onChange')
      );
      expect(issue).toBeDefined();
    });

    it('should detect multiple inline issues in same file', async () => {
      const file: AnalysisFile = {
        path: 'Component.tsx',
        content: `
return (
  <div style={{ color: 'red' }}>
    <button onClick={() => doSomething()}>Click</button>
    <input onChange={(e) => handleChange(e)} />
  </div>
);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Blocking Operations', () => {
    it('should detect readFileSync', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const content = readFileSync('./data.json', 'utf-8');
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Synchronous file operation'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('medium');
      expect(issue?.suggestion).toContain('async readFile');
    });

    it('should detect writeFileSync', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
writeFileSync('./output.txt', data);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Synchronous file operation'));
      expect(issue).toBeDefined();
    });

    it('should detect JSON.parse in loop', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
for (const item of items) {
  const parsed = JSON.parse(item);
  process(parsed);
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('JSON.parse'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
    });

    it('should detect JSON.parse after map', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const results = items.map(item => {
  return JSON.parse(item.data);
});
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('JSON.parse'));
      expect(issue).toBeDefined();
    });
  });

  describe('Large Imports', () => {
    it('should detect lodash wildcard import', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
import _ from 'lodash';
const result = _.map(items, transform);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('lodash'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
      expect(issue?.suggestion).toContain('Import specific functions');
    });

    it('should detect namespace imports', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
import * as utils from './utils';
const result = utils.formatDate(date);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Wildcard import'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('low');
      expect(issue?.suggestion).toContain('Import only needed');
    });

    it('should detect multiple wildcard imports', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
import * as React from 'react';
import * as utils from './utils';
import * as helpers from './helpers';
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const wildcardIssues = result.issues.filter(i => i.message.includes('Wildcard import'));
      expect(wildcardIssues.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Multiple Files', () => {
    it('should detect issues across multiple files', async () => {
      const files: AnalysisFile[] = [
        {
          path: 'file1.ts',
          content: `
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    console.log(users[i], posts[j]);
  }
}
          `,
        },
        {
          path: 'file2.ts',
          content: `
window.addEventListener('scroll', handler);
          `,
        },
        {
          path: 'file3.tsx',
          content: `
<button onClick={() => doAction()}>Click</button>
          `,
        },
      ];

      const result = await detector.detect(files);
      expect(result.success).toBe(true);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);

      const file1Issues = result.issues.filter(i => i.filePath === 'file1.ts');
      const file2Issues = result.issues.filter(i => i.filePath === 'file2.ts');
      const file3Issues = result.issues.filter(i => i.filePath === 'file3.tsx');

      expect(file1Issues.length).toBeGreaterThan(0);
      expect(file2Issues.length).toBeGreaterThan(0);
      expect(file3Issues.length).toBeGreaterThan(0);
    });
  });

  describe('No Issues', () => {
    it('should return no issues for clean code', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
import { map } from 'lodash';

async function processData(items: Item[]): Promise<Result[]> {
  const content = await readFile('./data.json', 'utf-8');
  const data = JSON.parse(content);

  return items.map(item => transform(item));
}
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Metadata', () => {
    it('should include execution metadata', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: 'const x = 1;',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.filesAnalyzed).toBe(1);
      expect(result.metadata.executionTimeMs).toBeGreaterThan(0);
    });

    it('should track multiple files', async () => {
      const files: AnalysisFile[] = [
        { path: 'file1.ts', content: 'const x = 1;' },
        { path: 'file2.ts', content: 'const y = 2;' },
        { path: 'file3.ts', content: 'const z = 3;' },
      ];

      const result = await detector.detect(files);
      expect(result.success).toBe(true);
      expect(result.metadata.filesAnalyzed).toBe(3);
    });
  });
});
