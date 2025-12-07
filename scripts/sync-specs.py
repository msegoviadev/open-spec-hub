#!/usr/bin/env python3
"""
API Spec Git Sync Script

Fetches API specification files from GitHub/GitLab repositories via HTTP
and saves them to the local specs/ directory.

Usage:
    python3 sync-specs.py [--dry-run] [--config PATH]
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional

try:
    import requests
    import yaml
    from dotenv import load_dotenv
except ImportError as e:
    print(f"ERROR: Missing required dependency: {e}")
    print("Please install dependencies: pip3 install -r scripts/requirements.txt")
    sys.exit(2)


def log_with_timestamp(message: str) -> None:
    """Print message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


def load_env() -> None:
    """Load environment variables from .env file"""
    load_dotenv()


def load_config(config_path: str) -> Dict:
    """Load and parse YAML configuration file"""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        return config
    except FileNotFoundError:
        log_with_timestamp(f"FATAL: Config file not found: {config_path}")
        sys.exit(2)
    except yaml.YAMLError as e:
        log_with_timestamp(f"FATAL: Invalid YAML in config file: {e}")
        sys.exit(2)


def validate_config(config: Dict) -> None:
    """Validate configuration structure"""
    if not config:
        raise ValueError("Config file is empty")
    
    if 'sources' not in config:
        raise ValueError("Config missing required field 'sources'")
    
    if not isinstance(config['sources'], list):
        raise ValueError("Config field 'sources' must be a list")
    
    for idx, source in enumerate(config['sources']):
        source_name = source.get('name', f'source-{idx}')
        
        # Required fields
        required = ['name', 'platform', 'repository', 'branch', 'files']
        for field in required:
            if field not in source:
                raise ValueError(f"Source '{source_name}' missing required field '{field}'")
        
        # Validate platform
        if source['platform'] not in ['github', 'gitlab']:
            raise ValueError(f"Source '{source_name}' has invalid platform: {source['platform']}")
        
        # Validate repository format
        if '/' not in source['repository']:
            raise ValueError(f"Source '{source_name}' has invalid repository format: '{source['repository']}'. Expected 'owner/repo'")
        
        # Validate files
        if not isinstance(source['files'], list) or len(source['files']) == 0:
            raise ValueError(f"Source '{source_name}' must have at least one file")
        
        for file_idx, file_config in enumerate(source['files']):
            if 'path' not in file_config:
                raise ValueError(f"Source '{source_name}' file {file_idx} missing 'path' field")
            if 'type' not in file_config:
                raise ValueError(f"Source '{source_name}' file {file_idx} missing 'type' field")
            if file_config['type'] not in ['openapi', 'asyncapi']:
                raise ValueError(f"Source '{source_name}' file {file_idx} has invalid type: {file_config['type']}")


def build_url(platform: str, repository: str, branch: str, file_path: str) -> str:
    """Build raw file URL based on platform"""
    if platform == 'github':
        return f"https://raw.githubusercontent.com/{repository}/{branch}/{file_path}"
    elif platform == 'gitlab':
        return f"https://gitlab.com/{repository}/-/raw/{branch}/{file_path}"
    else:
        raise ValueError(f"Unknown platform: {platform}")


def get_auth_headers(platform: str, token: Optional[str]) -> Dict[str, str]:
    """Build authentication headers"""
    if not token:
        return {}
    
    if platform == 'github':
        return {"Authorization": f"token {token}"}
    elif platform == 'gitlab':
        return {"PRIVATE-TOKEN": token}
    else:
        return {}


def fetch_file(url: str, headers: Dict[str, str]) -> str:
    """Fetch file content via HTTP GET"""
    try:
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            return response.text
        elif response.status_code == 404:
            raise FileNotFoundError(f"File not found (HTTP 404)")
        elif response.status_code in [401, 403]:
            raise PermissionError(f"Authentication failed (HTTP {response.status_code})")
        else:
            raise RuntimeError(f"HTTP {response.status_code}")
    
    except requests.Timeout:
        raise TimeoutError("Request timeout after 30 seconds")
    except requests.RequestException as e:
        raise RuntimeError(f"Network error: {e}")


def validate_yaml_syntax(content: str) -> bool:
    """Validate YAML syntax"""
    try:
        yaml.safe_load(content)
        return True
    except yaml.YAMLError:
        return False


