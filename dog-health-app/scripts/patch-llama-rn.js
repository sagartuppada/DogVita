#!/usr/bin/env node
/**
 * patch-llama-rn.js — Restores NativeRNLlamaSpec.java + patches TurboModuleRegistry after npm install.
 *
 * llama.rn v0.12.5 requires New Architecture codegen to generate NativeRNLlamaSpec.java,
 * but the project uses Old Architecture. This patch:
 * 1. Restores the stub NativeRNLlamaSpec.java
 * 2. Patches NativeRNLlama.js to fall back to NativeModules when TurboModuleRegistry returns null
 *
 * Add to package.json scripts:
 *   "postinstall": "node scripts/patch-llama-rn.js"
 */
const fs = require('fs');
const path = require('path');

// 1. Patch NativeRNLlamaSpec.java
const src = path.join(__dirname, '../app/__native_patch/NativeRNLlamaSpec.java');
const dest = path.join(
  __dirname,
  '../node_modules/llama.rn/android/src/main/java/com/rnllama/NativeRNLlamaSpec.java',
);

if (!fs.existsSync(src)) {
  console.warn('[patch-llama-rn] Stub source not found, skipping java patch.');
} else {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log('[patch-llama-rn] NativeRNLlamaSpec.java patched successfully.');
  } catch (err) {
    console.warn('[patch-llama-rn] Java patch failed:', err.message);
  }
}

// 2. Patch NativeRNLlama.js to fall back to NativeModules on Old Architecture
const nativeLlamaJs = path.join(
  __dirname,
  '../node_modules/llama.rn/lib/commonjs/NativeRNLlama.js',
);

try {
  if (fs.existsSync(nativeLlamaJs)) {
    let content = fs.readFileSync(nativeLlamaJs, 'utf8');
    const oldLine = "_reactNative.TurboModuleRegistry.get('RNLlama')";
    const newLine = "_reactNative.TurboModuleRegistry.get('RNLlama') || _reactNative.NativeModules.RNLlama";
    if (content.includes(oldLine) && !content.includes('NativeModules.RNLlama')) {
      content = content.replace(oldLine, newLine);
      fs.writeFileSync(nativeLlamaJs, content);
      console.log('[patch-llama-rn] NativeRNLlama.js patched to fall back to NativeModules.');
    } else {
      console.log('[patch-llama-rn] NativeRNLlama.js already patched or pattern not found.');
    }
  }
} catch (err) {
  console.warn('[patch-llama-rn] JS patch failed:', err.message);
}
