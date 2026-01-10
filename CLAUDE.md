+ During you interaction with the user, if you find anything reusable in this project (e.g. version of a library, model name), especially about a fix to a mistake you made or a correction you received, you should take note in the `Lessons` section in the `CLAUDE.md` file so you will not make the same mistake again.

## Lessons

- When adding new template directories (like `.devcontainer-rust/`, `.devcontainer-go/`) to the project, remember to also add them to the `files` array in `package.json`. Otherwise they won't be included in the published npm package and users will get "ENOENT: no such file or directory" errors when running via `npx`.
