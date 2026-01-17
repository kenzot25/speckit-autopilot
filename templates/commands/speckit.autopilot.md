---
description: Complete automated workflow from feature description to implementation: specify → clarify → plan → tasks → implement → review
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This command automates the complete Speckit workflow from initial feature description to implementation. It uses the MCP server tool `speckit_autopilot` for deterministic execution with no interruptions.

**Preferred Method**: Use the MCP server tool `speckit_autopilot` directly for better control and deterministic execution.

## Execution Flow

When `/speckit.autopilot` is called, it should:

1. **Call MCP tool `speckit_autopilot`** with the feature description
2. **Handle the workflow** based on the tool's response:
   - If clarification questions are returned, ask the user and update the spec
   - If implementation tasks are returned, execute them automatically without interruptions
   - If review issues are found, fix them iteratively until clean

### Step 1: Specify

**Goal**: Create initial feature specification from user's description.

**Execution**:
- Extract feature description from `$ARGUMENTS`
- If `$ARGUMENTS` is empty, ERROR: "No feature description provided. Usage: /speckit.autopilot <feature description>"
- Call MCP tool `speckit_specify` with the feature description
- **Output**: Report completion with spec file path and branch name
- **Continue to Step 2** automatically

### Step 2: Clarify (Iterative)

**Goal**: Review specification and ask clarifying questions until satisfied.

**Execution**:
- Call MCP tool `speckit_clarify` with the feature directory
- If questions are returned:
  - Present questions to the user (one at a time or all at once)
  - Get user answers
  - Update the spec with answers
  - Call `speckit_clarify` again if needed
- Maximum iterations: 3 clarification rounds (15 total questions max)
- User can skip by saying "skip clarify" or "proceed to plan"
- **Output**: Report final clarification status and updated spec path
- **Continue to Step 3** when satisfied

### Step 3: Plan

**Goal**: Create technical implementation plan based on clarified specification.

**Execution**:
- Call MCP tool `speckit_plan` with the feature directory
- **Output**: Report completion with plan.md path and generated artifacts
- **Continue to Step 4** automatically

### Step 4: Tasks

**Goal**: Break down plan into actionable, dependency-ordered tasks.

**Execution**:
- Call MCP tool `speckit_tasks` with the feature directory
- **Output**: Report completion with tasks.md path, task count, and execution strategy
- **Continue to Step 5** automatically

### Step 5: Implement

**Goal**: Execute all tasks and implement the feature.

**Execution**:
- Call MCP tool `speckit_implement` with the feature directory and `autoContinue: true`
- **CRITICAL: NO INTERRUPTIONS**
  - The tool returns a list of incomplete tasks
  - Execute ALL tasks automatically without asking questions
  - Mark tasks as complete using `speckit_mark_task_complete` after each task
  - Continue until ALL tasks are marked [X] complete
  - **DO NOT ask**: "Should I continue?" or "Do you want to test?" - just continue automatically
- **Progress reporting**: Report progress after each phase, then immediately continue
- **Output**: Report final implementation status with summary of completed work
- **Continue to Step 6** automatically

### Step 6: Review (Iterative Loop)

**Goal**: Review code quality, fix issues, and ensure code is production-ready.

**Execution**:
- Call MCP tool `speckit_review` with the feature directory
- **Iterative Loop**:
  - If build/compile errors found (CRITICAL issues):
    - Fix them automatically
    - Re-run `speckit_review`
    - Continue until build passes
  - If type errors or architecture violations (HIGH issues):
    - Fix them automatically
    - Re-run `speckit_review`
    - Continue until resolved
  - If code quality issues (MEDIUM issues):
    - Fix them automatically
    - Re-run `speckit_review`
  - Continue loop until:
    - All CRITICAL and HIGH issues are resolved, OR
    - Maximum 10 iterations reached
  - If only LOW issues remain:
    - Report remaining LOW issues
    - Ask user if they want to fix LOW issues or proceed
- **Output**: Report final review status with summary of fixes applied
- **Complete workflow** when code is clean (no CRITICAL or HIGH issues)

## CRITICAL WORKFLOW RULES

**MANDATORY: NO INTERRUPTIONS**
- **Never stop mid-implementation** to ask questions like "Should I continue?" or "Do you want to test?"
- **Never pause** between phases to wait for user confirmation
- **Automatically continue** from one task/phase to the next until ALL tasks are complete
- **Only report progress**, don't ask for permission to proceed
- **Finish everything in one pass** - a task is only complete when ALL related work is done

**Progress Reporting Format**:
```
✓ Completed Phase 2: [summary]
→ Continuing to Phase 3...
```

**NOT**:
```
Completed Phase 2. Should I continue with Phase 3?
```

## Error Handling

- **If any step fails**: Stop execution, report error, and suggest remediation
- **If user interrupts**: Save current state and report where to resume
- **If prerequisites missing**: Guide user to run prerequisite commands manually

## Progress Reporting

After each step completes, report:
- Step name and status (✓ Complete / ✗ Failed)
- Key outputs (file paths, counts, summaries)
- Next step to be executed
- Estimated time/effort if applicable

## User Control

Users can:
- **Skip steps**: Say "skip clarify", "skip plan", "skip review", etc. to bypass optional steps
- **Stop**: Say "stop" or "pause" to halt execution at any point
- **Resume**: Can resume from last completed step by running individual commands
- **Review**: Each step's outputs are saved and can be reviewed before proceeding
- **Review loop control**: During review step, can say "skip remaining fixes" to stop iteration and proceed

## Example Usage

```text
/speckit.autopilot Add user authentication with email and password
```

This will:
1. Call `speckit_autopilot` MCP tool with the feature description
2. Handle clarification questions if needed
3. Execute all implementation tasks automatically without interruptions
4. Review code quality and fix issues until clean

## Notes

- This command uses MCP server tools for deterministic execution
- All intermediate files are preserved for review
- The workflow respects all existing Speckit conventions and quality checks
- Implementation follows the same rules as `/speckit.implement` (no partial delivery, type safety, etc.)
- The MCP server enforces "no interruptions" rule programmatically

## MCP Server Integration

The command delegates to MCP tools:
- `speckit_specify` - Create spec
- `speckit_clarify` - Clarify spec (iterative)
- `speckit_plan` - Create plan
- `speckit_tasks` - Generate tasks
- `speckit_implement` - Get task list (then execute automatically)
- `speckit_review` - Review code (iterative)
- `speckit_mark_task_complete` - Mark tasks as done

See `speckit-autopilot/README.md` for MCP server documentation.
