const fs = require('fs');
const path = require('path');

const rootDir = 'app';

// ONLY convert these custom aliases - skip npm packages
const aliasMap = {
  '@components': './components',
  '@screens': './screens',
  '@navigation': './navigation',
  '@hooks': './hooks',
  '@store': './store',
  '@services': './services',
  '@theme': './theme',
  '@types': './types',
  '@config': './config',
};

// External packages to NEVER convert
const externalAliases = ['@expo', '@react-navigation', '@react-native-async-storage', '@supabase'];

function shouldSkip(importPath) {
  return externalAliases.some(ext => importPath.startsWith(ext));
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  Object.entries(aliasMap).forEach(([alias, relative]) => {
    // Match imports like: from '@components/common' or from '@components'
    const regex = new RegExp(`(['"])([^'"]*${alias}(?:/[^'"]*)?)\\1`, 'g');

    content = content.replace(regex, (match, quote, fullImport) => {
      if (shouldSkip(fullImport)) return match;

      const subPath = fullImport.replace(alias, '');
      // Handle both '@theme' (subPath='') and '@theme/colors' (subPath='/colors')
      const newRelative = relative + subPath;

      if (newRelative !== fullImport) {
        modified = true;
        return `${quote}${newRelative}${quote}`;
      }
      return match;
    });
  });

  if (modified) {
    console.log('Updated:', filePath);
    fs.writeFileSync(filePath, content);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(fullPath);
    }
  });
}

walkDir(rootDir);
console.log('Done!');