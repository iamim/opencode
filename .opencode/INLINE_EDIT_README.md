# Inline Edit Feature - Implementation Summary

## Overview

This implementation adds inline edit functionality to OpenCode without modifying the core source code. It uses OpenCode's plugin/customization system to create specialized agents and tools for focused code editing.

## Problem Solved

The main challenge addressed:
> "To call edit tool, read tool must be used. I do not want the llm to call it and instead to pre-call it to not waste a turn"

**Solution**: Pre-load file context before invoking the editing agent, avoiding redundant read operations.

## Architecture

### 1. Custom Agents

#### `inline-edit` (Quick Mode)
- **Location**: `.opencode/agent/inline-edit.md`
- **Configuration**: `.opencode/opencode.jsonc` → `agent.inline-edit`
- **Characteristics**:
  - Single-turn execution (`maxSteps: 1`)
  - Only `edit` tool enabled
  - All other tools disabled (read, write, bash, etc.)
  - Optimized for speed and simplicity

#### `inline-edit-smart` (Smart Mode)  
- **Location**: `.opencode/agent/inline-edit-smart.md`
- **Configuration**: `.opencode/opencode.jsonc` → `agent.inline-edit-smart`
- **Characteristics**:
  - Multi-turn execution (unlimited steps)
  - Full tool access (read, write, bash, glob, grep, etc.)
  - Can explore codebase for context
  - Suitable for complex refactorings

### 2. Custom Tool

#### `inline-edit`
- **Location**: `.opencode/tool/inline-edit.ts`
- **Purpose**: Prepare file context for editing
- **Features**:
  - Reads file with configurable context window (±20 lines)
  - Supports line-based and range-based editing
  - Auto-detects file language for syntax highlighting
  - Formats prompt with pre-loaded content
  - Returns instructions for agent invocation

### 3. Configuration

**File**: `.opencode/opencode.jsonc`

```jsonc
{
  "agent": {
    "inline-edit": {
      "mode": "subagent",
      "maxSteps": 1,
      "tools": {
        "edit": true,
        // All other tools: false
      }
    },
    "inline-edit-smart": {
      "mode": "subagent",
      "tools": {
        "read": true,
        "write": true,
        "bash": true,
        // Most tools: true
      }
    }
  }
}
```

## Usage

### Programmatic Usage

```javascript
// Quick edit at specific line
{
  filePath: "/absolute/path/to/file.ts",
  prompt: "add JSDoc documentation",
  line: 42,
  smart: false
}

// Smart edit on selection
{
  filePath: "/absolute/path/to/file.ts",
  prompt: "refactor to async/await",
  startLine: 10,
  endLine: 20,
  smart: true
}
```

### Manual Invocation

1. Run the tool to prepare context
2. Copy the generated prompt
3. Invoke the agent: `@inline-edit` or `@inline-edit-smart`

## Files Created

```
.opencode/
├── agent/
│   ├── inline-edit.md              # Quick mode agent prompt
│   └── inline-edit-smart.md        # Smart mode agent prompt
├── tool/
│   └── inline-edit.ts              # Context preparation tool
├── opencode.jsonc                  # Agent configurations (modified)
├── INLINE_EDIT_USAGE.md           # User documentation
├── INLINE_EDIT_README.md          # Implementation summary (this file)
├── demo-inline-edit.cjs           # Demonstration script
└── test-inline-edit.ts            # Test file for demos
```

## Key Benefits

1. **Efficiency**: Pre-loaded context eliminates wasted LLM turns
2. **Flexibility**: Choose between quick single-turn and smart multi-turn modes
3. **No Core Changes**: Entirely implemented via OpenCode's plugin system
4. **IDE Integration Ready**: Designed for use from editor extensions
5. **Type Safe**: TypeScript implementation with proper types

## Design Decisions

### Why Two Agents?

- **inline-edit**: For common, simple edits where speed matters
- **inline-edit-smart**: For complex changes requiring codebase exploration

### Why Pre-load Context?

Without pre-loading, the agent workflow would be:
1. Agent calls read tool (1 turn)
2. Agent calls edit tool (1 turn)

With pre-loading:
1. Tool pre-reads file (0 LLM turns)
2. Agent calls edit tool (1 turn)

**Result**: 50% reduction in LLM turns for simple edits

### Why Custom Tool vs Direct Invocation?

The tool provides:
- Consistent context formatting
- Language detection
- Absolute path validation
- Error handling
- Easy programmatic access for IDE integrations

## Testing

Run the demo to see all three scenarios:
```bash
cd .opencode
node demo-inline-edit.cjs
```

This demonstrates:
1. Adding documentation to a function (quick mode)
2. Adding error handling (smart mode)
3. Documenting a class (quick mode)

## IDE Integration Example

For VS Code or other editors:

```typescript
// Get current cursor position or selection
const line = editor.selection.active.line + 1
const filePath = editor.document.uri.fsPath

// Prepare context
const context = await opencodeAPI.executeTool('inline-edit', {
  filePath,
  prompt: userInput,
  line,
  smart: complexEdit
})

// Invoke agent with prepared context
await opencodeAPI.invokeAgent(
  complexEdit ? 'inline-edit-smart' : 'inline-edit',
  context
)
```

## Limitations

1. Context window is fixed at ±20 lines (configurable in code)
2. Quick mode is strictly single-turn (by design)
3. Requires absolute file paths
4. Tool returns formatted text, not structured data

## Future Enhancements

Potential improvements:
1. Configurable context window size
2. Smart context selection (e.g., include whole function/class)
3. Multiple file editing in smart mode
4. Structured tool output format
5. Undo/redo support
6. Preview mode before applying changes

## Security Considerations

- ✅ No security vulnerabilities detected (CodeQL scan)
- ✅ File access is validated (absolute path, existence check)
- ✅ No arbitrary code execution
- ✅ Tool restrictions properly enforced via agent configuration

## Maintenance

To modify behavior:

1. **Change agent prompts**: Edit `.opencode/agent/*.md`
2. **Change tool restrictions**: Edit `.opencode/opencode.jsonc`
3. **Change context logic**: Edit `.opencode/tool/inline-edit.ts`
4. **Add new modes**: Create new agent config + update tool

## Credits

Implementation follows OpenCode's architecture:
- Custom agents via `.opencode/agent/*.md`
- Custom tools via `.opencode/tool/*.ts`
- Configuration via `.opencode/opencode.jsonc`

No modifications to OpenCode core source required.
