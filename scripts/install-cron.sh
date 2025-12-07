#!/bin/bash
# Install cron job for API Spec Sync

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if Python script exists
if [ ! -f "$PROJECT_DIR/scripts/sync-specs.py" ]; then
    echo "ERROR: sync-specs.py not found"
    exit 1
fi

# Check if .env exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "ERROR: .env file not found. Run setup.sh first."
    exit 1
fi

# Check if config exists
if [ ! -f "$PROJECT_DIR/config/sync-config.yaml" ]; then
    echo "ERROR: config/sync-config.yaml not found"
    exit 1
fi

echo "Configure sync schedule:"
echo ""
echo "Common schedules:"
echo "  */30 * * * *    Every 30 minutes"
echo "  */15 * * * *    Every 15 minutes"
echo "  0 * * * *       Every hour"
echo "  0 */2 * * *     Every 2 hours"
echo "  0 0 * * *       Once a day (midnight)"
echo ""
read -p "Enter cron schedule [default: */30 * * * *]: " CRON_SCHEDULE

# Use default if empty
if [ -z "$CRON_SCHEDULE" ]; then
    CRON_SCHEDULE="*/30 * * * *"
fi

# Build cron command
CRON_CMD="$CRON_SCHEDULE cd $PROJECT_DIR && /usr/bin/python3 scripts/sync-specs.py >> logs/sync.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "sync-specs.py"; then
    echo ""
    echo "Warning: A cron job for sync-specs.py already exists"
    read -p "Replace it? [y/N]: " REPLACE
    if [ "$REPLACE" != "y" ] && [ "$REPLACE" != "Y" ]; then
        echo "Aborted"
        exit 0
    fi
    # Remove existing entry
    crontab -l 2>/dev/null | grep -v "sync-specs.py" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo ""
echo "✓ Cron job installed successfully"
echo "  Schedule: $CRON_SCHEDULE"
echo "  Logs: $PROJECT_DIR/logs/sync.log"
echo ""
echo "Useful commands:"
echo "  View cron jobs:   crontab -l"
echo "  Edit schedule:    crontab -e"
echo "  View logs:        tail -f $PROJECT_DIR/logs/sync.log"
echo "  Remove cron job:  crontab -e (then delete the line)"
echo "  Run manually:     python3 $PROJECT_DIR/scripts/sync-specs.py"
