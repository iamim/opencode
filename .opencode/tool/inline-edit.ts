/**
 * Inline Edit Tool
 *
 * This tool provides inline editing functionality by preparing file context
 * and generating prompts for the inline-edit agents.
 *
 * Usage:
 *   1. Call this tool with file path and edit request
 *   2. Copy the generated prompt
 *   3. Invoke the suggested agent (@inline-edit or @inline-edit-smart)
 *
 * The tool pre-reads file content to save the agent from making redundant read calls.
 */

import type { ToolDefinition } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

interface InlineEditArgs {
  filePath: string
  prompt: string
  line?: number
  startLine?: number
  endLine?: number
  smart?: boolean
}

const CONTEXT_LINES = 20

function readFileWithContext(
  filePath: string,
  startLine?: number,
  endLine?: number,
  contextLines: number = CONTEXT_LINES,
): { content: string; displayStart: number; displayEnd: number } {
  const fullContent = fs.readFileSync(filePath, "utf-8")
  const lines = fullContent.split("\n")
  const totalLines = lines.length

  // If no selection, use the whole file
  if (startLine === undefined && endLine === undefined) {
    return {
      content: fullContent,
      displayStart: 1,
      displayEnd: totalLines,
    }
  }

  // Convert to 0-indexed for calculation
  const start = (startLine ?? 1) - 1
  const end = (endLine ?? startLine ?? 1) - 1

  // Calculate context window
  const contextStart = Math.max(0, start - contextLines)
  const contextEnd = Math.min(totalLines - 1, end + contextLines)

  const contextContent = lines.slice(contextStart, contextEnd + 1).join("\n")

  return {
    content: contextContent,
    displayStart: contextStart + 1,
    displayEnd: contextEnd + 1,
  }
}

export default {
  description: `Prepare context for inline code editing at a specific location.

This tool:
1. Reads the file with surrounding context
2. Formats a prompt for the inline-edit agent
3. Returns instructions to invoke the agent with pre-loaded context

Use for quick edits (add docs, fix bugs) or complex refactorings (with smart mode).`,

  args: {
    filePath: {
      type: "string",
      description: "Absolute path to the file to edit",
    },
    prompt: {
      type: "string",
      description: "What to change (e.g., 'add JSDoc', 'fix null check', 'refactor to async')",
    },
    line: {
      type: "number",
      description: "Line number at cursor (1-indexed). Mutually exclusive with startLine/endLine.",
      optional: true,
    },
    startLine: {
      type: "number",
      description: "Selection start line (1-indexed). Use with endLine.",
      optional: true,
    },
    endLine: {
      type: "number",
      description: "Selection end line (1-indexed). Use with startLine.",
      optional: true,
    },
    smart: {
      type: "boolean",
      description: "Enable smart mode (multi-turn, full codebase access). Default: false",
      optional: true,
    },
  },

  async execute(args: InlineEditArgs) {
    const { filePath, prompt, line, startLine, endLine, smart = false } = args

    // Validation
    if (!path.isAbsolute(filePath)) {
      throw new Error("filePath must be an absolute path")
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    // Determine line range
    let focusStart: number | undefined
    let focusEnd: number | undefined

    if (line !== undefined) {
      focusStart = focusEnd = line
    } else if (startLine !== undefined && endLine !== undefined) {
      focusStart = startLine
      focusEnd = endLine
    }

    // Read file with context
    const { content, displayStart, displayEnd } = readFileWithContext(filePath, focusStart, focusEnd)

    const agentName = smart ? "inline-edit-smart" : "inline-edit"
    const relativePath = path.relative(process.cwd(), filePath)

    // Format the prepared prompt
    const lineRange = focusStart ? `lines ${focusStart}-${focusEnd}` : "entire file"
    const contextRange = `lines ${displayStart}-${displayEnd}`

    return `=== Inline Edit Context Prepared ===

File: ${relativePath}
Target: ${lineRange}
Context: ${contextRange} (${CONTEXT_LINES} lines before/after)
Mode: ${smart ? "SMART (multi-turn, full tools)" : "QUICK (single-turn, edit-only)"}

--- File Content ---
\`\`\`
${content}
\`\`\`

--- Edit Instructions ---
${prompt}

--- File Path for Edit Tool ---
${filePath}

=== To Execute ===
Invoke agent: @${agentName}

The agent will use the pre-loaded context above to make changes without reading the file.
${smart ? "Smart mode: Agent can explore codebase if needed." : "Quick mode: Agent makes edit in one turn."}
`
  },
} satisfies ToolDefinition
