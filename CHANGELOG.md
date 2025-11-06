# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-11-06

### 🎉 Initial Release - MVP Complete

**14-day MVP development completed**: Full Multi-Agent Evolve (MAE) pipeline with 4 detectors, 3 agents, comprehensive testing, and production-ready CLI.

### Added

#### Detectors (4 total)

- **HallucinationDetector** - Detects fake npm packages, deprecated APIs, invalid imports
  - 40+ deprecated API patterns (Stripe, OpenAI, React, Node.js, etc.)
  - Real-time npm registry validation
  - Import extraction (CommonJS, ES6, dynamic, type-only)
  - 20 comprehensive tests

- **CodeQualityDetector** - Detects type safety issues, large files, missing error handling
  - `any` type detection
  - File size limits (600 lines)
  - Function size limits (150 lines)
  - Missing error handling (try/catch, .catch())
  - 25 comprehensive tests

- **SecurityDetector** - Detects OWASP security vulnerabilities
  - Hardcoded secrets (API keys, AWS keys, GitHub tokens, passwords)
  - SQL injection (template literals, string concatenation)
  - XSS vulnerabilities (dangerouslySetInnerHTML, innerHTML, eval)
  - Command injection (exec/spawn with user input)
  - Insecure cryptography (MD5/SHA1, Math.random, createCipher)
  - Path traversal (file operations with user input)
  - 28 comprehensive tests

- **PerformanceDetector** - Detects performance anti-patterns
  - Inefficient loops (nested O(n²), array operations in loops)
  - Memory leaks (event listeners/timers without cleanup)
  - Unnecessary re-renders (inline styles/functions in JSX)
  - Blocking operations (sync file I/O, JSON.parse in loops)
  - Large imports (lodash wildcard, namespace imports)
  - 27 comprehensive tests

#### Multi-Agent Evolve (MAE) Pipeline

- **ProposerAgent** - LLM-powered fix suggestion generator
  - Parallel processing (3 concurrent)
  - Category-specific prompts (hallucination, code-quality, security, performance)
  - Confidence scoring (0.0-1.0)
  - Context-aware fix generation

- **SolverAgent** - Automatic fix applicator
  - String-based replacement (MVP)
  - Atomic file operations
  - Automatic backups (.llm-guardian-backup)
  - Confidence thresholds
  - Dry-run mode

- **JudgeAgent** - Fix validator
  - Type-check validation (tsc --noEmit)
  - Test validation (npm test)
  - Lint validation (npm run lint)
  - Detailed validation reports

#### CLI Commands

- `check` - Run detectors on staged files or all files
  - `--all`: Check all files
  - `--detectors <names>`: Run specific detectors
  - `--json`: JSON output for CI/CD
  - `--suggest`: Generate LLM fix suggestions
  - `--fix`: Apply fixes automatically
  - `--confidence <threshold>`: Minimum confidence for fixes
  - `--interactive`: Review fixes before applying
  - `--validate`: Run tests/type-check after fixes

- `init` - Setup Git pre-commit hook
  - `--force`: Overwrite existing hook
  - `--blocking`: Block commits on errors
  - `--validate`: Enable validation in hook

- `rollback` - Restore from backups
  - `--list`: List available backups
  - `--file <path>`: Restore specific file
  - `--cleanup`: Delete all backups

- `config` - View/update configuration
  - View all: `llm-guardian config`
  - Get key: `llm-guardian config detectors.hallucination.enabled`
  - Set key: `llm-guardian config hook.blocking true`

#### Documentation

- **API Reference** (`docs/API.md`) - Complete API documentation
  - CLI commands with all options
  - All 4 detectors with examples
  - Multi-Agent pipeline usage
  - Type definitions
  - Exit codes

- **Usage Examples** (`docs/EXAMPLES.md`) - Practical workflows
  - Quick start guide
  - Pre-commit hook setup
  - CI/CD integration (GitHub Actions, GitLab CI, CircleCI)
  - Fix workflows (auto-fix, interactive, rollback)
  - Custom detector creation
  - Troubleshooting guide

