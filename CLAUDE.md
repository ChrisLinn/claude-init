+ During you interaction with the user, if you find anything reusable in this project (e.g. version of a library, model name), especially about a fix to a mistake you made or a correction you received, you should take note in the `Lessons` section in the `CLAUDE.md` file so you will not make the same mistake again.

## Lessons

### Test Maintenance
- When tests fail after removing template files, update the test assertions to reference existing template files. For example, after removing `.claude/commands/commit.md`, the test was updated to check for `simple-planning.md` instead (commit 348f79d removed the custom commit command).
