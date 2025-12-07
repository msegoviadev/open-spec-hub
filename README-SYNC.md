# API Spec Git Sync

Automatically fetch API specification files from GitHub/GitLab repositories and save them to your local `specs/` directory.

## Overview

This feature allows you to sync API specs from remote Git repositories without cloning the entire repo. It fetches individual files via HTTP and validates them before saving locally.

**Key Features:**
- Fetch files from GitHub and GitLab (including nested groups)
- Support for public and private repositories
- Authentication with personal access tokens
- YAML syntax validation before saving
- Automatic scheduling via cron
- Dry-run mode for testing

## Quick Start

### 1. Setup

Run the setup script to install dependencies and create configuration files:

```bash
bash scripts/setup.sh
```

This will:
- Install Python dependencies (requests, PyYAML, python-dotenv)
- Create `.env` file from template
- Create necessary directories
- Add `.gitkeep` files to preserve directory structure

### 2. Configure Tokens

Edit `.env` and add your GitHub/GitLab personal access tokens:

```bash
nano .env
```

Add your tokens:
```bash
GITHUB_TOKEN=ghp_your_token_here
GITLAB_TOKEN=glpat_your_token_here
```

### 3. Configure Sources

Edit `config/sync-config.yaml` and add your repositories:

```bash
nano config/sync-config.yaml
```

Example configuration:
```yaml
sources:
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
```

### 4. Test Sync

Run a dry-run to see what would be synced:

```bash
python3 scripts/sync-specs.py --dry-run
```

### 5. Run Sync

Execute the actual sync:

```bash
python3 scripts/sync-specs.py
```

### 6. Install Cron Job

Set up automatic syncing:

```bash
bash scripts/install-cron.sh
```

You'll be prompted to choose a schedule (default: every 30 minutes).

## Token Setup

### GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Set name: "API Spec Sync"
4. Select scopes:
   - `repo` (for private repos)
   - OR `public_repo` (for public repos only)
5. Click "Generate token"
6. Copy token (starts with `ghp_`)
7. Add to `.env`: `GITHUB_TOKEN="ghp_xxxxx"`

### GitLab Personal Access Token

1. Go to https://gitlab.com/-/profile/personal_access_tokens
2. Fill in:
   - Name: "API Spec Sync"
   - Expiration: (optional)
   - Scopes: `read_repository`
3. Click "Create personal access token"
4. Copy token (starts with `glpat_`)
5. Add to `.env`: `GITLAB_TOKEN="glpat_xxxxx"`

## Configuration Reference

### Source Configuration

```yaml
sources:
  - name: "unique-source-name"
    platform: "github" | "gitlab"
    repository: "owner/repo"  # or "group/subgroup/project" for GitLab
    branch: "main"
    auth:  # Optional - for private repos
      token_env: "GITHUB_TOKEN"  # Environment variable name
    files:
      - path: "path/to/spec.yaml"
        type: "openapi" | "asyncapi"
        destination: "custom-name.yaml"  # Optional
```

**Fields:**
- `name`: Unique identifier for this source
- `platform`: Either "github" or "gitlab"
- `repository`: Format `owner/repo` (supports GitLab nested groups)
- `branch`: Branch name to fetch from
- `auth.token_env`: Name of environment variable containing the token
- `files[].path`: Path to file in repository
- `files[].type`: Either "openapi" or "asyncapi"
- `files[].destination`: Optional custom filename (defaults to basename of path)

## Usage

### Manual Sync

```bash
python3 scripts/sync-specs.py
```

### Dry-Run (Test Without Saving)

```bash
python3 scripts/sync-specs.py --dry-run
```

### Custom Config File

```bash
python3 scripts/sync-specs.py --config path/to/config.yaml
```

### View Logs

```bash
tail -f logs/sync.log
```

### Check Cron Status

```bash
crontab -l
```

## Scheduling

The sync script can run on any schedule you choose. When installing the cron job, you'll be prompted for a schedule.

**Common schedules:**
- `*/30 * * * *` - Every 30 minutes (default)
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 9 * * *` - Once daily at 9 AM
- `0 9,17 * * *` - Twice daily (9 AM and 5 PM)
- `0 9 * * 1-5` - Weekdays only at 9 AM

### Changing Schedule

Edit your crontab:
```bash
crontab -e
```

Find the line with `sync-specs.py` and modify the schedule.

### Removing Cron Job

```bash
crontab -e
# Delete the line containing sync-specs.py
```

## Troubleshooting

### ERROR: Token not set

**Problem:** `ERROR: Token GITHUB_TOKEN not set`

**Solution:**
1. Check `.env` file exists
2. Verify token is set: `GITHUB_TOKEN=ghp_xxxxx`
3. Ensure no spaces around `=`
4. For cron: tokens are loaded from `.env` automatically

### ERROR: Authentication failed

**Problem:** `ERROR: Auth failed for owner/repo, check GITHUB_TOKEN`

**Solution:**
1. Verify token is valid (not expired)
2. Check token has correct scopes (`repo` or `read_repository`)
3. Ensure repository name is correct
4. For private repos, verify token has access to that repo

### ERROR: File not found

**Problem:** `ERROR: File not found: openapi/spec.yaml`

**Solution:**
1. Verify file path is correct in config
2. Check file exists in the repository branch
3. Ensure branch name is correct
4. Path is case-sensitive

### ERROR: Invalid YAML syntax

**Problem:** `ERROR: Invalid YAML syntax in file.yaml, skipping`

**Solution:**
1. Check the source file in the repository
2. Validate YAML syntax online (yamllint.com)
3. File won't be saved if YAML is invalid

### Cron job not running

**Problem:** Sync doesn't run automatically

**Solution:**
1. Check cron is installed: `crontab -l`
2. Verify entry exists with `sync-specs.py`
3. Check logs: `tail -f logs/sync.log`
4. Ensure script has execute permissions: `chmod +x scripts/sync-specs.py`
5. Test manual run: `python3 scripts/sync-specs.py`

## File Structure

```
api-docs/
├── .env                    # Your tokens (gitignored)
├── .env.example           # Token template
├── config/
│   └── sync-config.yaml   # Source configuration
├── scripts/
│   ├── sync-specs.py      # Main sync script
│   ├── requirements.txt   # Python dependencies
│   ├── setup.sh          # Setup automation
│   └── install-cron.sh   # Cron installation
├── specs/
│   ├── openapi/          # Synced OpenAPI specs (gitignored)
│   └── asyncapi/         # Synced AsyncAPI specs (gitignored)
└── logs/
    └── sync.log          # Sync history (gitignored)
```

## Security

- Never commit `.env` file to Git
- Use read-only token scopes when possible
- Rotate tokens regularly (every 90 days)
- Set token expiration dates
- Use separate tokens for different services
- Keep `.env` file permissions restricted: `chmod 600 .env`

## Integration with TypeScript App

Synced specs are automatically available to the TypeScript/Next.js application:

- Specs saved to `specs/openapi/` and `specs/asyncapi/`
- TypeScript app reads from these directories during build
- No code changes needed - specs are detected automatically
- Build process: `npm run build` reads latest synced specs

## Next Steps

After setting up sync:

1. Add your actual repositories to `config/sync-config.yaml`
2. Run manual sync to verify: `python3 scripts/sync-specs.py`
3. Check synced files: `ls -la specs/openapi/ specs/asyncapi/`
4. Install cron job for automatic syncing
5. Monitor logs: `tail -f logs/sync.log`

## Support

For issues or questions:
- Check troubleshooting section above
- Review `.claude/features/2025-12-07_api-spec-git-sync.md` for technical details
- Verify configuration against examples in this README
