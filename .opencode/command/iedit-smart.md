---
description: Smart inline edit with line range - multi-turn edit at specific lines
agent: inline-edit-smart
subtask: true
---

Perform a smart inline edit on the specified file at the given line range.

**Target:** @$1?start=$2&end=$3

**Edit Instructions (all remaining arguments after file, start, end):**
$ARGUMENTS

The relevant file content at the specified lines is provided above.
You may explore additional files or context if needed to complete this edit correctly.