def sync_file(source: Dict, file_config: Dict, dry_run: bool) -> bool:
    """
    Sync a single file
    Returns True on success, False on error
    """
    platform = source['platform']
    repository = source['repository']
    branch = source['branch']
    file_path = file_config['path']
    spec_type = file_config['type']
    destination = file_config.get('destination', os.path.basename(file_path))
    
    # Build URL
    url = build_url(platform, repository, branch, file_path)
    
    # Get auth token if specified
    token = None
    if 'auth' in source and 'token_env' in source['auth']:
        token_env = source['auth']['token_env']
        token = os.getenv(token_env)
        
        if not token:
            log_with_timestamp(f"ERROR: Token {token_env} not set, skipping {file_path}")
            return False
    
    # Build auth headers
    headers = get_auth_headers(platform, token)
    
    # Dry-run mode
    if dry_run:
        dest_path = f"specs/{spec_type}/{destination}"
        log_with_timestamp(f"[DRY RUN] Would fetch: {url}")
        log_with_timestamp(f"[DRY RUN]   Save to: {dest_path}")
        return True
    
    # Fetch file
    try:
        content = fetch_file(url, headers)
    except FileNotFoundError:
        log_with_timestamp(f"ERROR: File not found: {file_path}")
        return False
    except PermissionError as e:
        token_env = source.get('auth', {}).get('token_env', 'TOKEN')
        log_with_timestamp(f"ERROR: Auth failed for {repository}, check {token_env}")
        return False
    except TimeoutError:
        log_with_timestamp(f"ERROR: Timeout fetching {file_path}")
        return False
    except Exception as e:
        log_with_timestamp(f"ERROR: Failed to fetch {file_path}: {e}")
        return False
    
    # Validate YAML syntax
    if not validate_yaml_syntax(content):
        log_with_timestamp(f"ERROR: Invalid YAML syntax in {file_path}, skipping")
        return False
    
    # Determine destination path
    dest_path = Path(f"specs/{spec_type}/{destination}")
    
    # Create directory if needed
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save file (always overwrite)
    try:
        dest_path.write_text(content)
        return True
    except Exception as e:
        log_with_timestamp(f"ERROR: Failed to save {dest_path}: {e}")
        return False


def sync_source(source: Dict, dry_run: bool) -> Tuple[int, int]:
    """
    Sync all files from a source
    Returns (success_count, error_count)
    """
    success_count = 0
    error_count = 0
    
    for file_config in source['files']:
        if sync_file(source, file_config, dry_run):
            success_count += 1
        else:
            error_count += 1
    
    return success_count, error_count


def sync_all(config_path: str, dry_run: bool) -> Tuple[int, int]:
    """
    Main sync orchestration
    Returns (total_success, total_errors)
    """
    # Load environment variables
    load_env()
    
    # Load configuration
    config = load_config(config_path)
    
    # Validate configuration
    try:
        validate_config(config)
    except ValueError as e:
        log_with_timestamp(f"FATAL: Invalid config: {e}")
        sys.exit(2)
    
    # Sync all sources
    total_success = 0
    total_errors = 0
    
    for source in config['sources']:
        success, errors = sync_source(source, dry_run)
        total_success += success
        total_errors += errors
    
    return total_success, total_errors


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Sync API specification files from GitHub/GitLab repositories'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be synced without actually saving files'
    )
    parser.add_argument(
        '--config',
        default='config/sync-config.yaml',
        help='Path to config file (default: config/sync-config.yaml)'
    )
    
    args = parser.parse_args()
    
    # Run sync
    if args.dry_run:
        log_with_timestamp("[DRY RUN] Starting sync (no files will be saved)...")
    else:
        log_with_timestamp("Starting sync...")
    
    try:
        success_count, error_count = sync_all(args.config, args.dry_run)
        
        if args.dry_run:
            log_with_timestamp(f"[DRY RUN] Would sync {success_count} files")
        else:
            log_with_timestamp(f"Sync complete! Synced {success_count} files, {error_count} errors")
        
        # Exit with appropriate code
        if error_count > 0:
            sys.exit(1)  # Some errors occurred
        else:
            sys.exit(0)  # All successful
    
    except KeyboardInterrupt:
        log_with_timestamp("Sync interrupted by user")
        sys.exit(1)
    except Exception as e:
        log_with_timestamp(f"FATAL: Unexpected error: {e}")
        sys.exit(2)


if __name__ == '__main__':
    main()
