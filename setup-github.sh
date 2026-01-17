#!/bin/bash
# Setup GitHub repository for speckit-autopilot

set -e

GITHUB_USERNAME="$1"
REPO_NAME="$2"

if [ -z "$GITHUB_USERNAME" ] || [ -z "$REPO_NAME" ]; then
  echo "Usage: $0 <github-username> <repo-name>"
  echo "Example: $0 myusername speckit-autopilot"
  exit 1
fi

# Initialize git if needed
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  git add .
  git commit -m "Initial commit: Speckit Autopilot"
fi

# Add remote
echo "Adding remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Push
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✓ Repository pushed to GitHub!"
echo "Visit: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Update package.json with repository info:"
echo "   npm pkg set repository.url=\"https://github.com/$GITHUB_USERNAME/$REPO_NAME.git\""
echo "2. Update README badges (if any)"
echo "3. Add topics on GitHub: mcp, speckit, workflow-automation, typescript"
