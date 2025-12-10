# Inline Edit Functionality

This document describes how to use the inline edit feature in OpenCode.

## Overview

The inline edit functionality consists of:

1. **Two specialized agents** for focused code editing
2. **A custom tool** that prepares file context
3. **Configuration** that restricts tool access appropriately

## Agents

### `inline-edit` (Quick Mode)

- **Purpose**: Fast, single-turn edits
- **Tools**: Only `edit` tool enabled
- **Max steps**: 1
- **Use for**: Adding docs, fixing simple bugs, small refactorings

### `inline-edit-smart` (Smart Mode)

- **Purpose**: Complex, multi-file edits
- **Tools**: Full tool access (read, write, bash, glob, grep, etc.)
- **Max steps**: Unlimited
- **Use for**: Refactorings requiring codebase exploration, multi-file changes

## Usage

### Method 1: Direct Agent Invocation

You can invoke the agents directly with pre-loaded context:

```bash
@inline-edit <file-content>

Task: Add JSDoc documentation

File path: /path/to/file.ts
```

### Method 2: Using the Custom Tool

The `inline-edit` tool prepares context for you:

```typescript
// Example: Add documentation to a function at line 42
{
  filePath: "/absolute/path/to/file.ts",
  prompt: "add JSDoc documentation",
  line: 42,
  smart: false
}

// Example: Refactor a selection (lines 10-20) with smart mode
{
  filePath: "/absolute/path/to/file.ts", 
  prompt: "refactor to use async/await",
  startLine: 10,
  endLine: 20,
  smart: true
}
```

The tool will:
1. Read the file with 20 lines of context before/after
2. Format a prompt with the file content
3. Return instructions for invoking the appropriate agent

## How It Works

### Single-Turn Editing (inline-edit)

The `inline-edit` agent is configured to:
- Accept only the `edit` tool
- Complete in exactly 1 turn (maxSteps: 1)
- NOT call the `read` tool (context is pre-loaded)

This avoids wasting a turn on reading the file since the tool pre-reads it.

### Smart Editing (inline-edit-smart)

The `inline-edit-smart` agent is configured to:
- Access all tools including read, bash, glob, grep
- Take multiple turns as needed
- Explore the codebase to understand context
- Make multi-file changes if required

## Configuration

Agents are configured in `.opencode/opencode.jsonc`:

```jsonc
{
  "agent": {
    "inline-edit": {
      "mode": "subagent",
      "maxSteps": 1,
      "tools": {
        "edit": true,
        "read": false,
        "write": false,
        "bash": false,
        // ... all other tools disabled
      }
    },
    "inline-edit-smart": {
      "mode": "subagent",
      "tools": {
        "read": true,
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

Agent prompts are in `.opencode/agent/inline-edit.md` and `.opencode/agent/inline-edit-smart.md`.

## IDE Integration

For IDE integration (e.g., VS Code extension):

1. Get cursor position or selection (line numbers)
2. Read file with context (±20 lines)
3. Call OpenCode with:
   ```
   @inline-edit <prepared context>
   
   Task: <user's edit request>
   File path: <absolute path>
   ```

Or use the `inline-edit` tool programmatically.

## Examples

### Example 1: Add Documentation

```
@inline-edit 

File: src/utils/helper.ts
Lines 42-42

Task: Add JSDoc documentation

File content:
```
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

File path: /home/user/project/src/utils/helper.ts
```

The agent will add JSDoc in a single turn without reading the file.

### Example 2: Complex Refactoring

```
@inline-edit-smart

File: src/api/handler.ts  
Lines 15-30

Task: Refactor to use async/await instead of promises

File content:
```
// ... context ...
```

File path: /home/user/project/src/api/handler.ts
```

The smart agent can:
- Read related files to understand the API structure
- Check error handling patterns elsewhere
- Make the refactoring with proper error handling
- Ensure consistency with the rest of the codebase

## Benefits

1. **Efficiency**: Pre-loading context saves LLM turns
2. **Precision**: Focused agents with minimal tool access
3. **Flexibility**: Choose between quick edits and smart exploration
4. **No source changes**: Implemented entirely through OpenCode's plugin system

## Implementation Details

- **Agents**: `.opencode/agent/*.md` (markdown with frontmatter)
- **Tool**: `.opencode/tool/inline-edit.ts` (TypeScript)
- **Config**: `.opencode/opencode.jsonc` (JSON with comments)

All implementation is external to OpenCode core, using only the plugin/customization APIs.
