# API Spec Git Sync Feature

**Date:** December 7, 2025  
**Status:** Planning Complete - Ready for Implementation  
**Estimated Effort:** 6-8 hours

---

## Overview

Automatically fetch API specification files from GitHub/GitLab repositories and save them to the local `specs/` directory. Files are synced on a schedule via cron, with authentication handled through tokens stored in a `.env` file.

**Key Goals:**
- Fetch individual spec files via HTTP (no git clone)
- Support both GitHub and GitLab (including nested groups)
- Handle authentication with personal access tokens
- Run automatically on a cron schedule
- Validate YAML syntax before saving
- Skip failures and continue (resilient sync)

---

## Architecture

### Components

```
api-docs/
├── .env                          # NEW: Tokens (gitignored)
├── .env.example                  # NEW: Token template
├── .gitignore                    # MODIFIED: Add specs/, logs/, .env
├── config/                       # NEW: Directory
│   └── sync-config.yaml          # NEW: Source configuration
├── scripts/                      # NEW: Directory
│   ├── sync-specs.py             # NEW: Main sync script (~300 lines)
│   ├── requirements.txt          # NEW: Python dependencies
│   ├── setup.sh                  # NEW: One-command setup
│   └── install-cron.sh           # NEW: Cron installation
├── specs/                        # EXISTS: Now gitignored
│   ├── openapi/                  # Synced files (gitignored)
│   │   └── .gitkeep              # NEW: Preserve directory in Git
│   └── asyncapi/                 # Synced files (gitignored)
│       └── .gitkeep              # NEW: Preserve directory in Git
├── logs/                         # NEW: Gitignored
│   └── sync.log                  # Cron output
└── README-SYNC.md                # NEW: User documentation
```

---

## Configuration Design

### `.env` File (gitignored)
```bash
# NEVER COMMIT THIS FILE!
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITLAB_TOKEN=glpat_xxxxxxxxxxxxxxxxxxxx
```

### `.env.example` File (committed)
```bash
# Copy this to .env and fill in your tokens

# GitHub Personal Access Token
# Create at: https://github.com/settings/tokens
# Scope: repo (private) or public_repo (public only)
GITHUB_TOKEN=

# GitLab Personal Access Token  
# Create at: https://gitlab.com/-/profile/personal_access_tokens
# Scope: read_repository
GITLAB_TOKEN=
```

### `config/sync-config.yaml`
```yaml
# API Spec Sync Configuration
# NOTE: Sync schedule is configured in crontab, not here

sources:
  # Example: Public GitHub repository
  - name: "swagger-petstore"
    platform: "github"
    repository: "swagger-api/swagger-petstore"
    branch: "master"
    files:
      - path: "src/main/resources/openapi.yaml"
        type: "openapi"
        destination: "petstore.yaml"

  # Example: Private GitHub repository
  - name: "company-apis"
    platform: "github"
    repository: "your-company/api-specs"
    branch: "main"
    auth:
      token_env: "GITHUB_TOKEN"
    files:
      - path: "openapi/users-api.yaml"
        type: "openapi"
      - path: "openapi/products-api.yaml"
        type: "openapi"
        destination: "products.yaml"

  # Example: Private GitLab repository (supports nested groups)
  - name: "gitlab-internal"
    platform: "gitlab"
    repository: "company/backend/api-specs"
    branch: "production"
    auth:
      token_env: "GITLAB_TOKEN"
    files:
      - path: "specs/orders.yaml"
        type: "openapi"
```

---

## Technical Specifications

### Python Script: `scripts/sync-specs.py`

**Target:** Python 3.12+

**Dependencies:**
- `requests>=2.31.0` - HTTP client
- `PyYAML>=6.0.1` - YAML parsing
- `python-dotenv>=1.0.0` - .env file loading

**Command-line Interface:**
```bash
python3 scripts/sync-specs.py [OPTIONS]

Options:
  --dry-run         Show what would be synced without saving files
  --config PATH     Path to config file (default: config/sync-config.yaml)
  --help            Show help message
```

**Core Functions:**

1. `load_env()` - Load .env file
2. `load_config(config_path)` - Parse YAML config
3. `validate_config(config)` - Validate structure before syncing
4. `build_url(platform, repository, branch, file_path)` - Construct raw file URL
5. `get_auth_headers(platform, token)` - Build auth headers
6. `fetch_file(url, headers)` - HTTP GET with 30s timeout
7. `validate_yaml_syntax(content)` - Parse to check validity
8. `sync_file(source, file_config, dry_run)` - Fetch and save one file
9. `sync_source(source, dry_run)` - Process all files in a source
10. `sync_all(config_path, dry_run)` - Main orchestration
11. `log_with_timestamp(message)` - Format: `[2025-12-07 10:30:15] message`
12. `main()` - CLI entry point

