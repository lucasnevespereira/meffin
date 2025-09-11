#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Usage function
usage() {
    echo "Usage: npm run release <patch|minor|major>"
    echo ""
    echo "This will:"
    echo "1. Create a git tag based on current version"
    echo "2. Push the tag to trigger GitHub Actions"
    echo "3. GitHub Actions will create release and update version.ts"
    echo ""
    echo "Examples:"
    echo "  npm run release patch   # 0.1.0 -> 0.1.1"
    echo "  npm run release minor   # 0.1.0 -> 0.2.0"
    echo "  npm run release major   # 0.1.0 -> 1.0.0"
    exit 1
}

# Check if type is provided
if [ $# -eq 0 ]; then
    usage
fi

TYPE=$1

# Validate type
if [[ ! "$TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}❌ Invalid release type: $TYPE${NC}"
    usage
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Calculate new version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $TYPE in
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        ;;
    minor)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        ;;
    patch)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        ;;
esac

echo "Current version: $CURRENT_VERSION"
echo "New version: $NEW_VERSION"
echo ""

# Check git status
echo -e "${BLUE}🔍 Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Git working directory is not clean. Please commit or stash your changes.${NC}"
    exit 1
fi

# Create and push tag
echo -e "${BLUE}🏷️  Creating and pushing git tag...${NC}"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
git push origin "v$NEW_VERSION"

echo -e "${GREEN}✅ Tag pushed successfully!${NC}"
echo ""
echo -e "${YELLOW}🚀 GitHub Actions will now:${NC}"
echo "   1. Run lint and build"
echo "   2. Create GitHub release"
echo "   3. Update lib/version.ts"
echo "   4. Commit version update to main"
echo ""
echo -e "${BLUE}📦 Check the release at: https://github.com/lucasnevespereira/meffin/releases/tag/v$NEW_VERSION${NC}"
