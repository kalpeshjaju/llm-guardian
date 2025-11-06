# LLM Guardian - Usage Examples

> Practical examples for common workflows and use cases

**Last Updated**: 2025-11-06

---

## Table of Contents

- [Quick Start](#quick-start)
- [Pre-commit Hook](#pre-commit-hook)
- [CI/CD Integration](#cicd-integration)
- [Fix Workflows](#fix-workflows)
- [Custom Detectors](#custom-detectors)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install and Setup

```bash
# Install globally
npm install -g llm-guardian

# Or install in project
npm install --save-dev llm-guardian

# Initialize in your project
cd your-project
llm-guardian init
```

### 2. Run Your First Check

```bash
# Check staged files (pre-commit workflow)
git add .
llm-guardian check

# Check all files
llm-guardian check --all

# Check specific detector
llm-guardian check --detectors security
```

### 3. Get Fix Suggestions

```bash
# Generate AI-powered fix suggestions
llm-guardian check --suggest

# Apply fixes with high confidence
llm-guardian check --fix --confidence 0.8

# Interactive review before applying
llm-guardian check --fix --interactive
```

---

## Pre-commit Hook

### Non-Blocking (Recommended for Teams)

Shows warnings but allows commit to proceed.

```bash
# Install non-blocking hook
llm-guardian init

# Commit workflow
git add src/payment.ts
git commit -m "Add payment feature"

# Output:
# 🛡️  LLM Guardian - Pre-commit Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Analyzed: 1 file in 245ms
#
# ⚠️  HIGH (1)
# src/payment.ts:42 - Deprecated API: stripe.charges.create()
# Suggestion: Use stripe.paymentIntents.create() instead
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚠️  1 issue found - review before merging
# Commit proceeding...
```

### Blocking (Strict Mode)

Prevents commits with critical/high issues.

```bash
# Install blocking hook
llm-guardian init --blocking

# Commit workflow
git add src/auth.ts
git commit -m "Add auth"

# Output:
# 🛡️  LLM Guardian - Pre-commit Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ❌ CRITICAL (1)
# src/auth.ts:15 - Hardcoded API key detected
#
# ❌ Commit blocked - fix critical issues first
# Run: llm-guardian check --fix --interactive

# Fix and retry
llm-guardian check --fix --interactive
git commit -m "Add auth"  # Now succeeds
```

---

## CI/CD Integration

### GitHub Actions

`.github/workflows/llm-guardian.yml`:

```yaml
name: LLM Guardian Check

on:
  pull_request:
    paths: ['src/**', 'tests/**']
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install LLM Guardian
        run: npm install -g llm-guardian

      - name: Run Detectors
        run: llm-guardian check --all --json > results.json

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: llm-guardian-results
          path: results.json

      - name: Fail on Critical Issues
        run: |
          CRITICAL=$(jq '.issues | map(select(.severity == "critical")) | length' results.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ $CRITICAL critical issues found"
            exit 1
          fi
```

### GitLab CI

`.gitlab-ci.yml`:

```yaml
llm-guardian:
  stage: test
  image: node:20
  before_script:
    - npm install -g llm-guardian
  script:
    - llm-guardian check --all --json > results.json
    - |
      CRITICAL=$(jq '.issues | map(select(.severity == "critical")) | length' results.json)
      if [ "$CRITICAL" -gt 0 ]; then
        echo "❌ $CRITICAL critical issues found"
        exit 1
      fi
  artifacts:
    paths:
      - results.json
    expire_in: 1 week
```

### CircleCI

`.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  llm-guardian:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Install LLM Guardian
          command: npm install -g llm-guardian
      - run:
          name: Run Detectors
          command: llm-guardian check --all --json
      - store_artifacts:
          path: results.json

workflows:
  main:
    jobs:
      - llm-guardian
```

---

## Fix Workflows

### Scenario 1: Quick Auto-Fix (High Confidence)

**Use case**: Fix obvious issues automatically

```bash
# Apply fixes with 90% confidence threshold
llm-guardian check --fix --confidence 0.9

# Output:
# ✅ Applied 12 fixes across 5 files
#   42 lines modified
#   Confidence threshold: 90%
#   Backups created (use 'llm-guardian rollback' to undo)
```

### Scenario 2: Interactive Review (Recommended)

**Use case**: Review each fix before applying

```bash
llm-guardian check --fix --interactive

# Output:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Fix 1/5 - src/payment.ts:42
#
# Issue: Deprecated API: stripe.charges.create()
# Severity: high
# Confidence: 0.92
#
# Search:
# stripe.charges.create({ amount: 1000 })
#
# Replace:
# stripe.paymentIntents.create({ amount: 1000 })
#
# Apply this fix? (y/n/a/q): y
# ✅ Applied
#
# Fix 2/5 - src/auth.ts:15
# ...

# Final summary:
# ✅ Applied 4 fixes
# ⏭️  Skipped 1 fix
```

### Scenario 3: Fix + Validate

**Use case**: Ensure fixes don't break code

```bash
llm-guardian check --fix --interactive --validate

# Output after applying fixes:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Validating fixes...
#
# Running type-check... ✅ Pass
# Running tests... ✅ Pass (42 tests)
#
# ✅ All fixes validated successfully
```

### Scenario 4: Rollback if Issues

**Use case**: Undo fixes that caused problems

```bash
# List backups
llm-guardian rollback --list

# Output:
# Available backups:
#   src/payment.ts.llm-guardian-backup (2025-11-06 12:30)
#   src/auth.ts.llm-guardian-backup (2025-11-06 12:30)
#   src/utils.ts.llm-guardian-backup (2025-11-06 12:30)

# Restore all
llm-guardian rollback

# Or restore specific file
llm-guardian rollback --file src/payment.ts
```

---

## Custom Detectors

### Example: Custom Business Logic Detector

```typescript
// detectors/business-rules-detector.ts

import type { IDetector, DetectorResult, Issue, AnalysisFile } from 'llm-guardian';

export class BusinessRulesDetector implements IDetector {
  readonly name = 'business-rules';
  readonly supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

  async detect(files: AnalysisFile[]): Promise<DetectorResult> {
    const startTime = Date.now();
    const issues: Issue[] = [];

    for (const file of files) {
      // Example: Enforce company-specific rules

      // Rule 1: All API calls must have timeout
      if (file.content.includes('fetch(') && !file.content.includes('signal:')) {
        const lines = file.content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('fetch(')) {
            issues.push({
              id: `missing-timeout-${file.path}-${index}`,
              severity: 'medium',
              category: 'code-quality',
              filePath: file.path,
              line: index + 1,
              message: 'API call missing timeout',
              suggestion: 'Add AbortController with timeout',
              evidence: line.trim(),
            });
          }
        });
      }

      // Rule 2: All error logs must include context
      if (file.content.includes('console.error(error)')) {
        const lines = file.content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('console.error(error)') &&
              !line.includes('context')) {
            issues.push({
              id: `missing-error-context-${file.path}-${index}`,
              severity: 'low',
              category: 'code-quality',
              filePath: file.path,
              line: index + 1,
              message: 'Error log missing context',
              suggestion: 'Include operation context in error log',
              evidence: line.trim(),
            });
          }
        });
      }
    }

    return {
      detectorName: this.name,
      success: true,
      issues,
      metadata: {
        filesAnalyzed: files.length,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }
}
```

### Usage:

```typescript
// Run custom detector
import { BusinessRulesDetector } from './detectors/business-rules-detector';

const detector = new BusinessRulesDetector();
const result = await detector.detect(files);
```

---

## Troubleshooting

### Issue: "No files to analyze"

**Cause**: No staged files or empty directory

**Solution**:

```bash
# Check git status
git status

# Stage files
git add src/

# Or use --all flag
llm-guardian check --all
```

### Issue: "Detector 'hallucination' failed"

**Cause**: Network error (npm registry check)

**Solution**:

```bash
# Disable network checks temporarily
llm-guardian check --detectors code-quality,security

# Or check npm registry accessibility
curl https://registry.npmjs.org/express
```

### Issue: "Could not generate suggestions (claude CLI not available)"

**Cause**: Claude CLI not installed

**Solution**:

```bash
# Install Claude CLI
npm install -g @anthropic-ai/claude-code

# Or disable suggestions
llm-guardian check  # (without --suggest flag)
```

### Issue: Tests failing after fixes

**Cause**: Fix broke existing functionality

**Solution**:

```bash
# Rollback fixes
llm-guardian rollback

# Review and apply selectively
llm-guardian check --fix --interactive --validate
```

### Issue: Pre-commit hook too slow (>5s)

**Cause**: Too many files being checked

**Solution**:

```bash
# Edit .git/hooks/pre-commit
# Add timeout flag:
llm-guardian check --timeout 5000

# Or limit to specific detectors
llm-guardian check --detectors hallucination,security
```

---

## Advanced Usage

### Programmatic Integration

```typescript
import {
  HallucinationDetector,
  SecurityDetector,
  ProposerAgent,
  SolverAgent,
  JudgeAgent,
  CLIProvider
} from 'llm-guardian';

async function runFullPipeline() {
  // 1. Read files
  const files = await getProjectFiles();

  // 2. Run detectors in parallel
  const [hallucination, security] = await Promise.all([
    new HallucinationDetector().detect(files),
    new SecurityDetector().detect(files),
  ]);

  let allIssues = [
    ...hallucination.issues,
    ...security.issues,
  ];

  console.log(`Found ${allIssues.length} issues`);

  // 3. Generate fixes (Proposer)
  const provider = new CLIProvider();
  const proposer = new ProposerAgent(provider);
  allIssues = await proposer.enrichIssues(allIssues, files);

  const withFix = allIssues.filter(i => i.fix);
  console.log(`Generated ${withFix.length} fix suggestions`);

  // 4. Apply fixes (Solver)
  const solver = new SolverAgent({
    dryRun: false,
    createBackups: true,
    minConfidence: 0.8,
  });

  const fixResults = await solver.applyFixes(withFix);
  console.log(`Applied ${fixResults.filter(r => r.success).length} fixes`);

  // 5. Validate (Judge)
  const judge = new JudgeAgent({
    runTypeCheck: true,
    runTests: true,
  });

  const validationResults = await judge.validateFixes(fixResults);
  const passed = validationResults.filter(r => r.success).length;

  console.log(`Validated: ${passed}/${validationResults.length} passed`);

  if (passed === validationResults.length) {
    console.log('✅ Pipeline complete - all fixes validated!');
  } else {
    console.log('⚠️  Some fixes failed validation - rolling back...');
    // Rollback logic here
  }
}

runFullPipeline();
```

### Monitoring & Metrics

```typescript
import { MetricsCollector } from 'llm-guardian';

const metrics = new MetricsCollector();

// Track detector performance
const result = await detector.detect(files);
metrics.record({
  detector: detector.name,
  filesAnalyzed: result.metadata.filesAnalyzed,
  issuesFound: result.issues.length,
  executionTimeMs: result.metadata.executionTimeMs,
  timestamp: Date.now(),
});

// Generate report
const report = metrics.generateReport();
console.log(`Average execution time: ${report.avgExecutionTime}ms`);
console.log(`Total issues found: ${report.totalIssues}`);
```

---

## Best Practices

### 1. Start Non-Blocking

```bash
# Don't block commits initially (team adoption)
llm-guardian init

# Move to blocking after team is familiar
llm-guardian init --force --blocking
```

### 2. Use Confidence Thresholds

```bash
# Start conservative (90%+)
llm-guardian check --fix --confidence 0.9

# Lower threshold as you gain confidence
llm-guardian check --fix --confidence 0.7
```

### 3. Always Validate Critical Fixes

```bash
# Security and hallucination fixes should be validated
llm-guardian check --detectors security,hallucination \
  --fix --interactive --validate
```

### 4. Review Before Merging

```bash
# In PRs, review LLM Guardian output
llm-guardian check --all --json > guardian-report.json

# Add to PR description
```

### 5. Incremental Adoption

```bash
# Week 1: Run manually, observe
llm-guardian check --all

# Week 2: Install hook (non-blocking)
llm-guardian init

# Week 3: Enable auto-fix (low confidence)
llm-guardian init --force
# Update hook to: llm-guardian check --fix --confidence 0.9

# Week 4: Enable blocking mode
llm-guardian init --force --blocking
```

---

## Support & Resources

- **API Reference**: [API.md](./API.md)
- **Integration Guide**: [INTEGRATION.md](./INTEGRATION.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **GitHub Issues**: https://github.com/kalpeshjaju/llm-guardian/issues

---

**Generated with**: Claude Code
**License**: MIT
