/**
 * FILE PURPOSE: Unit tests for Hallucination Detector
 *
 * CONTEXT: Test fake package detection, deprecated APIs, and import extraction
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HallucinationDetector } from '../../src/detectors/hallucination-detector.js';
import { clearPackageCache } from '../../src/utils/npm-registry.js';
import type { AnalysisFile } from '../../src/detectors/types.js';

describe('HallucinationDetector', () => {
  let detector: HallucinationDetector;

  beforeEach(() => {
    detector = new HallucinationDetector();
    clearPackageCache(); // Start fresh for each test
  });

  describe('Fake Package Detection', () => {
    it('should detect fake npm package', async () => {
      const file: AnalysisFile = {
        path: '/test/payment.ts',
        content: `import { Stripe } from 'stripe-pro';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);

      const fakePackageIssue = result.issues.find(i => i.id.includes('fake-package'));
      expect(fakePackageIssue).toBeDefined();
      expect(fakePackageIssue?.severity).toBe('critical');
      expect(fakePackageIssue?.message).toContain('stripe-pro');
      expect(fakePackageIssue?.message).toContain('does not exist');
    });

    it('should NOT flag real npm packages', async () => {
      const file: AnalysisFile = {
        path: '/test/payment.ts',
        content: `import Stripe from 'stripe';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const fakePackageIssues = result.issues.filter(i => i.id.includes('fake-package'));
      expect(fakePackageIssues.length).toBe(0);
    });

    it('should handle scoped packages correctly', async () => {
      const file: AnalysisFile = {
        path: '/test/ai.ts',
        content: `import Anthropic from '@anthropic-ai/sdk';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const fakePackageIssues = result.issues.filter(i => i.id.includes('fake-package'));
      expect(fakePackageIssues.length).toBe(0); // @anthropic-ai/sdk exists
    });

    it('should handle package sub-paths correctly', async () => {
      const file: AnalysisFile = {
        path: '/test/utils.ts',
        content: `import debounce from 'lodash/debounce';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const fakePackageIssues = result.issues.filter(i => i.id.includes('fake-package'));
      expect(fakePackageIssues.length).toBe(0); // lodash exists
    });
  });

  describe('Deprecated API Detection', () => {
    it('should detect deprecated Stripe API', async () => {
      const file: AnalysisFile = {
        path: '/test/payment.ts',
        content: `
          import Stripe from 'stripe';
          const stripe = new Stripe(process.env.STRIPE_KEY);

          // Deprecated API
          const charge = await stripe.charges.create({
            amount: 1000,
            currency: 'usd'
          });
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const deprecatedAPIIssue = result.issues.find(i => i.id.includes('deprecated-api'));
      expect(deprecatedAPIIssue).toBeDefined();
      expect(deprecatedAPIIssue?.severity).toBe('high');
      expect(deprecatedAPIIssue?.message).toContain('Deprecated API');
      expect(deprecatedAPIIssue?.suggestion).toContain('paymentIntents');
    });

    it('should detect deprecated OpenAI API', async () => {
      const file: AnalysisFile = {
        path: '/test/ai.ts',
        content: `
          import OpenAI from 'openai';
          const openai = new OpenAI();

          const response = await openai.Completion.create({
            prompt: 'Hello',
            model: 'text-davinci-003'
          });
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const deprecatedAPIIssues = result.issues.filter(i => i.id.includes('deprecated-api'));
      expect(deprecatedAPIIssues.length).toBeGreaterThan(0);
    });

    it('should detect deprecated React lifecycle methods', async () => {
      const file: AnalysisFile = {
        path: '/test/Component.tsx',
        content: `import React from 'react';

class MyComponent extends React.Component {
  componentWillMount() {
    console.log('Mounting...');
  }
}`,
        extension: '.tsx',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      const deprecatedAPIIssues = result.issues.filter(i => i.id.includes('deprecated-api'));
      // Should detect lifecycle method deprecation
      expect(deprecatedAPIIssues.length).toBeGreaterThanOrEqual(1);
      // Verify it's the React deprecation
      const reactDeprecation = deprecatedAPIIssues.find(i => i.metadata?.package === 'react');
      expect(reactDeprecation).toBeDefined();
    });
  });

  describe('Import Extraction', () => {
    it('should extract ES6 default imports', async () => {
      const file: AnalysisFile = {
        path: '/test/imports.ts',
        content: `import React from 'react';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.packagesChecked).toBeGreaterThan(0);
    });

    it('should extract ES6 named imports', async () => {
      const file: AnalysisFile = {
        path: '/test/imports.ts',
        content: `import { useState, useEffect } from 'react';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.packagesChecked).toBeGreaterThan(0);
    });

    it('should extract ES6 namespace imports', async () => {
      const file: AnalysisFile = {
        path: '/test/imports.ts',
        content: `import * as React from 'react';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.packagesChecked).toBeGreaterThan(0);
    });

    it('should extract CommonJS requires', async () => {
      const file: AnalysisFile = {
        path: '/test/imports.js',
        content: `const express = require('express');`,
        extension: '.js',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.packagesChecked).toBeGreaterThan(0);
    });

    it('should extract dynamic imports', async () => {
      const file: AnalysisFile = {
        path: '/test/imports.ts',
        content: `const module = await import('some-package');`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.packagesChecked).toBeGreaterThan(0);
    });

    it('should extract TypeScript type imports', async () => {
      const file: AnalysisFile = {
        path: '/test/types.ts',
        content: `import type { Stripe } from 'stripe';`,
        extension: '.ts',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.packagesChecked).toBeGreaterThan(0);
    });

    it('should ignore relative imports', async () => {
      const file: AnalysisFile = {
        path: '/test/imports.ts',
        content: `
          import { helper } from './utils';
          import config from '../config';
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.metadata.packagesChecked).toBe(0); // No external packages
    });
  });

  describe('Multiple Files', () => {
    it('should analyze multiple files and batch check packages', async () => {
      const files: AnalysisFile[] = [
        {
          path: '/test/file1.ts',
          content: `import Stripe from 'stripe';`,
          extension: '.ts',
        },
        {
          path: '/test/file2.ts',
          content: `import OpenAI from 'openai';`,
          extension: '.ts',
        },
        {
          path: '/test/file3.ts',
          content: `import { Anthropic } from '@anthropic-ai/sdk';`,
          extension: '.ts',
        },
      ];

      const result = await detector.detect(files);

      expect(result.success).toBe(true);
      expect(result.metadata.filesAnalyzed).toBe(3);
      expect(result.metadata.packagesChecked).toBe(3); // stripe, openai, @anthropic-ai/sdk
    });

    it('should deduplicate package checks across files', async () => {
      const files: AnalysisFile[] = [
        {
          path: '/test/file1.ts',
          content: `import Stripe from 'stripe';`,
          extension: '.ts',
        },
        {
          path: '/test/file2.ts',
          content: `import { Stripe } from 'stripe';`, // Same package
          extension: '.ts',
        },
      ];

      const result = await detector.detect(files);

      expect(result.success).toBe(true);
      expect(result.metadata.filesAnalyzed).toBe(2);
      expect(result.metadata.packagesChecked).toBe(1); // Only 'stripe' (deduplicated)
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
      expect(result.metadata.packagesChecked).toBe(0);
    });

    it('should handle files with no imports', async () => {
      const file: AnalysisFile = {
        path: '/test/no-imports.ts',
        content: `
          const x = 5;
          function add(a: number, b: number) {
            return a + b;
          }
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.metadata.packagesChecked).toBe(0);
    });

    it('should handle malformed import statements gracefully', async () => {
      const file: AnalysisFile = {
        path: '/test/malformed.ts',
        content: `
          import from 'package'; // Malformed
          import { } from ; // Malformed
        `,
        extension: '.ts',
      };

      const result = await detector.detect([file]);

      // Should not crash, might not detect anything
      expect(result.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete within performance budget (<5s for 10 files)', async () => {
      const files: AnalysisFile[] = Array.from({ length: 10 }, (_, i) => ({
        path: `/test/file${i}.ts`,
        content: `
          import Stripe from 'stripe';
          import OpenAI from 'openai';
          import { Anthropic } from '@anthropic-ai/sdk';
        `,
        extension: '.ts',
      }));

      const startTime = Date.now();
      const result = await detector.detect(files);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // <5s budget
      expect(result.metadata.executionTimeMs).toBeLessThan(5000);
    }, 10000); // 10s test timeout
  });
});
