# .claude/settings.json Overwrite Prompt — Detailed Plan

## Context
- Current behavior:
  - If `.claude/settings.json` is missing: create from template.
  - If it exists: skip to preserve custom settings.
  - This is implemented via `handleSingleFile` which has no overwrite option: src/fileManager.js:156.
  - The CLI wires `.claude/settings.json` through `handleSingleFile(...)` without options: src/cli.js:92.
- Related prompts already exist:
  - Overwrite `.claude/commands/*.md`? default No.
  - Install `.claude/agents`? default Yes.

## Goal
- Ask whether to overwrite `.claude/settings.json` when it exists.
- Default answer: No (preserve user settings).
- Non‑TTY behavior (CI): do not overwrite (same default as interactive).

## Non‑Goals
- Do not change default non-destructive behavior for any other file/directory.
- Do not add new CLI flags (e.g., `--overwrite-settings`) in this iteration.
- Do not implement backups by default (may be a future enhancement).

## Technical Design

### 1) Add overwrite prompt in CLI
- Where: src/cli.js, near existing prompt logic for commands and agents (before building `tasks`).
- Logic:
  - Compute `settingsPath = path.join(targetDir, '.claude/settings.json')`.
  - If `settingsPath` exists, ask:
    - Question: `Overwrite existing .claude/settings.json with template version?`
    - Default: `false` (render hint `y/N`).
  - Save the answer in `overwriteSettings` (boolean; default `false` when non‑TTY via prompt helper).

### 2) Extend single-file copy to support overwrite
- File: src/fileManager.js
- Function: `handleSingleFile(targetDir, relativePath, options = {})`
- Add option: `{ overwrite = false }`
- Behavior:
  - If target file does not exist: create from template (unchanged), return `{ action: 'created', details: 'Created …' }`.
  - If exists and `overwrite === false`: return `{ action: 'skipped', details: 'File … already exists' }` (unchanged).
  - If exists and `overwrite === true`:
    - Copy template over target (ensuring parent dir).
    - Return `{ action: 'updated', details: 'Overwrote .claude/settings.json with template' }`.
- Compatibility:
  - Existing callers without `options` behave exactly as before.

### 3) Wire CLI to pass overwrite option
- File: src/cli.js
- In the `.claude/settings.json` task:
  - Change from: `handleSingleFile(targetDir, '.claude/settings.json')`
  - To: `handleSingleFile(targetDir, '.claude/settings.json', { overwrite: overwriteSettings })`

### 4) Output/UX
- `formatResult` already supports `updated` and will show `↻` with details; no change needed.
- Prompt messaging is consistent with `.claude/commands` overwrite prompt (Yes/No with default No).

### 5) Documentation updates
- README.md
  - Under `.claude/settings.json` section, add:
    - Interactive prompt: If file exists, ask whether to overwrite; default No (preserves custom settings).
  - Under Interactive Prompts, add a new point:
    - `Overwrite existing .claude/settings.json with template version? (y/N)` — default No; non‑TTY uses default.
  - Update example outputs to show either the skip line or an updated line (e.g., `↻ Overwrote .claude/settings.json with template`).

## Tests

### Unit tests (node:test)
- File: test/cli.test.js
- Add: `overwrites settings.json when overwrite option is true`
  - Arrange: create `.claude/settings.json` with custom content in temp dir.
  - Act: call `handleSingleFile(tempDir, '.claude/settings.json', { overwrite: true })`.
  - Assert:
    - `result.action === 'updated'`.
    - File content equals template version from repo.
- Validate existing tests remain valid:
  - `skips when file already exists` still passes because default `overwrite` is false.

### Manual QA scenarios
- Fresh run (no settings): created.
- Existing settings; answer No: skipped, original content preserved.
- Existing settings; answer Yes: updated, template content present.
- Non‑TTY (CI): no prompt; default No; skipped.
- Invalid input to prompt (e.g., `maybe`): defaults to No; skipped.

## Acceptance Criteria
- When `.claude/settings.json` exists, interactive users are prompted.
- Default behavior preserves existing settings both in TTY and non‑TTY.
- Choosing Yes overwrites and reports `updated` in output.
- README updated to describe the new prompt and defaults.
- Tests cover overwrite path and existing skip path remains green.

## Edge Cases & Error Handling
- Missing template file: propagate error (consistent with existing copy logic).
- File permission errors: surfaced by spinner fail with a clear error (existing behavior).
- Path normalization safe across platforms via `path.join`.

## Risks & Mitigations
- Risk: Unintended overwrite. Mitigation: default No; explicit prompt; clear messaging.
- Risk: API change breaks callers. Mitigation: `options` is optional; default preserves old behavior.

## Future Enhancements (not in scope)
- CLI flags: `--overwrite-settings` / `--no-overwrite-settings` for non‑interactive control.
- Backup before overwrite (e.g., `.claude/settings.json.bak`).
- Dry‑run flag to preview actions.

## Implementation Checklist
- [X] Add `overwriteSettings` prompt in src/cli.js (default false).
- [X] Extend `handleSingleFile` to accept `{ overwrite = false }` and support overwrite path.
- [X] Wire `.claude/settings.json` task to pass `{ overwrite: overwriteSettings }`.
- [X] Update README.md sections and example output blocks.
- [X] Add unit test for overwrite path in test/cli.test.js.
- [X] Run test suite locally; ensure no regressions.
- [ ] Verify interactive and non‑interactive behavior manually.

## Rollout Notes
- Backwards compatible; default behavior unchanged unless user opts-in.
- No migration required.

## PR Notes
- Include screenshots or logs of interactive runs showing both choices (Yes/No).
- Reference file changes succinctly in the PR description.

