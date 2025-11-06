# LLM Guardian

> Git pre-commit hook that detects and fixes common mistakes in LLM-generated code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20.0.0-green.svg)](https://nodejs.org/)

## 🎯 Problem

LLMs (Claude, GPT-4, Gemini) make **predictable, high-impact mistakes** when generating code:

- ❌ Hallucinate fake APIs and methods
- ❌ Use non-existent or incorrect npm packages
- ❌ Produce code with obvious type safety issues (`any` types)
- ❌ Violate basic code quality standards

These issues **break builds** and waste **hours of debugging time**.

## ✨ Solution

LLM Guardian is a **lightweight Git pre-commit hook** that:

1. **Detects** critical issues in LLM-generated code (fake packages, type safety, code quality)
2. **Suggests** fixes using LLM-powered analysis
3. **Applies** fixes with your approval
4. **Validates** fixes don't break your code

## 🚀 Quick Start

```bash
# Install
npm install -g llm-guardian

# Initialize in your project
cd your-project
llm-guardian init

# Run checks manually
llm-guardian check

# Get fix suggestions
llm-guardian fix
```

## 📋 Features

### MVP (Current - Days 1-14)

- ✅ **Hallucination Detector**: Catches fake packages, deprecated APIs, invalid imports
- ✅ **Code Quality Detector**: Finds type safety issues, excessive file sizes, missing error handling
- ✅ **Non-blocking Git Hook**: Shows warnings (<5s), doesn't block commits
- ✅ **Manual Fix Workflow**: LLM-powered fix suggestions with user approval
- ✅ **CLI Provider**: Uses Claude Code CLI (no extra API cost)

### Phase 2 (Planned - Days 15-25)

- 🔜 **Requirements Detector**: Validates implementation against `requirements.md`
- 🔜 **Architecture Detector**: Checks SOLID principles, circular dependencies, complexity
- 🔜 **Judge Agent**: Third LLM validates fix quality
- 🔜 **Multi-LLM Consensus**: Claude + GPT-4 + Gemini voting
- 🔜 **Blocking Mode**: Optional exit-on-error mode

## 🏗️ How It Works

### Detection Flow (Pre-commit Hook)

```
git commit
    ↓
┌───────────────────────────────┐
│ LLM Guardian Pre-commit Hook  │
│ (non-blocking, <5s)          │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│ Run Detectors (parallel)      │
│ • Hallucination Detector      │
│ • Code Quality Detector       │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│ Show Warnings                 │
│ (commit proceeds)             │
└───────────────────────────────┘
```

### Fix Flow (Manual Command)

```
llm-guardian fix
    ↓
┌───────────────────────────────┐
│ 1. Run Detectors              │
│    Find issues                │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│ 2. Proposer Agent (LLM)       │
│    Generate fix proposals     │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│ 3. Show Diff                  │
│    User approves fix?         │
└───────────────────────────────┘
    ↓ (yes)
┌───────────────────────────────┐
│ 4. Solver Agent               │
│    Apply string-based fix     │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│ 5. Validator                  │
│    Re-run detectors + tsc     │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│ ✅ Fix applied successfully   │
│ (or ❌ reverted on failure)   │
└───────────────────────────────┘
```

## 🔍 Detection Examples

### Hallucination Detector

```typescript
// ❌ DETECTED: Package doesn't exist
import { Stripe } from 'stripe-pro';
// 💡 FIX: import { Stripe } from 'stripe';

// ❌ DETECTED: Deprecated API
stripe.charges.create({ amount: 1000 });
// 💡 FIX: stripe.paymentIntents.create({ amount: 1000 });

// ❌ DETECTED: Method doesn't exist
await openai.chat.completions.create({ model: 'gpt-5' });
// 💡 FIX: await openai.chat.completions.create({ model: 'gpt-4' });
```

### Code Quality Detector

```typescript
// ❌ DETECTED: Type safety issue
const data: any = await fetchData();
// 💡 FIX: const data: UserData = await fetchData();

// ❌ DETECTED: Missing error handling
const result = await riskyOperation();
// 💡 FIX:
try {
  const result = await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  throw error;
}

// ❌ DETECTED: File too large (>600 lines)
// payment-processor.ts: 1,200 lines
// 💡 FIX: Split into payment-processor.ts (300) + payment-validators.ts (300) + payment-utils.ts (300)
```

## ⚙️ Configuration

Create `.llm-guardian.json` in your project root:

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

## 📊 Roadmap

**Current Status**: Day 8/14 complete (57%) - See [ROADMAP.md](ROADMAP.md) for detailed progress

- [x] **Day 1**: Project setup ✅
- [x] **Day 2**: Hallucination Detector (fake packages, deprecated APIs) ✅
- [x] **Day 3**: Code Quality Detector (type safety, file sizes, error handling) ✅
- [x] **Day 4**: CLI Foundation (check, init, config commands) ✅
- [x] **Day 5**: LLM Provider (CLI-based, no API cost) ✅
- [x] **Day 6**: Proposer Agent (LLM fix suggestions) ✅
- [x] **Day 7**: Solver Agent (auto-fix with backups) ✅
- [x] **Day 8**: Judge Agent + Rollback + Confidence + Interactive + Validation ✅
- [ ] **Days 9-10**: Security + Performance detectors 🔜
- [ ] **Days 11-14**: Documentation, testing, release prep 🔜

**Phase 1 (MVP)**: Days 1-14
- [x] Core detectors (Hallucination, Code Quality) ✅
- [x] Multi-Agent Evolve (Proposer → Solver → Judge) ✅
- [x] CLI with interactive mode ✅
- [x] Git hook integration with validation ✅
- [ ] Additional detectors (Security, Performance) 🔜
- [ ] Documentation & release 🔜

**Phase 2 (Full)**: Days 15-25
- [ ] Requirements + Architecture detectors 🔮
- [ ] Multi-LLM consensus (Claude + GPT-4 + Gemini) 🔮
- [ ] Blocking mode for CI/CD 🔮

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT © Kalpesh Jaju

## 🙏 Acknowledgments

- Built with lessons from [ui-ux-audit-tool](https://github.com/kalpeshjaju/ui-ux-audit-tool)
- Inspired by [Multi-Agent Evolve (MAE) paper](https://github.com/ulab-uiuc/Multi-agent-Evolve)
- Uses Anthropic Claude, OpenAI GPT-4, Google Gemini

---

**Status**: 🚧 In Development - Day 8/14 (57% MVP complete)

**Timeline**: MVP by Day 14, Full version by Day 25

**Current Focus**: Security & Performance detectors (Days 9-10)

**Latest**: Multi-Agent Evolve (MAE) pipeline complete! ✨
- ✅ Proposer Agent: Generates LLM fix suggestions
- ✅ Solver Agent: Applies fixes automatically with backups
- ✅ Judge Agent: Validates fixes work correctly
- ✅ Interactive mode: Review fixes before applying
- ✅ Rollback command: Undo applied fixes
