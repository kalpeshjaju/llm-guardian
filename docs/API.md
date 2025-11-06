# LLM Guardian - API Reference

> Complete API documentation for developers integrating LLM Guardian into their workflows

**Version**: 1.0.0
**Last Updated**: 2025-11-06

---

## Table of Contents

- [CLI Commands](#cli-commands)
- [Detectors](#detectors)
- [Agents](#agents)
- [Configuration](#configuration)
- [Exit Codes](#exit-codes)
- [Programmatic Usage](#programmatic-usage)

---

## CLI Commands

### `check` - Run Detectors

Run detectors on staged files or all files.

```bash
llm-guardian check [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--all` | boolean | `false` | Check all files instead of just staged files |
| `--detectors <names>` | string | all | Comma-separated detector names to run |
| `--json` | boolean | `false` | Output results as JSON (for CI/CD) |
| `--suggest` | boolean | `false` | Generate LLM fix suggestions |
| `--fix` | boolean | `false` | Apply fixes automatically |
| `--confidence <threshold>` | number | `0.0` | Minimum confidence (0.0-1.0) for applying fixes |
| `--interactive` | boolean | `false` | Review fixes before applying |
| `--validate` | boolean | `false` | Run tests/type-check after fixes |

**Examples:**

```bash
# Check staged files (pre-commit)
llm-guardian check

# Check all files
llm-guardian check --all

# Check specific detectors
llm-guardian check --detectors hallucination,security

# Generate fix suggestions
llm-guardian check --suggest

# Apply fixes with confidence threshold
llm-guardian check --fix --confidence 0.8

# Interactive fix review
llm-guardian check --fix --interactive --validate

# CI/CD mode (JSON output)
llm-guardian check --all --json
```

**Exit Codes:**

- `0`: Success (no critical/high issues)
- `1`: Issues found (critical or high severity)
- `2`: Detector error

---

### `init` - Setup Git Hook

Install LLM Guardian as a Git pre-commit hook.

```bash
llm-guardian init [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--force` | boolean | `false` | Overwrite existing hook |
| `--blocking` | boolean | `false` | Block commits on errors (default: warnings only) |
| `--validate` | boolean | `false` | Run validation after fixes |

**Examples:**

```bash
# Install hook (non-blocking)
llm-guardian init

# Install blocking hook
llm-guardian init --blocking

# Overwrite existing hook
llm-guardian init --force
```

**What it does:**

1. Creates `.git/hooks/pre-commit` script
2. Runs `llm-guardian check` on staged files
3. Shows warnings (or blocks commit if `--blocking`)
4. Completes in <5 seconds

---

### `rollback` - Restore Backups

Restore files from `.llm-guardian-backup` backups.

```bash
llm-guardian rollback [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--list` | boolean | `false` | List available backups |
| `--file <path>` | string | all | Restore specific file only |
| `--cleanup` | boolean | `false` | Delete all backups |

**Examples:**

```bash
# List backups
llm-guardian rollback --list

# Restore all files
llm-guardian rollback

# Restore specific file
llm-guardian rollback --file src/payment.ts

# Clean up backups
llm-guardian rollback --cleanup
```

---

### `config` - Manage Configuration

View or update configuration settings.

```bash
llm-guardian config [key] [value]
```

**Examples:**

```bash
# View all config
llm-guardian config

# View specific key
llm-guardian config detectors.hallucination.enabled

# Set value
llm-guardian config hook.blocking true
```

---

## Detectors

### HallucinationDetector

Detects fake packages, deprecated APIs, and incorrect imports.

**Category**: `hallucination`

**Detects:**
- Non-existent npm packages
- Deprecated APIs (40+ patterns)
- Invalid imports
- Fake methods

**Example Issues:**

```typescript
// ❌ Fake package
import { Stripe } from 'stripe-pro';
// ✅ Fix: import { Stripe } from 'stripe';

// ❌ Deprecated API
stripe.charges.create({ amount: 1000 });
// ✅ Fix: stripe.paymentIntents.create({ amount: 1000 });
```

**Configuration:**

```json
{
  "detectors": {
    "hallucination": {
      "enabled": true,
      "checkNpmPackages": true,
      "checkDeprecatedApis": true
    }
  }
}
```

---

### CodeQualityDetector

Detects type safety issues, large files, and missing error handling.

**Category**: `code-quality`

**Detects:**
- `any` types
- Files >600 lines
- Functions >150 lines
- Missing error handling
- Promise chains without `.catch()`

**Example Issues:**

```typescript
// ❌ Type safety issue
const data: any = await fetchData();
// ✅ Fix: const data: UserData = await fetchData();

// ❌ Missing error handling
const result = await riskyOperation();
// ✅ Fix:
try {
  const result = await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  throw error;
}
```

**Configuration:**

```json
{
  "detectors": {
    "codeQuality": {
      "enabled": true,
      "maxFileLines": 600,
      "maxFunctionLines": 150,
      "disallowAnyType": true
    }
  }
}
```

---

### SecurityDetector

Detects security vulnerabilities (OWASP guidelines).

**Category**: `security`

**Detects:**
1. **Hardcoded Secrets**: API keys, passwords, tokens
2. **SQL Injection**: Template literals, string concatenation
3. **XSS**: dangerouslySetInnerHTML, innerHTML, eval
4. **Command Injection**: exec/spawn with user input
5. **Insecure Crypto**: MD5/SHA1, Math.random
6. **Path Traversal**: File operations with user input

**Example Issues:**

```typescript
// ❌ Hardcoded secret
const apiKey = "sk-proj-abc123...";
// ✅ Fix: const apiKey = process.env.OPENAI_API_KEY;

// ❌ SQL injection
await db.query(`SELECT * FROM users WHERE id = ${userId}`);
// ✅ Fix: await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ❌ XSS
element.innerHTML = userContent;
// ✅ Fix: element.textContent = userContent;
```

**Configuration:**

```json
{
  "detectors": {
    "security": {
      "enabled": true,
      "checkSecrets": true,
      "checkInjection": true
    }
  }
}
```

---

### PerformanceDetector

Detects performance anti-patterns.

**Category**: `performance`

**Detects:**
1. **Inefficient Loops**: Nested loops (O(n²)), array operations in loops
2. **Memory Leaks**: Event listeners/timers without cleanup
3. **Unnecessary Re-renders**: Inline styles/functions in JSX
4. **Blocking Operations**: Sync file I/O, JSON.parse in loops
5. **Large Imports**: Lodash wildcard, namespace imports

**Example Issues:**

```typescript
// ❌ Nested loop (O(n²))
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < posts.length; j++) {
    // Match users to posts
  }
}
// ✅ Fix: Use Map for O(n) lookup
const postsByUser = new Map();
posts.forEach(p => postsByUser.set(p.userId, p));

// ❌ Memory leak
window.addEventListener('resize', handler);
// ✅ Fix:
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

**Configuration:**

```json
{
  "detectors": {
    "performance": {
      "enabled": true,
      "checkComplexity": true,
      "checkMemoryLeaks": true
    }
  }
}
```

---

## Agents

### ProposerAgent

Generates LLM-powered fix suggestions.

**Purpose**: Enrich issues with AI-generated fixes

**Usage:**

```typescript
import { ProposerAgent } from 'llm-guardian';

const proposer = new ProposerAgent(provider, { maxConcurrent: 3 });
const enrichedIssues = await proposer.enrichIssues(issues, files);

// Statistics
const stats = ProposerAgent.getStatistics(enrichedIssues);
console.log(`Generated ${stats.withFix} fixes, avg confidence: ${stats.avgConfidence}`);
```

**Configuration:**

```typescript
{
  maxConcurrent: 3,        // Parallel LLM calls
  timeoutMs: 15000,        // Per-fix timeout
  retries: 3               // Retry failed fixes
}
```

---

### SolverAgent

Applies fixes to files automatically.

**Purpose**: Apply string-based fixes with backups

**Usage:**

```typescript
import { SolverAgent } from 'llm-guardian';

const solver = new SolverAgent({
  dryRun: false,
  createBackups: true,
  minConfidence: 0.8
});

const fixResults = await solver.applyFixes(issues);

// Statistics
const stats = SolverAgent.getStatistics(fixResults);
console.log(`Applied ${stats.successful} fixes across ${stats.filesModified} files`);
```

**Configuration:**

```typescript
{
  dryRun: false,           // Preview without applying
  createBackups: true,     // Create .llm-guardian-backup files
  minConfidence: 0.8       // Minimum confidence (0.0-1.0)
}
```

---

### JudgeAgent

Validates fixes don't break code.

**Purpose**: Run tests/type-check after fixes

**Usage:**

```typescript
import { JudgeAgent } from 'llm-guardian';

const judge = new JudgeAgent({
  runTypeCheck: true,
  runTests: true,
  runLint: false
});

const validationResults = await judge.validateFixes(fixResults);

// Statistics
const stats = JudgeAgent.getStatistics(validationResults);
console.log(`Validated: ${stats.passed}/${stats.total} passed`);
```

**Configuration:**

```typescript
{
  runTypeCheck: true,      // Run tsc --noEmit
  runTests: true,          // Run npm test
  runLint: false,          // Run npm run lint (optional)
  timeoutMs: 60000         // Validation timeout
}
```

---

## Configuration

### `.llm-guardian.json`

Project-level configuration file.

**Location**: Project root

**Schema:**

```json
{
  "detectors": {
    "hallucination": {
      "enabled": true,
      "checkNpmPackages": true,
      "checkDeprecatedApis": true
    },
    "codeQuality": {
      "enabled": true,
      "maxFileLines": 600,
      "maxFunctionLines": 150,
      "disallowAnyType": true
    },
    "security": {
      "enabled": true,
      "checkSecrets": true,
      "checkInjection": true
    },
    "performance": {
      "enabled": true,
      "checkComplexity": true,
      "checkMemoryLeaks": true
    }
  },
  "hook": {
    "blocking": false,
    "timeout": 5000
  },
  "llm": {
    "provider": "claude-cli",
    "retries": 3
  }
}
```

---

## Exit Codes

| Code | Meaning | When |
|------|---------|------|
| `0` | Success | No critical/high issues |
| `1` | Issues found | Critical or high severity issues detected |
| `2` | Detector error | Detector crashed or failed to run |

**CI/CD Usage:**

```bash
# Fail build on issues
llm-guardian check --all || exit 1

# Continue on warnings
llm-guardian check --all || true
```

---

## Programmatic Usage

### Running Detectors

```typescript
import { HallucinationDetector, SecurityDetector } from 'llm-guardian';

const detector = new HallucinationDetector();
const files = [
  {
    path: 'src/payment.ts',
    content: await readFile('src/payment.ts', 'utf-8')
  }
];

const result = await detector.detect(files);

if (result.success) {
  console.log(`Found ${result.issues.length} issues`);
  result.issues.forEach(issue => {
    console.log(`${issue.severity}: ${issue.message}`);
  });
}
```

### Multi-Agent Pipeline

```typescript
import { ProposerAgent, SolverAgent, JudgeAgent, CLIProvider } from 'llm-guardian';

// 1. Detect issues
const detector = new SecurityDetector();
let issues = await detector.detect(files);

// 2. Generate fixes (Proposer)
const provider = new CLIProvider();
const proposer = new ProposerAgent(provider);
issues = await proposer.enrichIssues(issues, files);

// 3. Apply fixes (Solver)
const solver = new SolverAgent({ minConfidence: 0.8 });
const fixResults = await solver.applyFixes(issues);

// 4. Validate (Judge)
const judge = new JudgeAgent({ runTypeCheck: true, runTests: true });
const validationResults = await judge.validateFixes(fixResults);

console.log('Pipeline complete!');
```

---

## Type Definitions

### Issue

```typescript
interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'hallucination' | 'code-quality' | 'security' | 'performance';
  filePath: string;
  line: number;
  column?: number;
  message: string;
  suggestion?: string;
  evidence: string;
  fix?: Fix;
  metadata?: Record<string, unknown>;
}
```

### Fix

```typescript
interface Fix {
  type: 'string-replace' | 'regex-replace' | 'ast-transform' | 'llm-generated';
  search: string | RegExp;
  replace: string;
  confidence?: number;
  explanation?: string;
}
```

### DetectorResult

```typescript
interface DetectorResult {
  detectorName: string;
  success: boolean;
  issues: Issue[];
  error?: string;
  metadata: {
    filesAnalyzed: number;
    executionTimeMs: number;
    [key: string]: unknown;
  };
}
```

---

## Support

- **Documentation**: https://github.com/kalpeshjaju/llm-guardian
- **Issues**: https://github.com/kalpeshjaju/llm-guardian/issues
- **npm**: https://www.npmjs.com/package/llm-guardian

---

**Generated with**: Claude Code
**License**: MIT
