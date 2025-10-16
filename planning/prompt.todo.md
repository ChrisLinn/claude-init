Title: Interactive prompts for .claude/commands overwrite and optional .claude/agents install

Overview
- Add interactive prompts to `npx claude-init` without changing defaults for non-interactive runs.
- When `.claude/commands` exists: optionally overwrite existing `*.md` from templates (still add missing files).
- Ask whether to install `.claude/agents` at all; if declined, skip agents entirely.

Goals
- Preserve current behavior by default (create if missing; add-only if exists).
- Provide a single, simple prompt for `.claude/commands` overwrite of `*.md` files when applicable.
- Provide a single, simple prompt to install `.claude/agents` (gate the whole agents task).
- Ensure non-interactive/CI runs remain deterministic and non-blocking.

Current Behavior Summary
- `src/cli.js:39` builds a fixed tasks list for: `CLAUDE.md`, `.devcontainer`, `.claude/settings.json`, `.claude/commands`, `.claude/agents`.
- `src/fileManager.js:75` `handleSelectiveFileCopy(targetDir, relativePath)`:
  - If target dir missing: copies all template files.
  - If exists: copies only missing files, preserving existing.
- Templates are sourced from repo root via `src/utils.js:getTemplatesPath()`.

User Experience (Target)
- Fresh project:
  - No prompts impact behavior; all items install as today.
