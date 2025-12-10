# Inline Edit Feature

## Quick Start

This repository now includes **inline edit functionality** - a feature for focused, efficient code editing through specialized agents.

### What is it?

Inline edit allows you to:
1. Select a line or range of code
2. Describe the change you want (e.g., "add docs", "fix bug", "refactor")
3. Have an AI agent make the edit efficiently

### Two Modes

| Mode | Agent | Use Case | Speed |
|------|-------|----------|-------|
| **Quick** | `@inline-edit` | Simple edits, add docs, fix bugs | ⚡ Fast (1 turn) |
| **Smart** | `@inline-edit-smart` | Complex refactors, multi-file changes | 🧠 Thorough (multi-turn) |

## Usage Example

```bash
# Quick edit: Add documentation to line 42
@inline-edit
File: src/utils.ts
Line: 42
Task: Add JSDoc documentation
File path: /absolute/path/to/src/utils.ts
[File content with context...]

# Smart edit: Refactor lines 10-20
@inline-edit-smart
File: src/api.ts
Lines: 10-20
Task: Refactor to use async/await
File path: /absolute/path/to/src/api.ts
[File content with context...]
```

## Key Benefits

### 1. Efficiency
**50% fewer LLM turns** for simple edits by pre-loading file context

Traditional workflow:
1. Agent reads file → 1 LLM turn
2. Agent edits file → 1 LLM turn
**Total: 2 turns**

Inline edit workflow:
1. Tool pre-reads file → 0 LLM turns
2. Agent edits file → 1 LLM turn
**Total: 1 turn**

### 2. Focused Agents
- Quick mode: Only edit tool enabled, must complete in 1 turn
- Smart mode: Full tool access, can explore codebase

### 3. IDE Integration Ready
Designed for integration with editor extensions (VS Code, etc.)

## Implementation

Located in `.opencode/` directory:

```
.opencode/
├── agent/
│   ├── inline-edit.md              # Quick mode agent
│   └── inline-edit-smart.md        # Smart mode agent
├── tool/
│   └── inline-edit.ts              # Context preparation tool
├── opencode.jsonc                  # Configuration
├── INLINE_EDIT_USAGE.md           # User guide
├── INLINE_EDIT_README.md          # Implementation docs
└── demo-inline-edit.cjs           # Demo script
```

### No Core Modifications

Entirely implemented using OpenCode's plugin/customization system:
- ✅ Custom agents via `.opencode/agent/*.md`
- ✅ Custom tools via `.opencode/tool/*.ts`
- ✅ Configuration via `.opencode/opencode.jsonc`
- ❌ **No changes to OpenCode core source**

## Try the Demo

```bash
cd .opencode
node demo-inline-edit.cjs
```

This demonstrates three scenarios:
1. Adding JSDoc to a function (quick mode)
2. Improving error handling (smart mode)
3. Documenting a class (quick mode)

## Documentation

- **User Guide**: `.opencode/INLINE_EDIT_USAGE.md`
- **Implementation Details**: `.opencode/INLINE_EDIT_README.md`
- **Demo Script**: `.opencode/demo-inline-edit.cjs`

## Security

✅ **CodeQL Security Scan**: 0 vulnerabilities
- File access validated
- No arbitrary code execution
- Tool restrictions enforced

## How It Works

### Architecture

```
User Input → inline-edit tool → Pre-reads file with context
                                        ↓
                            Formats prompt with content
                                        ↓
                            Invokes agent (@inline-edit or @inline-edit-smart)
                                        ↓
                            Agent makes edit (no read needed!)
```

### Configuration

Agents are configured in `.opencode/opencode.jsonc`:

```jsonc
{
  "agent": {
    "inline-edit": {
      "mode": "subagent",
      "maxSteps": 1,           // Single turn only
      "tools": {
        "edit": true,          // Only edit enabled
        "read": false,         // Pre-loaded, don't need read
        "write": false,
        "bash": false,
        // ... all other tools disabled
      }
    },
    "inline-edit-smart": {
      "mode": "subagent",
      "tools": {
        "read": true,          // Full access
        "write": true,
        "bash": true,
        "glob": true,
        "grep": true,
        // ... most tools enabled
      }
    }
  }
}
```

## IDE Integration

Example for VS Code extension:

```typescript
import { opencode } from 'opencode-api'

// Get cursor position
const line = editor.selection.active.line + 1
const filePath = editor.document.uri.fsPath

// Prepare context with inline-edit tool
const context = await opencode.executeTool('inline-edit', {
  filePath,
  prompt: userRequest,
  line,
  smart: isComplexEdit
})

// Invoke appropriate agent
const agent = isComplexEdit ? 'inline-edit-smart' : 'inline-edit'
await opencode.invokeAgent(agent, context)
```

## Customization

### Change Context Window

Edit `.opencode/tool/inline-edit.ts`:

```typescript
const CONTEXT_LINES = 20  // Change this to adjust context size
```

### Add New Mode

1. Create agent prompt: `.opencode/agent/my-mode.md`
2. Configure tools: `.opencode/opencode.jsonc`
3. Update tool: `.opencode/tool/inline-edit.ts`

### Modify Agent Behavior

Edit agent prompts:
- `.opencode/agent/inline-edit.md` (quick mode)
- `.opencode/agent/inline-edit-smart.md` (smart mode)

## Troubleshooting

### Agent not found
Ensure `.opencode/opencode.jsonc` contains agent configuration

### Tool not available
Check that `.opencode/tool/inline-edit.ts` exists and is valid TypeScript

### File not found errors
Use absolute paths for `filePath` parameter

## Contributing

To improve this feature:

1. **Report issues**: Describe the edit scenario that didn't work
2. **Suggest enhancements**: New modes, better context selection, etc.
3. **Submit PRs**: Follow the pattern established in `.opencode/`

## Credits

Built on OpenCode's extensible architecture:
- Custom agents
- Custom tools
- Configuration system

No modifications to core required.

---

For detailed documentation, see:
- `.opencode/INLINE_EDIT_USAGE.md` - User guide
- `.opencode/INLINE_EDIT_README.md` - Implementation details
