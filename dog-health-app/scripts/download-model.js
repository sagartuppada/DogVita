#!/usr/bin/env node
/**
 * download-model.js — Downloads the GGUF model into android/app/src/main/assets/models/
 * so it ships with the APK (no runtime download needed).
 *
 * Usage:
 *   node scripts/download-model.js              # Downloads Llama 3.2 1B (default)
 *   node scripts/download-model.js qwen         # Downloads Qwen 2.5 1.5B
 *
 * After downloading, rebuild the APK:
 *   cd android && ./gradlew.bat app:assembleRelease --no-daemon
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'models');

const MODELS = {
  llama: {
    name: 'Llama 3.2 1B Instruct (Q4_K_M)',
    url: 'https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    filename: 'llama-3.2-1b-instruct-q4_k_m.gguf',
  },
  qwen: {
    name: 'Qwen 2.5 1.5B Instruct (Q4_K_M)',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    filename: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
  },
};

const modelKey = process.argv[2] || 'llama';
const model = MODELS[modelKey];

if (!model) {
  console.error(`Unknown model key: "${modelKey}". Available: ${Object.keys(MODELS).join(', ')}`);
  process.exit(1);
}

const destPath = path.join(ASSETS_DIR, model.filename);

// Skip if already exists
if (fs.existsSync(destPath)) {
  const stats = fs.statSync(destPath);
  if (stats.size > 100_000_000) {
    console.log(`Model already exists: ${destPath} (${(stats.size / 1e6).toFixed(0)} MB)`);
    process.exit(0);
  }
  // File exists but seems incomplete — re-download
}

// Ensure directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

console.log(`Downloading ${model.name}...`);
console.log(`URL: ${model.url}`);
console.log(`Dest: ${destPath}`);
console.log('');

const file = fs.createWriteStream(destPath);

function download(url) {
  const client = url.startsWith('https') ? https : http;

  // Follow redirects (HuggingFace uses redirects)
  client.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log(`  Redirecting to: ${res.headers.location.substring(0, 80)}...`);
      download(res.headers.location);
      return;
    }

    if (res.statusCode !== 200) {
      console.error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
      process.exit(1);
    }

    const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
    let received = 0;
    let lastPercent = 0;

    res.on('data', (chunk) => {
      file.write(chunk);
      received += chunk.length;

      if (totalBytes > 0) {
        const percent = Math.floor((received / totalBytes) * 100);
        if (percent !== lastPercent) {
          lastPercent = percent;
          const mb = (received / 1e6).toFixed(1);
          const totalMb = (totalBytes / 1e6).toFixed(1);
          process.stdout.write(`\r  Progress: ${percent}% (${mb} / ${totalMb} MB)`);
        }
      }
    });

    res.on('end', () => {
      file.end();
      console.log('');
      console.log('');
      console.log(`Done! Model saved to: ${destPath}`);
      console.log(`Size: ${(received / 1e6).toFixed(1)} MB`);
      console.log('');
      console.log('Next steps:');
      console.log('  1. Rebuild the APK: cd android && .\\gradlew.bat app:assembleRelease --no-daemon');
    });

    res.on('error', (err) => {
      file.end();
      fs.unlinkSync(destPath);
      console.error(`\nDownload error: ${err.message}`);
      process.exit(1);
    });
  }).on('error', (err) => {
    file.end();
    fs.unlinkSync(destPath);
    console.error(`\nNetwork error: ${err.message}`);
    process.exit(1);
  });
}

download(model.url);