**URL Construction:**

GitHub:
```
https://raw.githubusercontent.com/{repository}/{branch}/{file_path}
```

GitLab:
```
https://gitlab.com/{repository}/-/raw/{branch}/{file_path}
```

**Authentication Headers:**

GitHub:
```python
{"Authorization": f"token {GITHUB_TOKEN}"}
```

GitLab:
```python
{"PRIVATE-TOKEN": GITLAB_TOKEN}
```

---

## Key Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Synced files in Git** | Gitignore | Specs are fetched from source, not stored in repo |
| **File conflicts** | Last one wins | Simple overwrite behavior |
| **Config validation** | Validate before syncing | Catch errors early |
| **Missing config** | Error and exit | Can't proceed without config |
| **Logging** | Minimal with timestamps | `[timestamp] message` format |
| **Setup automation** | `setup.sh` script | One-command installation |
| **Destination field** | Optional | Defaults to basename of path |
| **Network retries** | No retries | Cron will retry in 30 min |
| **Rate limiting** | Treat as HTTP error | Log and skip |
| **Documentation** | Minimal | Quick start focused |
| **Directory creation** | Auto-create if missing | Convenience |
| **File permissions** | Default umask | Readable by TypeScript app |
| **npm integration** | None | Keep Python separate from Node |
| **Sync schedule** | Configured in cron only | Not in config file |

---

## Error Handling Strategy

**Philosophy:** Skip failures and continue

| Error Type | Action | Log Example |
|------------|--------|-------------|
| Missing config file | Exit code 2 | `[timestamp] FATAL: Config file not found` |
| Invalid config YAML | Exit code 2 | `[timestamp] FATAL: Invalid config: missing 'repository'` |
| Missing token env var | Skip source | `[timestamp] ERROR: Token GITHUB_TOKEN not set, skipping` |
| HTTP 404 | Skip file | `[timestamp] ERROR: File not found: openapi/missing.yaml` |
| HTTP 401/403 | Skip file | `[timestamp] ERROR: Auth failed, check GITHUB_TOKEN` |
| Timeout | Skip file | `[timestamp] ERROR: Timeout fetching products-api.yaml` |
| Invalid YAML | Skip file | `[timestamp] ERROR: Invalid YAML syntax, skipping` |
| Unknown error | Skip file | `[timestamp] ERROR: Failed to fetch: {exception}` |

