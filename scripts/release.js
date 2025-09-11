#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const VALID_TYPES = ['patch', 'minor', 'major'];

function usage() {
  console.log('Usage: npm run release <patch|minor|major>');
  console.log('');
  console.log('This will:');
  console.log('1. Bump the version in package.json');
  console.log('2. Create a git tag');
  console.log('3. Push the tag to trigger GitHub Actions release');
  console.log('');
  console.log('Examples:');
  console.log('  npm run release patch   # 1.0.0 -> 1.0.1');
  console.log('  npm run release minor   # 1.0.0 -> 1.1.0');
  console.log('  npm run release major   # 1.0.0 -> 2.0.0');
  process.exit(1);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  return packageJson.version;
}

function bumpVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.error('❌ Git working directory is not clean. Please commit or stash your changes.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to check git status:', error.message);
    process.exit(1);
  }
}

function createAndPushTag(version, type) {
  try {
    console.log(`🚀 Creating ${type} release: v${version}`);
    
    // Check git status
    console.log('🔍 Checking git status...');
    checkGitStatus();
    
    // Create git tag (no package.json update - GitHub Actions will handle that)
    console.log('🏷️  Creating and pushing git tag...');
    execSync(`git tag -a v${version} -m "Release v${version}"`);
    execSync(`git push origin v${version}`);
    
    console.log('✅ Tag pushed successfully!');
    console.log('');
    console.log('🚀 GitHub Actions will now:');
    console.log('   1. Run tests and build');
    console.log('   2. Update package.json version');
    console.log('   3. Create GitHub release');
    console.log('');
    console.log(`📦 Check the release at: https://github.com/your-username/meffin/releases/tag/v${version}`);
    
  } catch (error) {
    console.error('❌ Release failed:', error.message);
    
    // Clean up the tag if push failed
    try {
      execSync(`git tag -d v${version}`, { stdio: 'ignore' });
      console.log('🧹 Cleaned up local tag');
    } catch {}
    
    process.exit(1);
  }
}

function main() {
  const type = process.argv[2];
  
  if (!type || !VALID_TYPES.includes(type)) {
    usage();
  }
  
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, type);
  
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}`);
  console.log('');
  
  createAndPushTag(newVersion, type);
}

if (require.main === module) {
  main();
}