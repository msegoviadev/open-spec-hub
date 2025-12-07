#!/bin/bash
# One-command setup for API Spec Sync

set -e

echo "Setting up API Spec Sync..."

# Create directories only if they don't exist
[ -d config ] || mkdir -p config
[ -d logs ] || mkdir -p logs
[ -d specs/openapi ] || mkdir -p specs/openapi
[ -d specs/asyncapi ] || mkdir -p specs/asyncapi

echo "✓ Directories verified/created"

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r scripts/requirements.txt

# Create .env from template if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file (please edit and add your tokens)"
else
    echo "✓ .env file already exists"
fi

# Create .gitkeep files only if they don't exist
[ -f specs/openapi/.gitkeep ] || touch specs/openapi/.gitkeep
[ -f specs/asyncapi/.gitkeep ] || touch specs/asyncapi/.gitkeep

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your GitHub/GitLab tokens"
echo "  2. Edit config/sync-config.yaml and add your repositories"
echo "  3. Test: python3 scripts/sync-specs.py --dry-run"
echo "  4. Run: python3 scripts/sync-specs.py"
echo "  5. Install cron: bash scripts/install-cron.sh"
