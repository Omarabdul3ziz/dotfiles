# Dotfiles Organization Plan

## Vision
Transform this repository into a minimal, Chezmoi-based dotfiles system with one configuration file per project/service, optimized for Ubuntu/Linux systems.

## Current State Analysis

### Strengths
- Comprehensive development tools and configurations
- Well-documented setup processes
- Modern tooling (LazyVim, Helix, Ghostty, etc.)
- Proper version control with Git
- Multi-language development environment

### Current Issues
- Scattered configuration across multiple files
- Inconsistent organization (mix of root-level and .config/)
- Duplicate setup scripts with overlapping functionality
- No templating or system-specific handling
- Some tools installed via multiple methods (apt, snap, go install)

## New Architecture

### 1. Migration to Chezmoi
**Why Chezmoi:**
- Template support for system-specific configurations
- Encryption support for sensitive data
- Better handling of conditionals and secrets
- Single source of truth with per-system variations

**Migration Steps:**
1. Install Chezmoi and initialize repository
2. Convert existing dotfiles to Chezmoi format
3. Create templates for system-specific values
4. Set up encrypted secrets for API keys/tokens
5. Replace GNU Stow symlinks with Chezmoi managed files

### 2. Minimal File Structure
```
dotfiles/
├── .chezmoi.toml           # Chezmoi configuration
├── .chezmoidir.yaml         # Directory structure definition
├── install.sh              # One-liner installation script
├── README.md               # Updated documentation
└── private_dot/            # Encrypted configurations
    └── .gitconfig.local
```

### 3. One-File-Per-Project Philosophy

#### Core System Files
- `shell_config.yaml` - Unified shell configuration (zsh, bash, shared)
- `git_config.yaml` - Complete Git configuration with conditional sections
- `terminal_config.yaml` - Alacritty + Ghostty unified settings
- `editor_config.yaml` - Common editor settings (Neovim/Helix shared)

#### Development Environment
- `neovim_config.yaml` - Complete LazyVim setup in single file
- `helix_config.yaml` - Helix editor configuration
- `tmux_config.yaml` - Terminal multiplexer settings
- `zellij_config.yaml` - Alternative terminal multiplexer

#### Development Tools
- `docker_config.yaml` - Docker and container settings
- `languages.yaml` - Go, Rust, Node.js, Python environment setup
- `development_tools.yaml` - fzf, ripgrep, lazygit, etc. configurations

#### System Integration
- `gnome_config.yaml` - Desktop environment settings
- `system_services.yaml` - Docker groups, libvirt, etc.

### 4. Template Strategy

#### System Variables
```yaml
{{- $email := "your-email@example.com" | promptString "Email for git config" }}
{{- $name := "Your Name" | promptString "Name for git config" }}
{{- $work := false | promptBool "Work computer?" }}
```

#### Conditional Configuration
```yaml
{{- if eq .chezmoi.os "linux" }}
# Linux-specific settings
{{- end }}

{{- if .work }}
# Work-specific configurations
{{- end }}
```

### 5. Consolidation Strategy

#### Shell Configuration Consolidation
**Current scattered files:**
- .zshrc
- .bashrc  
- .shellrc
- .aliases
- .env
- .profile

**New consolidated approach:**
```yaml
# shell_config.yaml
shared_config: |
  # Common aliases, functions, environment
zsh_specific: |
  # Oh My Zsh, plugins, Zsh-specific settings  
bash_specific: |
  # Bash-specific settings
```

#### Editor Configuration
**Neovim consolidation:**
- Merge all LazyVim files into single configuration
- Use Lua inline configuration
- Include plugin specs directly in main file

#### Package Management
**Unified approach:**
- Choose single installation method per tool
- Prefer system packages when available
- Use language-specific managers (cargo, npm, go install) as fallback
- Document rationale for each choice

### 6. Installation Workflow

#### One-Liner Installation
```bash
curl -fsSL https://github.com/Omarabdulaziz/dotfiles/raw/main/install.sh | bash
```

#### Interactive Setup
1. Detect system and prompt for basic info
2. Install Chezmoi if not present
3. Clone repository and apply configurations
4. Install required system packages
5. Set up development environments
6. Configure user preferences

### 7. Enhanced Automation

#### Smart Package Installation
```yaml
# Unified package definitions
packages:
  system:
    - docker.io
    - fzf
    - tmux
  go:
    - github.com/jesseduffield/lazygit
    - github.com/golangci/golangci-lint/cmd/golangci-lint
  npm:
    - typescript
    - prettier
```

#### Environment Detection and Setup
- Detect Ubuntu/Debian version
- Set up appropriate package repositories
- Configure user groups automatically
- Install development tools per detected use case

### 8. Documentation Overhaul

#### New README Structure
```markdown
# Minimal Dotfiles

## Quick Start
One-line installation and setup

## Features
- Minimal, one-file-per-project philosophy
- Chezmoi-based management
- Ubuntu/Linux optimized
- Complete development environment

## Configuration Details
### Core Tools
- Terminal: Alacritty + Ghostty
- Editors: Neovim (LazyVim) + Helix
- Multiplexers: tmux + zellij

### Development Environment
- Languages: Go, Rust, Node.js, Python
- Tools: Docker, Git, fzf, lazygit
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. Initialize Chezmoi repository structure
2. Create templates for core system files
3. Consolidate shell configurations
4. Set up encrypted secrets handling

### Phase 2: Development Environment (Week 2)  
1. Migrate Neovim configuration to single file
2. Consolidate editor configurations
3. Create unified development tools setup
4. Test on fresh Ubuntu installation

### Phase 3: System Integration (Week 3)
1. Migrate GNOME and system configurations
2. Create unified package management
3. Implement smart detection and setup
4. Create installation scripts

### Phase 4: Documentation & Polish (Week 4)
1. Update all documentation
2. Create installation and troubleshooting guides
3. Add configuration examples
4. Final testing and cleanup

## Migration Checklist

### Pre-Migration
- [ ] Backup current dotfiles
- [ ] Document current working state
- [ ] Identify must-have configurations
- [ ] Test on virtual machine

### During Migration  
- [ ] Install Chezmoi
- [ ] Convert configurations one by one
- [ ] Test each conversion thoroughly
- [ ] Maintain backup of original files

### Post-Migration
- [ ] Test on fresh system
- [ ] Verify all tools work correctly
- [ ] Update documentation
- [ ] Remove old configurations

## Benefits of New Approach

### Minimalism
- Reduced file count by ~60%
- Single source of truth per tool
- Easier to maintain and understand

### Portability  
- Works across Ubuntu versions
- Easy to share and replicate
- System-agnostic base with Linux optimization

### Maintainability
- Template-based configuration
- Version-controlled secrets
- Clear dependency management

### Automation
- One-command setup
- Smart system detection
- Automatic environment configuration

## Risk Mitigation

### Backup Strategy
- Git history preservation
- Branch for migration work
- Easy rollback to Stow-based system

### Testing Strategy  
- Virtual machine testing
- Gradual migration approach
- Validation at each step

### Documentation
- Clear migration guide
- Troubleshooting section
- Configuration examples