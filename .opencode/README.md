# Inline Edit Feature

This directory contains custom agents and commands for inline code editing functionality.

## Overview

The inline edit feature allows you to make quick, targeted code edits directly from your editor or the command line. It pre-reads file context so the AI agent doesn't waste turns reading files.

## Agents

### `inline-edit`
- **Mode**: Subagent (single-turn)
- **Purpose**: Quick, surgical edits in one shot
- **Tools**: Only `edit` tool enabled
- **Max Steps**: 1 (forces single-turn completion)

### `inline-edit-smart`
- **Mode**: Subagent (multi-turn)  
- **Purpose**: Complex edits that may require exploring the codebase
- **Tools**: Full tool access (read, edit, write, bash, grep, etc.)

## Commands

### `/iedit` - Inline Edit with Line Range
Quick single-turn edit at specific lines.

```bash
/iedit path/to/file.ts 10 20 add error handling
```

Arguments:
- `$1`: File path
- `$2`: Start line
- `$3`: End line
- Remaining: Edit instructions

### `/iedit-smart` - Smart Inline Edit with Line Range
Multi-turn edit with full codebase navigation.

```bash
/iedit-smart path/to/file.ts 10 20 refactor to use the new API pattern
```

### `/edit` - Simple Inline Edit
Basic inline edit specifying file and line.

```bash
/edit path/to/file.ts 15 fix the typo in the function name
```

### `/edit-smart` - Smart Edit
Multi-turn edit with exploration capabilities.

```bash
/edit-smart path/to/file.ts 15 update this function to match the interface in types.ts
```

### `/docs` - Add Documentation
Add documentation to code at specific lines.

```bash
/docs path/to/file.ts 10 25 add JSDoc comments
```

## How It Works

The pre-reading mechanism is built into opencode's command system:

1. **File Reference**: Commands use `@filepath?start=X&end=Y` syntax to reference files
2. **Automatic ReadTool Execution**: When `SessionPrompt.prompt()` processes file parts, it executes `ReadTool` internally (see `createUserMessage()` in `prompt.ts` lines 941-978)
3. **FileTime Registration**: `ReadTool.execute()` calls `FileTime.read(sessionID, filepath)` which registers that the file was read
4. **Edit Tool Works**: When the agent calls the edit tool, `FileTime.assert()` succeeds because the read was already registered for that session

This means:
- The file is actually read via the ReadTool (not just content injection)
- The `FileTime` tracking that edit requires is properly satisfied
- No extra turn is wasted because the read happens during prompt creation, not agent execution

**Key insight**: The `inline-edit` agent disables the read tool because it's not needed - the file is already read before the agent runs. The edit tool still works because `FileTime.read()` was called during the pre-read.

## IDE Integration

To integrate with your editor (e.g., Neovim, VS Code):

1. Get the cursor position or selection range
2. Call opencode in non-interactive mode:

```bash
# Single-turn edit
opencode run --command iedit -- path/to/file.ts 10 20 "add error handling"

# Multi-turn smart edit  
opencode run --command iedit-smart -- path/to/file.ts 10 20 "refactor using new pattern"

# Add documentation
opencode run --command docs -- path/to/file.ts 10 25 "add JSDoc"
```

## Example: Neovim Integration

```lua
-- Add this to your Neovim config
vim.keymap.set('v', '<leader>ie', function()
  local start_line = vim.fn.line("'<")
  local end_line = vim.fn.line("'>")
  local file = vim.fn.expand('%:p')
  local prompt = vim.fn.input('Edit instruction: ')
  
  -- Use vim.system for safer command execution (Neovim 0.10+)
  vim.system({
    'opencode', 'run', '--command', 'iedit', '--',
    file, tostring(start_line), tostring(end_line), prompt
  }, { text = true }, function(result)
    if result.code ~= 0 then
      vim.notify('Edit failed: ' .. (result.stderr or ''), vim.log.levels.ERROR)
    end
  end)
end, { desc = 'Inline edit selection' })
```
