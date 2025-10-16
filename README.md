# claude-init

A CLI tool to initialize Claude development environment with standardized configurations and templates.

## Features

- **Smart Setup**: Automatically detects existing files and only creates/updates what's needed
- **Interactive Prompts**: Asks before overwriting existing command files or installing agents
- **Non-destructive by Default**: Preserves existing files unless you choose to overwrite
- **Progress Feedback**: Clear visual indicators of what's being created, updated, or skipped
- **Cross-platform**: Works on Windows, macOS, and Linux
- **CI-friendly**: Non-interactive mode with sensible defaults when not running in a TTY

## Requirements

- Node.js `>=16.0.0`
- Permission to write files in the target project directory

## Installation

- One-off run (recommended):

  ```bash
  npx claude-init
  ```

- Or install globally:

  ```bash
  npm install -g claude-init
  claude-init
  ```

## Usage

### Quick Start

Running `npx claude-init` sets up your current directory with:

- `CLAUDE.md` - Project instructions and scratchpad for Claude
- `.devcontainer/` - Development container configuration (also added `codex-cli` and `spec-kit`.)
- `.claude/settings.json` - Claude-specific settings
- `.claude/commands/` - Custom Claude commands
- `.claude/agents/` - Specialized agent configurations

### What It Does

#### 📄 CLAUDE.md
- **If missing**: Creates new file with the template content.
- **If exists and has `# CLAUDE.md` heading**: Inserts the template content directly under that heading.
- **If exists and no `# CLAUDE.md` heading**: Adds a `# CLAUDE.md` heading at the top, then the template content, keeping your original content below.
- **If it already contains the template content**: Skips to preserve your content.

#### 📁 .devcontainer
- **If missing**: Creates complete directory with Docker configuration
- **If exists**: Skips entirely to preserve your setup

#### ⚙️ .claude/settings.json
- **If missing**: Creates with default Claude settings
- **If exists**: Prompts whether to overwrite with template version
- **Interactive prompt**: If the file exists, you'll be asked whether to overwrite it
  - Answer **Yes** to replace with fresh template
  - Answer **No** (default) to preserve your custom settings

#### 📋 .claude/commands
- **If missing**: Creates with all template files
- **If exists**: Only adds missing files by default
- **Interactive prompt**: If existing `.md` files are detected, you'll be asked whether to overwrite them with template versions
  - Answer **Yes** to replace your customized `.md` files with fresh templates (while still adding any missing files)
  - Answer **No** (default) to keep your existing `.md` files and only add missing files

#### 🤖 .claude/agents
- **Interactive prompt**: You'll be asked whether to install `.claude/agents` files
  - Answer **Yes** (default) to install/update agent files
  - Answer **No** to skip agents entirely

### Interactive Prompts

When running interactively (in a terminal), `claude-init` will ask you:

1. **Overwrite existing .claude/settings.json?** (only if the file already exists)
   - Prompt: `Overwrite existing .claude/settings.json with template version? (y/N):`
   - Default: **No** (preserves your custom settings)
   - If **Yes**: Replaces your settings file with fresh template
   - If **No**: Keeps your existing settings file

2. **Overwrite existing .claude/commands/\*.md?** (only if you have existing `.md` files that match templates)
   - Prompt: `Overwrite existing .claude/commands/*.md with template versions? (y/N):`
   - Default: **No** (preserves your customizations)
   - If **Yes**: Replaces existing `.md` files with templates, still adds missing files
   - If **No**: Keeps your existing files, only adds missing files

3. **Install .claude/agents?**
   - Prompt: `Install .claude/agents files? (Y/n):`
   - Default: **Yes** (installs agents)
   - If **Yes**: Installs/updates agents as normal
   - If **No**: Skips agents entirely (shown in summary)

**Non-interactive mode (CI/scripts)**: When `process.stdin.isTTY` is false (e.g., in CI pipelines), prompts are skipped and defaults are used:
- `.claude/settings.json` is **not** overwritten (preserves custom settings)
- `.claude/commands/*.md` files are **not** overwritten (preserves customizations)
- `.claude/agents` **is** installed (matches current behavior)

## Example Output

### Interactive Run (First Time)

```
🚀 Claude Environment Initializer
Initializing in: /path/to/your/project

Install .claude/agents files? (Y/n): y

✓ Created new CLAUDE.md
✓ Created .devcontainer directory
✓ Created .claude/settings.json
✓ Created .claude/commands with 5 files
✓ Created .claude/agents with 3 files

📊 Summary:
   Created: 5 items
   Files added: 8

✨ Claude environment is ready!
```

### Interactive Run (With Existing Files)

```
🚀 Claude Environment Initializer
Initializing in: /path/to/your/project

Overwrite existing .claude/commands/*.md with template versions? (y/N): n
Install .claude/agents files? (Y/n): n
Overwrite existing .claude/settings.json with template version? (y/N): n

- CLAUDE.md already contains template content
- Directory .devcontainer already exists
- File .claude/settings.json already exists
↻ Added 1 missing files to .claude/commands (added: 1)
- All files in .claude/agents are up to date

📊 Summary:
   Updated: 1 items
   Skipped: 3 items (already exist)
   Files added: 1
   - .claude/agents skipped by user

✅ Claude environment is already up to date!
```

### Non-Interactive Run (Original Output)

```
🚀 Claude Environment Initializer
Initializing in: /path/to/your/project

✓ Created new CLAUDE.md
✓ Created .devcontainer directory  
✓ Created .claude/settings.json
↻ Added 2 missing files to .claude/commands (2 files)
- All files in .claude/agents are up to date

📊 Summary:
   Created: 3 items
   Updated: 1 items
   Skipped: 1 items (already exist)
   Files added: 2

✨ Claude environment is ready!
```

## File Structure Created

```
your-project/
├── CLAUDE.md                      # Project instructions
├── .devcontainer/
│   ├── devcontainer.json         # VS Code dev container config
│   ├── Dockerfile               # Container setup
│   └── init-firewall.sh         # Initialization script
└── .claude/
    ├── settings.json            # Claude settings
    ├── commands/                # Custom commands
    └── agents/                  # Specialized agents
```

## Development

### Running Tests

```bash
npm test
```

### Local Development

```bash
npm run dev
```

## License

MIT
