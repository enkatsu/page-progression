#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../node_modules/paper/package.json');

try {
  if (!fs.existsSync(packageJsonPath)) {
    console.log('Paper.js package.json not found, skipping patch');
    process.exit(0);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // main フィールドを paper-core.js に変更
  if (packageJson.main === 'dist/paper-full.js') {
    packageJson.main = 'dist/paper-core.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Patched paper package.json: main -> dist/paper-core.js');
  } else {
    console.log('ℹ️  Paper.js package.json already patched or different version');
  }
} catch (error) {
  console.error('❌ Error patching paper package.json:', error.message);
  // エラーでもビルドを続行
  process.exit(0);
}
