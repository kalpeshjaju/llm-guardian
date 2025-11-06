# LLM Guardian - Development Roadmap

**Project Goal**: Git pre-commit hook that detects and fixes common mistakes in LLM-generated code

**Timeline**: 14-day MVP, 25-day full version
**Current Status**: Day 8/14 complete (57%)
**Last Updated**: 2025-11-06

---

## 📊 Progress Overview

```
Phase 1 (MVP): ████████████░░░░░░░░ 57% (8/14 days)
Phase 2 (Full): ░░░░░░░░░░░░░░░░░░░░  0% (0/11 days)
```

---

## ✅ Phase 1: MVP (Days 1-14)

### **Day 1: Project Setup** ✅ (Completed 2025-11-06)

**Completed**:
- [x] Initialize TypeScript project with strict mode
- [x] Set up Vitest testing framework
- [x] Configure ESLint + Prettier
- [x] Create project structure (detectors, cli, agents)
- [x] Add MIT license
- [x] Create initial README

**Files**: 15+ files, 500+ lines

**Commit**: `6268be8`

---

### **Day 2: Hallucination Detector (Core)** ✅ (Completed 2025-11-06)

**Completed**:
- [x] Fake package detection (npm registry API)
- [x] Import extraction (dynamic, static, type-only)
- [x] Batch package checking (5 concurrent)
- [x] Test suite (20 tests)

**Features**:
- Detects non-existent npm packages
- Handles scoped packages (@org/name)
- Multi-file analysis support
- 300ms average check time

**Files**: `src/detectors/hallucination-detector.ts` (260 lines)

**Commit**: `fd9b96c`

---

### **Day 3: Code Quality Detector** ✅ (Completed 2025-11-06)

**Completed**:
- [x] Type safety detection (`any` types)
- [x] File/function size limits
- [x] Error handling detection (missing try/catch)
- [x] Promise chain validation
- [x] Test suite (25 tests)

**Features**:
- Configurable thresholds
- Pattern-based detection (regex + AST-lite)
- Detailed issue reporting with line numbers
- Suggestion generation

**Files**: `src/detectors/code-quality-detector.ts` (510 lines)

**Commit**: `fd9b96c`

---

### **Day 4: CLI Foundation** ✅ (Completed 2025-11-06)

**Completed**:
- [x] Commander.js CLI framework
- [x] `check` command (run detectors)
- [x] `init` command (install git hook)
- [x] `config` command (configuration management)
- [x] Git integration (staged files)
- [x] Terminal formatting (ora spinners, chalk colors)

**Commands**:
```bash
llm-guardian check [--all] [--detectors <names>]
llm-guardian init [--force] [--blocking]
llm-guardian config [key] [value]
```

**Files**: `src/cli/` (7 files, 800+ lines)

**Commit**: `0b6572d`

---

### **Day 5: LLM Provider (CLI-based)** ✅ (Completed 2025-11-06)

**Completed**:
- [x] ILLMProvider interface
- [x] CLIProvider implementation (uses `claude chat`)
- [x] Prompt templates for different issue categories
- [x] JSON parsing with fallback
- [x] Error handling + retry logic

**Features**:
- No API cost (uses Claude Code CLI)
- 15s timeout per fix suggestion
- Structured output parsing
- Confidence scoring

**Files**: `src/llm/` (3 files, 450+ lines)

**Commit**: `53e094b`

---

### **Day 6: Proposer Agent** ✅ (Completed 2025-11-06)

**Completed**:
- [x] ProposerAgent implementation
- [x] Parallel LLM processing (3 concurrent)
- [x] Issue enrichment (add .fix field)
- [x] Context building (file content + surrounding lines)
- [x] Integration with check command
- [x] `--suggest` flag