**Exit Codes:**
- 0: All files synced successfully
- 1: Some files failed (but sync completed)
- 2: Fatal error (config invalid, can't proceed)

---

## Scheduling

### Cron Installation

The `install-cron.sh` script prompts user to choose schedule:

```
Common schedules:
  */30 * * * *    Every 30 minutes (default)
  */15 * * * *    Every 15 minutes
  0 * * * *       Every hour
  0 */2 * * *     Every 2 hours
  0 0 * * *       Once a day (midnight)

Enter cron schedule [default: */30 * * * *]:
```

**Cron Command Format:**
```bash
*/30 * * * * cd /path/to/api-docs && /usr/bin/python3 scripts/sync-specs.py >> logs/sync.log 2>&1
```

**Schedule is NOT in config file** - fully controlled by cron

---

## Installation Workflow

### Initial Setup (one-time)
```bash
# 1. Run setup script (checks existing directories)
bash scripts/setup.sh

# 2. Edit .env and add tokens
nano .env

# 3. Edit config and add your repositories
nano config/sync-config.yaml

# 4. Test with dry-run
python3 scripts/sync-specs.py --dry-run

# 5. Run actual sync
python3 scripts/sync-specs.py

# 6. Verify files were synced
ls -la specs/openapi/
ls -la specs/asyncapi/

# 7. Install cron job (choose schedule)
bash scripts/install-cron.sh
```

### Daily Usage
```bash
# Manual sync
python3 scripts/sync-specs.py

# View logs
tail -f logs/sync.log

# Check cron
crontab -l
```

---

## File Deliverables

### New Files

1. **`.env.example`** - Token template with instructions
2. **`config/sync-config.yaml`** - Example configuration with comments
3. **`scripts/sync-specs.py`** - Main Python script (~300 lines)
4. **`scripts/requirements.txt`** - Python dependencies (3 lines)
5. **`scripts/setup.sh`** - Setup automation (~40 lines)
6. **`scripts/install-cron.sh`** - Cron installation (~60 lines)
7. **`README-SYNC.md`** - User documentation (~150 lines)
8. **`specs/openapi/.gitkeep`** - Preserve directory in Git
9. **`specs/asyncapi/.gitkeep`** - Preserve directory in Git

### Modified Files

1. **`.gitignore`** - Add:
   ```
   # API Spec Sync
   /specs/openapi/*.yaml
   /specs/openapi/*.yml
   /specs/asyncapi/*.yaml
   /specs/asyncapi/*.yml
   /logs/
   .env
   ```

**Total New Code:** ~550 lines (Python + bash + docs)

---

## Security Considerations

### Token Security
- `.env` file gitignored (never committed)
- Tokens loaded from environment only
- Never logged or printed
- File permissions: `chmod 600 .env`

### Network Security
- HTTPS only (enforced by platforms)
- 30-second timeout per request
- No retries (prevents hammering)

### File Security
- Synced files readable by TypeScript app
- Directory creation with safe defaults
- Overwrites prevent accumulation of old specs

---

## Integration with TypeScript Application

**No changes required to TypeScript app:**
- Specs location unchanged: `specs/openapi/` and `specs/asyncapi/`
- File format: YAML (validated by sync script)
- File permissions: Default umask (readable)
- Build process: Reads latest synced specs

**Workflow:**
```
Cron runs → Fetches specs → Saves to specs/ → TypeScript build reads them
```

---

## Testing Plan

### Manual Test Checklist

- [ ] `setup.sh` checks existing directories before creating
- [ ] `setup.sh` doesn't fail if directories already exist
- [ ] Dry-run shows files without saving
- [ ] Public GitHub repo syncs without auth
- [ ] Private GitHub repo syncs with token
- [ ] Public GitLab repo syncs without auth
- [ ] Private GitLab repo syncs with token
- [ ] GitLab nested groups work (e.g., `company/backend/api-specs`)
- [ ] Missing token logs error, continues
- [ ] 404 file logs error, continues
- [ ] Invalid YAML logs error, doesn't save
- [ ] Files saved to correct `specs/{type}/` directory
- [ ] Custom destination field works
- [ ] Default destination (basename) works
- [ ] Multiple sources sync in order
- [ ] Last source overwrites if same destination
- [ ] Config validation catches missing fields
- [ ] Empty/missing config file exits with error
- [ ] Cron installation prompts for schedule
- [ ] Cron job runs on schedule (check logs)
- [ ] Existing cron job detected and handled
- [ ] All timestamps in logs are formatted correctly

---

## Out of Scope (Future Features)

The following are explicitly excluded from this implementation:

- MCP server integration (separate feature)
- File watchers / hot reload
- Webhook-based sync (push instead of pull)
- Spec diff/changelog generation
- Email/Slack notifications on errors
- Support for other platforms (Bitbucket, Gitea)
- OAuth authentication (only token-based)
- Automated token rotation
- Parallel file downloads
- Incremental sync (only fetch changed files)

---

## Success Criteria

**Feature is complete when:**

✅ User runs `bash scripts/setup.sh` → everything is configured  
✅ User edits `.env` and `config/sync-config.yaml`  
✅ User runs `python3 scripts/sync-specs.py` → files appear in `specs/`  
✅ User runs `bash scripts/install-cron.sh` → automatic syncing starts  
✅ Synced specs are used by TypeScript app without changes  
✅ Errors are logged but don't stop entire sync  
✅ Dry-run mode shows what would happen  
✅ Documentation is clear and minimal  
✅ All manual tests pass  

---

## Implementation Estimate

- **Script development:** 3-4 hours
- **Setup scripts:** 1 hour
- **Documentation:** 1 hour
- **Testing:** 1-2 hours
- **Total:** 6-8 hours

---

## Notes

- Sync schedule is controlled entirely by cron (not in config file)
- Setup script checks for existing directories before creating
- Files are always overwritten (sync is source of truth)
- TypeScript app already reads from `specs/` - no changes needed
- Python kept separate from Node.js ecosystem (no npm integration)
- Minimal logging philosophy (errors + summary only)

---

## Questions Resolved

All planning questions have been answered:

1. ✅ Synced specs gitignored (not committed)
2. ✅ File conflicts: last one wins
3. ✅ Config validation: yes, before syncing
4. ✅ Missing config: error and exit
5. ✅ Logging: minimal with timestamps
6. ✅ Setup script: yes, one-command installation
7. ✅ Destination field: optional (defaults to basename)
8. ✅ Network retries: no retries
9. ✅ Rate limiting: treat as regular HTTP error
10. ✅ Documentation: minimal (quick start)
11. ✅ Directory creation: auto-create if missing
12. ✅ File permissions: default umask
13. ✅ npm scripts: none (keep Python separate)
14. ✅ Sync interval: removed from config, set in cron only
15. ✅ Directory checks: verify before creating

**Status:** Planning complete, ready for implementation.