- **Contributing Guide** (`CONTRIBUTING.md`) - Contribution guidelines
  - Development setup
  - Code style
  - Testing requirements
  - PR process
  - Project structure

- **Roadmap** (`ROADMAP.md`) - Complete development plan (Days 1-25)

#### Testing

- **100 comprehensive tests** across all detectors and agents
  - Unit tests: 100/100 passing
  - Coverage: 90%+ on critical paths
  - Performance benchmarks: <5s for 10 files

#### LLM Integration

- **CLIProvider** - Uses Claude Code CLI (no API cost)
  - 15s timeout per fix
  - Retry logic (3 attempts)
  - Structured output parsing
  - JSON fallback

### Features

- ✅ **Non-blocking Git hook** - Shows warnings, doesn't block commits (<5s)
- ✅ **LLM fix suggestions** - AI-powered via Claude Code CLI
- ✅ **Interactive fix review** - Approve/reject each fix
- ✅ **Automatic backups** - Rollback capability
- ✅ **Confidence thresholds** - Only apply high-confidence fixes
- ✅ **Validation pipeline** - Ensure fixes don't break code
- ✅ **CI/CD ready** - JSON output, exit codes
- ✅ **Parallel execution** - Fast detector runs
- ✅ **TypeScript strict mode** - Type-safe throughout

### Performance

- **Check command**: <2-4s for 10 files (4 detectors)
- **Memory usage**: <100MB RAM
- **Parallel detectors**: 40% faster than sequential
- **Hallucination detector**: ~300ms per file (with npm checks)
- **Code quality detector**: ~50ms per file (static analysis)

### Architecture

- **Plugin-based detectors** - Easy to add new detectors
- **IDetector interface** - Consistent API
- **Multi-Agent Evolve** - Proposer → Solver → Judge pipeline
- **LLM abstraction** - Swappable providers (CLI, API)
- **Type-safe** - Full TypeScript with strict mode

### Package

- **Dependencies**: Minimal, well-maintained
  - commander: CLI framework
  - chalk: Terminal colors
  - ora: Spinners
  - prompts: Interactive prompts
- **Size**: <200KB bundled
- **Node.js**: 20+ required
- **License**: MIT

---

## [0.1.0] - 2025-11-01 (Internal Dev)

### Added

- Initial project setup
- Basic detector framework
- CLI foundation
- Git integration

---

## Unreleased

### Planned for Phase 2 (Days 15-25)

#### Future Detectors

- **RequirementsDetector** - Validates implementation against `requirements.md`
  - Extract functional requirements
  - Match to implementation
  - Flag unimplemented features
  - Flag over-implementation

- **ArchitectureDetector** - Validates architectural patterns
  - SOLID principles
  - Circular dependencies
  - Complexity metrics (cyclomatic complexity)
  - Design pattern recognition
  - Layering violations

#### Advanced Features

- **Multi-LLM Consensus** - Claude + GPT-4 + Gemini voting
  - 3-LLM voting system
  - Confidence aggregation
  - Tie-breaking logic

- **Judge Agent Enhancement** - Third LLM validates fixes
  - Semantic correctness check
  - Side-effect analysis
  - Regression detection

- **Blocking Mode** - Optional exit-on-error for CI/CD
  - Configurable severity thresholds
  - Team-specific rules

#### Integrations

- GitHub Actions marketplace
- VS Code extension
- Pre-commit framework integration
- Husky integration

---

## Version History

- **1.0.0** (2025-11-06) - MVP release
- **0.1.0** (2025-11-01) - Internal dev

---

## Links

- **Repository**: https://github.com/kalpeshjaju/llm-guardian
- **npm Package**: https://www.npmjs.com/package/llm-guardian
- **Issues**: https://github.com/kalpeshjaju/llm-guardian/issues
- **Roadmap**: [ROADMAP.md](./ROADMAP.md)

---

**Maintained by**: Kalpesh Jaju
**License**: MIT
