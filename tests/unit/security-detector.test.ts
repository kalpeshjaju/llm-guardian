/**
 * FILE PURPOSE: Tests for SecurityDetector
 *
 * CONTEXT: Verifies security vulnerability detection patterns
 *
 * DEPENDENCIES: vitest, SecurityDetector
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { describe, it, expect } from 'vitest';
import { SecurityDetector } from '../../src/detectors/security-detector.js';
import type { AnalysisFile } from '../../src/detectors/types.js';

describe('SecurityDetector', () => {
  const detector = new SecurityDetector();

  describe('Hardcoded Secrets', () => {
    it('should detect AWS access keys', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const accessKey = "AKIAIOSFODNN7EXAMPLE";
const config = { key: accessKey };
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].category).toBe('security');
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[0].message).toContain('AWS Access Key');
    });

    it('should detect OpenAI API keys', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const apiKey = "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEF";
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
      const issue = result.issues.find(i => i.message.includes('OpenAI'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should detect GitHub tokens', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const token = "ghp_abcdefghijklmnopqrstuvwxyz123456";
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('GitHub'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should detect hardcoded passwords', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const dbConfig = {
  password: "SuperSecret123!",
  host: "localhost"
};
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Password'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should NOT flag environment variables', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const apiKey = process.env.API_KEY;
const secret = import.meta.env.SECRET_KEY;
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect JWT tokens', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('JWT'));
      expect(issue).toBeDefined();
    });
  });

  describe('SQL Injection', () => {
    it('should detect SQL injection in template literals', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const userId = req.params.id;
const result = await db.query(\`SELECT * FROM users WHERE id = \${userId}\`);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('SQL injection'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
      expect(issue?.suggestion).toContain('parameters');
    });

    it('should detect SQL injection in INSERT statements', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
await db.query(\`INSERT INTO users (name) VALUES ('\${userName}')\`);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('SQL injection'));
      expect(issue).toBeDefined();
    });

    it('should detect SQL injection in UPDATE statements', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
await db.query(\`UPDATE users SET name = '\${name}' WHERE id = \${id}\`);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('SQL injection'));
      expect(issue).toBeDefined();
    });

    it('should detect SQL injection in raw queries', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const query = db.raw(\`SELECT * FROM products WHERE category = '\${category}'\`);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('SQL injection'));
      expect(issue).toBeDefined();
    });
  });

  describe('XSS Vulnerabilities', () => {
    it('should detect dangerouslySetInnerHTML', async () => {
      const file: AnalysisFile = {
        path: 'test.tsx',
        content: `
return <div dangerouslySetInnerHTML={{ __html: userContent }} />;
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('XSS'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect innerHTML assignment', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
element.innerHTML = userInput;
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('XSS'));
      expect(issue).toBeDefined();
    });

    it('should detect document.write', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
document.write(userContent);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('XSS'));
      expect(issue).toBeDefined();
    });

    it('should detect eval', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const result = eval(userCode);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('XSS'));
      expect(issue).toBeDefined();
    });

    it('should detect new Function', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const fn = new Function('x', 'return x * 2');
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('XSS'));
      expect(issue).toBeDefined();
    });
  });

  describe('Command Injection', () => {
    it('should detect exec with template literals', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
exec(\`git clone \${userRepo}\`);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('command injection'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('critical');
    });

    it('should detect spawn with template literals', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
spawn(\`npm install \${packageName}\`);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('command injection'));
      expect(issue).toBeDefined();
    });

    it('should detect execSync with string concatenation', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
execSync('docker run ' + userImage);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('command injection'));
      expect(issue).toBeDefined();
    });
  });

  describe('Insecure Cryptography', () => {
    it('should detect createCipher', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const cipher = crypto.createCipher('aes-256-cbc', password);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('createCipheriv'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect MD5 usage', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const hash = crypto.createHash('MD5').update(data).digest('hex');
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('MD5'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect SHA1 usage', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const hash = SHA1(password);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('SHA1'));
      expect(issue).toBeDefined();
    });

    it('should detect Math.random for security', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const token = Math.random().toString(36);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('Math.random'));
      expect(issue).toBeDefined();
      expect(issue?.suggestion).toContain('crypto.randomBytes');
    });
  });

  describe('Path Traversal', () => {
    it('should detect readFileSync with concatenation', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const content = readFileSync('/uploads/' + userFile);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('path traversal'));
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('high');
    });

    it('should detect writeFileSync with concatenation', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
writeFileSync('./data/' + fileName, data);
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('path traversal'));
      expect(issue).toBeDefined();
    });

    it('should detect ../ patterns', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const filePath = '../../etc/passwd';
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      const issue = result.issues.find(i => i.message.includes('path traversal'));
      expect(issue).toBeDefined();
    });

    it('should NOT flag path.join usage', async () => {
      const file: AnalysisFile = {
        path: 'test.ts',
        content: `
const content = readFileSync(path.join(__dirname, userFile));
        `,
      };

      const result = await detector.detect([file]);
      expect(result.success).toBe(true);
      // Should not have path traversal issues when using path.join
      const issue = result.issues.find(i =>
        i.message.includes('path traversal') &&
        i.evidence?.includes('path.join')
      );
      expect(issue).toBeUndefined();
    });
  });

  describe('Multiple Files', () => {
    it('should detect issues across multiple files', async () => {
      const files: AnalysisFile[] = [
        {
          path: 'file1.ts',
          content: 'const apiKey = "sk-proj-abcdef1234567890";',
        },
        {
          path: 'file2.ts',
          content: 'exec(`rm -rf ${userPath}`);',
        },
        {
          path: 'file3.ts',
          content: 'element.innerHTML = userContent;',
        },
      ];

      const result = await detector.detect(files);
      expect(result.success).toBe(true);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);

      const file1Issues = result.issues.filter(i => i.filePath === 'file1.ts');
      const file2Issues = result.issues.filter(i => i.filePath === 'file2.ts');
      const file3Issues = result.issues.filter(i => i.filePath === 'file3.ts');

      expect(file1Issues.length).toBeGreaterThan(0);
      expect(file2Issues.length).toBeGreaterThan(0);
      expect(file3Issues.length).toBeGreaterThan(0);
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
  });
});