**Features**:
- Batch processing (3 issues at a time)
- Graceful degradation (failures don't break detection)
- Statistics (withFix count, avg confidence)
- Enhanced terminal output (shows LLM suggestions)

**Files**: `src/agents/proposer.ts` (280 lines)

**Commit**: `53e094b`

---

### **Day 7: Solver Agent** ✅ (Completed 2025-11-06)

**Completed**:
- [x] SolverAgent implementation
- [x] File backup (.llm-guardian-backup)
- [x] String/regex replacement
- [x] Atomic file operations
- [x] Rollback capability
- [x] Integration with check command
- [x] `--fix` flag

**Features**:
- Creates backups before modification
- Applies multiple fixes per file atomically
- Validates fixes were applied
- Statistics (files modified, lines changed)
- Dry-run mode support

**Files**: `src/agents/solver.ts` (520 lines)

**Commit**: `a98e9c0`

---

### **Day 8: 5 Major Features (Parallel)** ✅ (Completed 2025-11-06)

**Completed** (All in parallel):

#### 1. Judge Agent (Validation)
- [x] Validates fixes with type-check/tests/lint
- [x] Configurable validation checks
- [x] Detailed validation reports
- [x] `--validate` flag

**Files**: `src/agents/judge.ts` (400+ lines)

#### 2. Rollback Command
- [x] Restores from .llm-guardian-backup files
- [x] `--list` flag (show backups)
- [x] `--file` flag (restore specific file)
- [x] `--cleanup` flag (delete backups)
- [x] Recursive backup discovery

**Files**: `src/cli/commands/rollback.ts` (250+ lines)

#### 3. Confidence Thresholds
- [x] minConfidence parameter in SolverAgent
- [x] Filters fixes below threshold
- [x] `--confidence <threshold>` flag (0.0-1.0)
- [x] Display threshold in output

**Files**: Updated `src/agents/solver.ts`

#### 4. Interactive Mode
- [x] reviewFixes() function
- [x] Fix preview (search → replace)
- [x] User choices (yes/no/all/none/quit)
- [x] `--interactive` flag
- [x] prompts library integration

**Files**: `src/cli/utils/interactive.ts` (250+ lines)

#### 5. Pre-commit Hook Validation
- [x] `--validate` flag for init command
- [x] Hook script includes validation
- [x] Validation status in installation

**Files**: Updated `src/cli/commands/init.ts`

**Total Changes**: 9 files, 1049 insertions(+), 14 deletions(-)

**Commit**: `b1c893d`

---

## 🔄 Phase 1 Remaining (Days 9-14)

### **Day 9: Deprecated APIs Detector** 🔜

**Planned**:
- [ ] Create deprecated-apis.ts with API database
- [ ] Add detection for:
  - [ ] Deprecated npm package methods
  - [ ] Deprecated Node.js APIs
  - [ ] Deprecated framework APIs (React, Express, etc.)
- [ ] Add tests (20+ tests)
- [ ] Integration with check command

**Files to Create**:
- `src/utils/deprecated-apis.ts` (API database)
- `tests/unit/deprecated-apis.test.ts`

**Files to Update**:
- `src/detectors/hallucination-detector.ts` (integrate deprecated API checks)

**Estimate**: 1 day

---

### **Day 10: Security Detector** 🔜

**Planned**:
- [ ] Sensitive data detection (API keys, secrets, passwords)
- [ ] SQL injection patterns
- [ ] XSS vulnerability patterns
- [ ] Command injection patterns
- [ ] Insecure dependency usage
- [ ] Add tests (25+ tests)
- [ ] Integration with check command

**Files to Create**:
- `src/detectors/security-detector.ts` (300+ lines)
- `tests/unit/security-detector.test.ts`

**Files to Update**:
- `src/cli/commands/check.ts` (load SecurityDetector)

**Estimate**: 1 day

---

### **Day 11: Performance Detector** 🔜

**Planned**:
- [ ] Inefficient loops (nested, O(n²) patterns)
- [ ] Unnecessary re-renders (React)
- [ ] Memory leaks (event listeners, timers)
- [ ] Large bundle sizes
- [ ] Synchronous blocking operations
- [ ] Add tests (20+ tests)
- [ ] Integration with check command

**Files to Create**:
- `src/detectors/performance-detector.ts` (300+ lines)
- `tests/unit/performance-detector.test.ts`

**Files to Update**:
- `src/cli/commands/check.ts` (load PerformanceDetector)

**Estimate**: 1 day

---

### **Day 12: Documentation & Examples** 🔜

**Planned**:
- [ ] Complete API documentation (JSDoc)
- [ ] Usage examples for each command
- [ ] Integration guides (CI/CD, pre-commit)
- [ ] Contributing guide
- [ ] Troubleshooting guide
- [ ] Video demo (screencast)

**Files to Create**:
- `docs/API.md` (API reference)
- `docs/EXAMPLES.md` (usage examples)
- `docs/INTEGRATION.md` (CI/CD integration)
- `docs/CONTRIBUTING.md` (contribution guide)
- `docs/TROUBLESHOOTING.md` (common issues)
- `examples/` directory (sample projects)

**Estimate**: 1 day

---

### **Day 13: Testing & Polish** 🔜

**Planned**:
- [ ] Increase test coverage to 90%+
- [ ] Add integration tests (end-to-end)
- [ ] Performance benchmarks
- [ ] Memory leak testing
- [ ] Edge case testing
- [ ] Error message improvements
- [ ] CLI UX polish

**Testing Goals**:
- Unit tests: 90%+ coverage
- Integration tests: 10+ scenarios
- Performance: <5s for check command
- Memory: <100MB RAM usage

**Estimate**: 1 day

---

### **Day 14: Release Preparation** 🔜

**Planned**:
- [ ] Version bump (0.1.0 → 1.0.0)
- [ ] Changelog generation (CHANGELOG.md)
- [ ] npm package publishing setup
- [ ] GitHub release creation
- [ ] Demo video production
- [ ] Social media announcement
- [ ] Submit to newsletters (Node Weekly, JavaScript Weekly)

**Deliverables**:
- Published npm package: `llm-guardian@1.0.0`
- GitHub release with binaries
- Demo video (5-10 min)
- Blog post announcement

**Estimate**: 1 day

---

## 🚀 Phase 2: Full Vision (Days 15-25)

**Status**: Not started

### **Day 15-16: Requirements Detector** 🔮

**Planned**:
- [ ] Parse requirements.md
- [ ] Extract functional requirements
- [ ] Match implementation to requirements
- [ ] Flag unimplemented features
- [ ] Flag over-implemented features

**Estimate**: 2 days

---

### **Day 17-18: Architecture Detector** 🔮

**Planned**:
- [ ] SOLID principles validation
- [ ] Circular dependency detection
- [ ] Complexity metrics (cyclomatic complexity)
- [ ] Design pattern recognition
- [ ] Layering violations

**Estimate**: 2 days

---

### **Day 19-20: Multi-LLM Consensus** 🔮

**Planned**:
- [ ] Claude provider (Anthropic API)
- [ ] GPT-4 provider (OpenAI API)
- [ ] Gemini provider (Google API)
- [ ] Voting mechanism (3 LLMs)
- [ ] Confidence aggregation

**Estimate**: 2 days

---

### **Day 21-22: Judge Agent Enhancement** 🔮

**Planned**:
- [ ] Third LLM validates fix quality
- [ ] Semantic correctness check
- [ ] Side-effect analysis
- [ ] Regression detection

**Estimate**: 2 days

---

### **Day 23-24: Blocking Mode & CI Integration** 🔮

**Planned**:
- [ ] Optional blocking mode
- [ ] CI/CD integration (GitHub Actions, GitLab CI)
- [ ] Severity thresholds
- [ ] Exit codes for automation

**Estimate**: 2 days

---

### **Day 25: Final Release** 🔮

**Planned**:
- [ ] Version bump (1.0.0 → 2.0.0)
- [ ] Full documentation
- [ ] Enterprise features
- [ ] Production-ready release

**Estimate**: 1 day

---

## 📈 Metrics & Goals

### MVP (Phase 1) Goals

**Quality**:
- ✅ 90%+ test coverage (currently 100% for core)
- ✅ 100% TypeScript strict mode
- ✅ Zero `any` types (except where necessary)

**Performance**:
- ✅ <5s for check command (currently ~2-4s)
- ✅ <100MB RAM usage
- ✅ Parallel detector execution

**Features**:
- ✅ 2 core detectors (Hallucination, Code Quality)
- ✅ 3 agents (Proposer, Solver, Judge)
- ✅ 4 CLI commands (check, init, config, rollback)
- 🔜 5 detectors by Day 14 (add Security, Performance, Deprecated APIs)

### Phase 2 Goals

**Quality**:
- 95%+ test coverage
- Integration tests for all flows
- Performance benchmarks

**Features**:
- 6 detectors (add Requirements, Architecture)
- Multi-LLM consensus (3 providers)
- Blocking mode for CI/CD
- Enterprise features

---

## 🎯 Success Criteria

### MVP Success (Day 14)

- [ ] npm package published (`llm-guardian@1.0.0`)
- [ ] 5 working detectors
- [ ] Full MAE pipeline (Proposer → Solver → Judge)
- [ ] Git hook integration
- [ ] Complete documentation
- [ ] 10+ GitHub stars
- [ ] 5+ production users

### Full Version Success (Day 25)

- [ ] 8 detectors (Requirements, Architecture)
- [ ] Multi-LLM consensus
- [ ] CI/CD integration guides
- [ ] 100+ GitHub stars
- [ ] 50+ production users
- [ ] Featured in Node Weekly

---

## 🔗 Related Links

- **Repository**: https://github.com/kalpeshjaju/llm-guardian
- **Issues**: https://github.com/kalpeshjaju/llm-guardian/issues
- **npm Package**: https://www.npmjs.com/package/llm-guardian (publishing soon)
- **Inspiration**: [Multi-Agent Evolve (MAE) paper](https://github.com/ulab-uiuc/Multi-agent-Evolve)
- **Sister Project**: [ui-ux-audit-tool](https://github.com/kalpeshjaju/ui-ux-audit-tool)

---

**Last Updated**: 2025-11-06
**Next Milestone**: Day 9 (Deprecated APIs Detector)
**Days Remaining**: 6 days until MVP complete
