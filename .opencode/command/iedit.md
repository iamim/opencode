---
description: Inline edit with line range - edit specific lines in a file
agent: inline-edit
subtask: true
---

Perform an inline edit on the specified file at the given line range.

**Target:** @$1?start=$2&end=$3

**Edit Instructions (all remaining arguments after file, start, end):**
$ARGUMENTS

The relevant file content at the specified lines is provided above.
Use the edit tool to make the requested changes. Match the oldString exactly from the provided content.