- Existing `.claude/commands` with user-modified `*.md`:
  - Prompt: “Overwrite existing .claude/commands/*.md with template versions? (y/N)”
  - Yes: overwrite only `*.md` files found in templates; also add any missing files (all types).
  - No (default): keep existing files; still add missing files.
- `.claude/agents`:
  - Prompt: “Install .claude/agents files? (y/N)”
  - Yes: proceed with current behavior (create or add-missing).
  - No: skip agents entirely; print a brief “skipped by user” line.
- Non-interactive/CI (no TTY):
  - Default to current behavior: do not overwrite commands; do install agents.

Implementation Plan
1) Prompt helper
   - Add `src/prompt.js` exporting `promptYesNo(question, defaultAnswer)` using Node `readline`.
   - Behavior:
     - If `process.stdin.isTTY` is false → return `defaultAnswer` immediately (no prompt).
     - Accept `y`, `yes`, `n`, `no` (case-insensitive); empty answer → default.
     - Gracefully close interface on resolve.

2) Extend selective copy to support overwriting
   - Update `handleSelectiveFileCopy` signature to accept `options = { overwriteExisting?: boolean, filter?: (relPath: string) => boolean }`.
   - If dir missing → unchanged (copy all template files; report created with files count).
   - If exists:
     - Build file lists via `getFilesInDirectory` (template vs target) with relative paths.
     - If `overwriteExisting` is false (default) → current behavior (copy only missing files).
     - If `overwriteExisting` is true → for every template file that passes `filter` (if provided; default allow all):
       - Ensure destination dir exists; copy template → destination with overwrite semantics.
       - Track `filesOverwritten` for files that existed; `filesAdded` for new ones.
   - Return shape additions: include `filesOverwritten` when `overwriteExisting` is true.

3) CLI orchestration
   - Before tasks array:
     - Detect whether `.claude/commands` exists and whether there is any overlap of `*.md` files between templates and target.
     - If overlap and TTY → `overwriteCommandsMd = await promptYesNo("Overwrite existing .claude/commands/*.md with template versions? (y/N)", false)`.
       - Else set `overwriteCommandsMd = false` (non-interactive default).
     - Ask for agents install: `includeAgents = await promptYesNo("Install .claude/agents files? (y/N)", true for TTY, true for non-TTY to match current behavior)`
       - If non-interactive, default `true` to preserve existing behavior.
   - Build tasks:
     - `.claude/commands`: call `handleSelectiveFileCopy(targetDir, '.claude/commands', { overwriteExisting: overwriteCommandsMd, filter: (p) => p.endsWith('.md') })`.
     - `.claude/agents`: include the task only if `includeAgents === true`. If false, note that it was skipped by user after summary.
   - Enhance `formatResult` in `src/cli.js` to append `filesOverwritten` when present: “(X files, overwritten: Y)”.

4) Documentation
   - Update README with a short “Interactive Prompts” section:
     - Overwrite behavior for `.claude/commands/*.md` when directory exists.
     - Optional install of `.claude/agents`.
     - Non-interactive defaults and how CI behaves.
     - Example transcript of an interactive run.

5) Tests (minimal, focused)
   - Prefer testing `fileManager` behavior to avoid TTY coupling.
   - Add tests in `test/cli.test.js`:
     - Overwrite flow: create `tempDir/.claude/commands/debug.md` with custom content; call `handleSelectiveFileCopy(..., { overwriteExisting: true, filter: (p) => p.endsWith('.md') })`; assert content replaced with template and `filesOverwritten >= 1`.
     - Filter behavior: ensure non-`*.md` files are not overwritten when filter is set.
     - No-regression: default call without options remains add-only when directory exists.
   - Optionally unit test the filter function and overwrite counts for nested paths.

6) Non-interactive behavior and environment overrides (optional)
   - Add optional env vars (not required for MVP):
     - `CLAUDE_INIT_OVERWRITE_COMMANDS_MD=1|0`
     - `CLAUDE_INIT_INSTALL_AGENTS=1|0`
   - If set, env vars override both TTY and prompts.

Detailed TODOs
- prompt helper
  - [X] Create `src/prompt.js` with `promptYesNo`.
  - [X] Implement TTY detection; return default immediately when non-TTY.
  - [X] Normalize answers; ensure clean shutdown of readline.

- file manager overwrite support
  - [X] Change signature: `handleSelectiveFileCopy(targetDir, relativePath, options = {})`.
  - [X] Implement `overwriteExisting` logic; compute `filesOverwritten` and `filesAdded`.
  - [X] Support `filter(relPath)` to limit which files are overwritten (e.g., only `*.md`).
  - [X] Keep default behavior identical when `options` not provided.
  - [X] Ensure nested directories are handled (use existing `ensureDir` + relative paths).

- CLI wiring
  - [X] Import `promptYesNo` in `src/cli.js`.
  - [X] Pre-scan `.claude/commands` template vs target for `*.md` overlap.
  - [X] Prompt for `overwriteCommandsMd` only when overlap exists; otherwise keep false.
  - [X] Prompt for `includeAgents` with default true; honor non-TTY fallback to true.
  - [X] Pass options to `handleSelectiveFileCopy` for commands.
  - [X] Conditionally include agents task or log a user-skip message.
  - [X] Enhance `formatResult` to surface `filesOverwritten`.

- tests
  - [X] Add overwrite test for commands: verify template content replaces custom content when overwrite on.
  - [X] Add filter test to ensure only `*.md` files change.
  - [X] Ensure existing tests still pass without changes to default flows.

- docs
  - [X] README: add section "Interactive Prompts" with behavior matrix and examples.
  - [X] Mention CI behavior and optional env overrides (if implemented now or later).

Edge Cases & Considerations
- Non-TTY detection: `process.stdin.isTTY` gate for prompting; avoid hanging in CI.
- Overwrite scope for commands: limit to `*.md` files only via `filter` to protect non-MD customizations.
- Existing agents with local customizations: user may decline install; we do not delete or change existing files.
- Copy semantics: `fs-extra.copy` overwrites when destination exists; we must control this explicitly by deciding when to copy.
- Performance: file scans are small; no need for concurrency here.
- Windows paths: use `path.join`; no assumptions about separators in `filter` (operate on joined relative paths and use `.endsWith('.md')`).
- Result shape: adding `filesOverwritten` should not break existing code; guard in formatter.

Acceptance Criteria
- When `.claude/commands` exists and has at least one `*.md` that is also present in templates, an interactive run prompts to overwrite; choosing Yes overwrites only those `*.md` files while still adding missing files; choosing No preserves existing files and still adds missing files.
- User is prompted whether to install `.claude/agents`; choosing No cleanly skips agents install/update; choosing Yes runs current behavior.
- Non-interactive runs do not prompt, do not overwrite commands, and do include agents by default.
- Summary output shows number of files added and, when applicable, number of files overwritten.
- Existing tests pass; new tests covering overwrite behavior pass.

Open Questions
- Should we also prompt to update `.claude/agents` when it already exists (similar to commands), or is the single “install agents?” prompt sufficient? (MVP: single prompt to include/exclude.)
- Do we want environment variables to control prompts in CI now, or later?
- Should we offer a backup option when overwriting (e.g., `*.bak`)? (Default: no.)

Timeline (MVP)
- Day 1: Implement `promptYesNo`, extend `handleSelectiveFileCopy`, wire CLI prompts, adjust formatter.
- Day 2: Tests (overwrite + filter), README updates, polish, run full test matrix.

File References (for implementation)
- src/cli.js:39 — tasks array assembly point to introduce prompts/conditional tasks.
- src/fileManager.js:75 — `handleSelectiveFileCopy` entry to extend with overwrite/filter options.
