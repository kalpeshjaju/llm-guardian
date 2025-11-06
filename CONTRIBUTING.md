# Contributing to LLM Guardian

> Thank you for your interest in contributing to LLM Guardian!

We welcome contributions of all kinds: bug reports, feature requests, documentation improvements, and code contributions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

---

## Getting Started

### Ways to Contribute

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Request Features**: Describe the use case and expected behavior
3. **Improve Docs**: Fix typos, add examples, clarify explanations
4. **Write Code**: Fix bugs, implement features, add detectors

### Good First Issues

Look for issues labeled `good-first-issue` or `help-wanted` in the [issue tracker](https://github.com/kalpeshjaju/llm-guardian/issues).

---

## Development Setup

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Git**: 2.x or higher
- **Claude CLI** (optional): For testing LLM integration

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/kalpeshjaju/llm-guardian.git
cd llm-guardian

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Type-check
npm run type-check

# Lint
npm run lint
```

### Development Workflow

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Run specific tests
npm test -- tests/unit/security-detector.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## Making Changes

### Branch Naming

Use descriptive branch names with prefixes:

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `test/description` - Test improvements
- `refactor/description` - Code refactoring

**Examples:**

```bash
git checkout -b feat/add-typescript-detector
git checkout -b fix/security-detector-false-positive
git checkout -b docs/update-api-reference
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `chore`: Maintenance

**Examples:**

```bash
feat(detectors): Add TypeScript-specific detector

- Detects unused imports
- Detects implicit any types
- Includes 15 comprehensive tests

Closes #42

fix(security): Fix false positive in SQL injection detection

The detector was flagging safe parameterized queries.
Now checks for proper parameter binding.

Fixes #38
```

### Code Style

We use **ESLint** and **Prettier** for code formatting.

```bash
# Auto-fix style issues
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format:write
```

**Key rules:**

- Use TypeScript strict mode
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Prefer `const` over `let`
- Use template literals over string concatenation
- Add JSDoc comments for public APIs

---

## Testing

### Test Structure

```
tests/
├── unit/              # Unit tests for individual modules
│   ├── detectors/
│   ├── agents/
│   └── llm/
└── integration/       # End-to-end integration tests
```

### Writing Tests

Use **Vitest** for testing.

**Example: Detector Test**

```typescript
import { describe, it, expect } from 'vitest';
import { MyDetector } from '../../src/detectors/my-detector.js';

describe('MyDetector', () => {
  const detector = new MyDetector();

  describe('Feature X', () => {
    it('should detect issue Y', async () => {
      const file = {
        path: 'test.ts',
        content: `const x = problematicCode();`,
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('high');
      expect(result.issues[0].message).toContain('description');
    });

    it('should NOT detect false positives', async () => {
      const file = {
        path: 'test.ts',
        content: `const x = safeCode();`,
      };

      const result = await detector.detect([file]);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/security-detector.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Coverage Requirements

- **Unit tests**: 90%+ coverage
- **Integration tests**: Critical paths covered
- **All new code**: Must include tests

---

## Pull Request Process

### Before Submitting

1. **Run all checks**:
   ```bash
   npm run type-check
   npm run lint
   npm test
   npm run build
   ```

2. **Update documentation** if needed:
   - `README.md` for user-facing changes
   - `docs/API.md` for API changes
   - `docs/EXAMPLES.md` for new examples

3. **Add tests** for new features or bug fixes

4. **Update CHANGELOG.md** with your changes

### Submitting

1. **Push your branch**:
   ```bash
   git push origin feat/your-feature
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template**:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)

### PR Template

```markdown
## Summary
[Brief description of changes]

## Changes
- [Specific change 1]
- [Specific change 2]

## Related Issues
Fixes #123
Closes #456

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass (`npm test`)
- [ ] Type-check passes (`npm run type-check`)
- [ ] Lint passes (`npm run lint`)

## Documentation
- [ ] API docs updated (if API changed)
- [ ] Examples updated (if needed)
- [ ] CHANGELOG.md updated

## Screenshots (if applicable)
[Add screenshots here]
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainer(s)
3. **Address feedback** if requested
4. **Merge** once approved

---

## Project Structure

```
llm-guardian/
├── src/
│   ├── agents/          # Multi-Agent Evolve pipeline
│   │   ├── proposer.ts  # LLM fix generator
│   │   ├── solver.ts    # Fix applicator
│   │   └── judge.ts     # Fix validator
│   ├── cli/             # Command-line interface
│   │   ├── commands/    # CLI commands
│   │   └── utils/       # CLI utilities
│   ├── detectors/       # Detection engines
│   │   ├── hallucination-detector.ts
│   │   ├── code-quality-detector.ts
│   │   ├── security-detector.ts
│   │   ├── performance-detector.ts
│   │   └── types.ts     # Shared types
│   ├── llm/             # LLM providers
│   │   ├── cli-provider.ts
│   │   ├── prompts.ts
│   │   └── types.ts
│   └── utils/           # Shared utilities
│       └── deprecated-apis.ts
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── docs/                # Documentation
│   ├── API.md
│   ├── EXAMPLES.md
│   └── decisions/       # Architecture Decision Records
├── dist/                # Compiled output (generated)
└── coverage/            # Test coverage (generated)
```

### Key Files

- `src/detectors/types.ts`: Core type definitions
- `src/cli/commands/check.ts`: Main check command
- `src/agents/*.ts`: Multi-Agent Evolve pipeline
- `tests/unit/*.test.ts`: Unit tests

---

## Adding a New Detector

### 1. Create Detector File

```typescript
// src/detectors/my-detector.ts

import type { IDetector, DetectorResult, Issue, AnalysisFile } from './types.js';

export class MyDetector implements IDetector {
  readonly name = 'my-detector';
  readonly version = '1.0.0';
  readonly category = 'code-quality' as const;
  readonly supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

  async detect(files: AnalysisFile[]): Promise<DetectorResult> {
    const startTime = Date.now();
    const issues: Issue[] = [];

    try {
      for (const file of files) {
        // Detection logic here
        issues.push(...this.detectIssueX(file));
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

  private detectIssueX(file: AnalysisFile): Issue[] {
    const issues: Issue[] = [];
    // Detection logic
    return issues;
  }
}
```

### 2. Add Tests

```typescript
// tests/unit/my-detector.test.ts

import { describe, it, expect } from 'vitest';
import { MyDetector } from '../../src/detectors/my-detector.js';

describe('MyDetector', () => {
  const detector = new MyDetector();

  it('should detect issue X', async () => {
    // Test code here
  });

  it('should NOT flag false positives', async () => {
    // Test code here
  });
});
```

### 3. Integrate

```typescript
// src/cli/commands/check.ts

import { MyDetector } from '../../detectors/my-detector.js';

function loadDetectors(detectorsOption?: string): IDetector[] {
  const allDetectors: IDetector[] = [
    new HallucinationDetector(),
    new CodeQualityDetector(),
    new SecurityDetector(),
    new PerformanceDetector(),
    new MyDetector(), // Add here
  ];
  // ...
}
```

### 4. Document

Add detector documentation to `docs/API.md` under the **Detectors** section.

---

## Resources

- **Project**: https://github.com/kalpeshjaju/llm-guardian
- **Issues**: https://github.com/kalpeshjaju/llm-guardian/issues
- **Discussions**: https://github.com/kalpeshjaju/llm-guardian/discussions
- **npm**: https://www.npmjs.com/package/llm-guardian

---

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion for ideas
- Email: [your-email] (for sensitive topics)

Thank you for contributing to LLM Guardian! 🛡️

---

**License**: MIT
