import path from "path"
import { pathToFileURL } from "url"

const DEFAULT_CONTEXT_LINES = 20

export const INLINE_AGENT = "inline"
export const INLINE_SMART_AGENT = "inline-smart"

type InlinePart =
  | {
      type: "text"
      text: string
    }
  | {
      type: "file"
      url: string
      filename: string
      mime: string
    }

export type InlinePromptResult = {
  agent: string
  parts: InlinePart[]
  tools?: Record<string, boolean>
}

export type InlinePromptInput = {
  filePath: string
  prompt: string
  startLine: number
  endLine?: number
  contextLines?: number
  smart?: boolean
  cwd?: string
}

export async function buildInlinePrompt(input: InlinePromptInput): Promise<InlinePromptResult> {
  const cwd = input.cwd ?? process.cwd()
  const absPath = path.isAbsolute(input.filePath) ? input.filePath : path.resolve(cwd, input.filePath)

  const prompt = input.prompt.trim()
  if (!prompt) {
    throw new Error("Inline prompt cannot be empty")
  }

  if (!input.startLine || input.startLine < 1) {
    throw new Error("Inline edit requires a start line (1-based)")
  }

  const file = Bun.file(absPath)
  if (!(await file.exists())) {
    throw new Error(`File not found: ${absPath}`)
  }

  const content = await file.text()
  const lines = content.split(/\r?\n/)
  const totalLines = lines.length

  if (input.startLine > totalLines) {
    throw new Error(`Start line ${input.startLine} is beyond end of file (${totalLines} lines)`)
  }
  const startLine = input.startLine
  const endLine = Math.min(input.endLine ?? input.startLine, totalLines)
  if (endLine < startLine) {
    throw new Error("End line cannot be before start line")
  }

  const contextLines = input.contextLines ?? DEFAULT_CONTEXT_LINES
  const contextStart = Math.max(1, startLine - contextLines)
  const contextEnd = Math.min(totalLines, endLine + contextLines)

  const selection = lines.slice(startLine - 1, endLine).join("\n")
  const relativePath = path.relative(cwd, absPath) || absPath

  const body = [
    `File: ${relativePath}`,
    `Selection lines: ${startLine}-${endLine}`,
    `Instruction: ${prompt}`,
    selection.trim()
      ? `Selected code:\n\`\`\`\n${selection}\n\`\`\``
      : "Selection is empty; insert changes at the cursor line shown above.",
    `Context lines ${contextStart}-${contextEnd} are attached below. Use the edit tool to update only the selection.`,
  ]
    .filter(Boolean)
    .join("\n\n")

  const fileUrl = pathToFileURL(absPath)
  fileUrl.searchParams.set("start", contextStart.toString())
  fileUrl.searchParams.set("end", contextEnd.toString())

  const parts: InlinePart[] = [
    {
      type: "text",
      text: body,
    },
    {
      type: "file",
      url: fileUrl.toString(),
      filename: path.basename(absPath),
      mime: "text/plain",
    },
  ]

  return {
    agent: input.smart ? INLINE_SMART_AGENT : INLINE_AGENT,
    parts,
    tools: input.smart ? undefined : { "*": false, edit: true },
  }
}
