#!/usr/bin/env node

const fs = require('fs');

function getVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return packageJson.version;
  } catch (err) {
    return '0.1.0';
  }
}

// Export for use in build process
if (require.main === module) {
  console.log(getVersion());
}

module.exports = { getVersion };