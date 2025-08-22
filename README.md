# claude-init

A CLI tool to initialize Claude development environment with standardized configurations and templates.

## Features

- **Smart Setup**: Automatically detects existing files and only creates/updates what's needed
- **Non-destructive**: Never overwrites existing files, only adds missing content
- **Progress Feedback**: Clear visual indicators of what's being created, updated, or skipped
- **Cross-platform**: Works on Windows, macOS, and Linux

## Usage

### Quick Start

```bash
npx claude-init
```

This will set up your current directory with:

- `CLAUDE.md` - Project instructions and scratchpad for Claude
- `.devcontainer/` - Development container configuration
- `.claude/settings.json` - Claude-specific settings
- `.claude/commands/` - Custom Claude commands
- `.claude/agents/` - Specialized agent configurations

### What It Does

#### 📄 CLAUDE.md
- **If missing**: Creates new file with template content
- **If exists**: Appends template content under "# Claude Scratchpad Rules" heading
- **If already contains template**: Skips to preserve your content

#### 📁 .devcontainer
- **If missing**: Creates complete directory with Docker configuration
- **If exists**: Skips entirely to preserve your setup

#### ⚙️ .claude/settings.json
- **If missing**: Creates with default Claude settings
- **If exists**: Skips to preserve your custom settings

#### 📋 .claude/commands & .claude/agents
- **If missing**: Creates with all template files
- **If exists**: Only adds missing files, preserves existing ones

## Example Output

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
    │   ├── debug.md
    │   ├── gogogo.md
    │   ├── plan.md
    │   └── prompt-enhancement.md
    └── agents/                  # Specialized agents
        └── library-usage-researcher.md
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