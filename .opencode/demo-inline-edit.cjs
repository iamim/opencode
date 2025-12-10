#!/usr/bin/env node

/**
 * Demonstration of inline-edit tool functionality
 * 
 * This script simulates what the inline-edit tool does:
 * 1. Read a file with context around a line/selection
 * 2. Format a prompt for the agent
 * 3. Show how to invoke the agent
 */

const fs = require("fs")
const path = require("path")

const CONTEXT_LINES = 20

function readFileWithContext(filePath, startLine, endLine, contextLines = CONTEXT_LINES) {
  const fullContent = fs.readFileSync(filePath, "utf-8")
  const lines = fullContent.split("\n")
  const totalLines = lines.length

  if (startLine === undefined && endLine === undefined) {
    return {
      content: fullContent,
      displayStart: 1,
      displayEnd: totalLines,
    }
  }

  const start = (startLine ?? 1) - 1
  const end = (endLine ?? startLine ?? 1) - 1

  const contextStart = Math.max(0, start - contextLines)
  const contextEnd = Math.min(totalLines - 1, end + contextLines)

  const contextContent = lines.slice(contextStart, contextEnd + 1).join("\n")

  return {
    content: contextContent,
    displayStart: contextStart + 1,
    displayEnd: contextEnd + 1,
  }
}

function prepareInlineEdit(args) {
  const { filePath, prompt, line, startLine, endLine, smart = false } = args

  if (!path.isAbsolute(filePath)) {
    throw new Error("filePath must be an absolute path")
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  let focusStart = line
  let focusEnd = line

  if (startLine !== undefined && endLine !== undefined) {
    focusStart = startLine
    focusEnd = endLine
  }

  const { content, displayStart, displayEnd } = readFileWithContext(filePath, focusStart, focusEnd)

  const agentName = smart ? "inline-edit-smart" : "inline-edit"
  const relativePath = path.relative(process.cwd(), filePath)

  const lineRange = focusStart ? `lines ${focusStart}-${focusEnd}` : "entire file"
  const contextRange = `lines ${displayStart}-${displayEnd}`

  return `=== Inline Edit Context Prepared ===

File: ${relativePath}
Target: ${lineRange}
Context: ${contextRange} (${CONTEXT_LINES} lines before/after)
Mode: ${smart ? "SMART (multi-turn, full tools)" : "QUICK (single-turn, edit-only)"}

--- File Content ---
\`\`\`typescript
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
}

// Demo 1: Add documentation to a function (line 6)
console.log("==== DEMO 1: Add JSDoc to function ====\n")
console.log(
  prepareInlineEdit({
    filePath: path.join(__dirname, "test-inline-edit.ts"),
    prompt: "Add JSDoc documentation",
    line: 6,
    smart: false,
  }),
)

console.log("\n\n")

// Demo 2: Improve error handling (lines 11-13) with smart mode
console.log("==== DEMO 2: Improve error handling with smart mode ====\n")
console.log(
  prepareInlineEdit({
    filePath: path.join(__dirname, "test-inline-edit.ts"),
    prompt: "Add proper error handling for division by zero",
    startLine: 11,
    endLine: 13,
    smart: true,
  }),
)

console.log("\n\n")

// Demo 3: Add documentation to entire class (lines 16-40)
console.log("==== DEMO 3: Document entire class ====\n")
console.log(
  prepareInlineEdit({
    filePath: path.join(__dirname, "test-inline-edit.ts"),
    prompt: "Add comprehensive JSDoc documentation including method descriptions and parameter types",
    startLine: 16,
    endLine: 40,
    smart: false,
  }),
)
