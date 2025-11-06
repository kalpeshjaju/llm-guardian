# ADR 001: MVP-First Approach with Option B (CLI-based)

**Date**: 2025-11-06
**Status**: Accepted
**Deciders**: Kalpesh Jaju, Claude Code (with external LLM reviews)

## Context

We're building LLM Guardian, a Git pre-commit hook that detects and fixes common mistakes in LLM-generated code. The original plan was to build all 4 detectors + full MAE pipeline (Proposer→Solver→Judge) in 12-15 days using Option B (CLI-based Claude).

**External Reviews Received:**
1. **GPT-4**: Recommended 4-5 weeks for deterministic detectors only, defer MAE pipeline
2. **Cursor**: Recommended 10-12 days for 2 detectors + basic auto-fix, use API (Option A)
3. **Gemini**: Recommended 10-12 days for 2 detectors + manual fixes (MVP first)

**Common Concerns:**
- Scope too ambitious for initial timeline
- Performance budget (<5s) incompatible with 4 detectors + full MAE
- CLI-based approach (Option B) less reliable than API-based (Option A)
- Auto-fix without evaluation harness risky

## Decision

We will implement **Gemini's MVP-first approach** with **Option B (CLI-based)** in two phases:

### Phase 1: MVP (Days 1-14)
- **2 detectors only**: Hallucination + Code Quality
- **CLI provider (Option B)**: Uses `claude chat` via shell (no extra API cost)
- **Manual fix workflow**: `llm-guardian fix` with user approval
- **Non-blocking git hook**: Warnings only (<5s)
- **String-based fixes**: No AST manipulation
- **Validation**: Re-run detectors + `tsc` (no Judge agent)

### Phase 2: Expansion (Days 15-25)
- **2 additional detectors**: Requirements + Architecture
- **Judge agent**: Third LLM validates fix quality
- **MAE pipeline**: Full Proposer→Solver→Judge flow
- **Multi-LLM consensus**: Claude + GPT-4 + Gemini
- **Optional blocking mode**: Exit-on-error via config

**Total Timeline**: 20-25 days (realistic, based on external feedback)

## Options Considered

### Option 1: GPT-4's Deterministic-Only Approach ❌
- **Timeline**: 4-5 weeks
- **Scope**: 2 detectors (deterministic only), NO auto-fix
- **Why rejected**: Too conservative, doesn't leverage LLM capabilities
- **Trade-off**: Lower risk but less value

### Option 2: Cursor's API-Based MVP ❌
- **Timeline**: 10-12 days
- **Scope**: 2 detectors + basic auto-fix
- **LLM**: Option A (API-based)
- **Why rejected**: User wants Option B (CLI) to avoid extra API cost
- **Trade-off**: More reliable but costs $2-5/month

### Option 3: Original Full Scope ❌
- **Timeline**: 12-15 days (unrealistic per reviews)
- **Scope**: All 4 detectors + full MAE from day 1
- **Why rejected**: External reviews unanimous that scope too ambitious
- **Trade-off**: Faster to complete vision but higher risk of failure

### Option 4: Gemini's MVP-First with Option B ✅ (CHOSEN)
- **Timeline**: 20-25 days (realistic)
- **Scope**: MVP (2 detectors) → Expand (full vision)
- **LLM**: Option B (CLI-based, no extra cost)
- **Why chosen**: Balances value, risk, cost, and timeline

## Consequences

### Positive ✅
1. **Proves value quickly**: MVP in 10-12 days shows highest-impact features work
2. **Validates Option B**: Tests CLI reliability before expanding to full scope
3. **Lower risk**: Can pivot if CLI proves too unreliable or performance issues
4. **Reaches full vision**: Still achieves all 4 detectors + MAE in 20-25 days
5. **No extra cost**: Option B uses existing Max/Pro subscription
6. **Incremental learning**: Phase 1 informs Phase 2 architecture decisions

### Negative ❌
1. **CLI reliability concerns**: Option B less reliable than API (auth expiry, parsing issues)
2. **Manual fixes in MVP**: No auto-fix in pre-commit hook until Phase 2
3. **Longer total timeline**: 20-25 days vs original 12-15 days
4. **Deferred features**: Requirements/Architecture detectors wait until Phase 2

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **CLI fails frequently** | Retry logic, structured output parsing, fallback to warnings-only |
| **Performance >5s** | Cache aggressively, parallelize detectors, analyze staged files only |
| **False positives >15%** | Conservative thresholds, evaluation fixtures, configurable detectors |
| **Auto-fix breaks code** | Show diff, require approval, re-run detectors + tsc before applying |

## Implementation

### MVP Deliverables (Days 1-14):
- ✅ `src/detectors/hallucination-detector.ts`: Fake packages, deprecated APIs
- ✅ `src/detectors/code-quality-detector.ts`: Type safety, file sizes
- ✅ `src/llm/claude-cli-provider.ts`: Shell wrapper for `claude chat`
- ✅ `src/fix/proposer-agent.ts`: LLM-powered fix suggestions
- ✅ `src/fix/solver-agent.ts`: String-based fix application
- ✅ `src/git/git-hook.ts`: Non-blocking pre-commit hook
- ✅ CLI commands: `init`, `check`, `fix`

### Phase 2 Additions (Days 15-25):
- 🔜 `src/detectors/requirements-detector.ts`
- 🔜 `src/detectors/architecture-detector.ts`
- 🔜 `src/fix/judge-agent.ts`
- 🔜 `src/mae/orchestrator.ts`: Full MAE pipeline
- 🔜 Multi-LLM providers: OpenAI, Gemini
- 🔜 Optional blocking mode

## Success Metrics

### MVP (End of Day 14):
- Hallucination detector >90% accuracy
- Code Quality detector >80% accuracy
- Pre-commit hook <5s
- `llm-guardian fix` >70% success rate
- Test coverage >60%
- Works on ui-ux-audit-tool

### Full Version (End of Day 25):
- All 4 detectors operational
- Full MAE pipeline working
- Multi-LLM consensus available
- Test coverage >80%
- <15s total overhead
- False positive rate <15%

## Review History

- **2025-11-06**: Created after synthesizing GPT-4, Cursor, and Gemini reviews
- **Reviewed by**: GPT-4 (critical), Cursor (technical), Gemini (pragmatic)
- **User decision**: Proceed with Option 1 (MVP-first) + Option B (CLI)

## References

- [Original project plan](../../README.md)
- [GPT-4 review](../reviews/gpt4-review.md) (to be added)
- [Cursor review](../reviews/cursor-review.md) (to be added)
- [Gemini review](../reviews/gemini-review.md) (to be added)
- [Multi-Agent Evolve (MAE) paper](https://github.com/ulab-uiuc/Multi-agent-Evolve)
