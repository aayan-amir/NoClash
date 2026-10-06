import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

const MAX_JS_GZIP_BYTES = 120 * 1024; // 120 KB
const MAX_CSS_GZIP_BYTES = 15 * 1024; // 15 KB

function checkSize() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ dist/assets directory not found.');
    process.exit(1);
  }

  const files = fs.readdirSync(assetsDir);
  let totalJsGzip = 0;
  let totalCssGzip = 0;
  let hasBreach = false;

  console.log('📦 Measuring bundle sizes (gzipped):');

  for (const file of files) {
    const fullPath = path.join(assetsDir, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    const content = fs.readFileSync(fullPath);
    const gzipped = zlib.gzipSync(content);
    const gzipSize = gzipped.length;

    if (file.endsWith('.js')) {
      totalJsGzip += gzipSize;
      console.log(`  JS:  ${file} -> ${(gzipSize / 1024).toFixed(2)} KB gzipped`);
    } else if (file.endsWith('.css')) {
      totalCssGzip += gzipSize;
      console.log(`  CSS: ${file} -> ${(gzipSize / 1024).toFixed(2)} KB gzipped`);
    }
  }

  console.log('--------------------------------------------------');
  console.log(`Total JS (gzipped):  ${(totalJsGzip / 1024).toFixed(2)} KB / ${(MAX_JS_GZIP_BYTES / 1024).toFixed(0)} KB budget`);
  console.log(`Total CSS (gzipped): ${(totalCssGzip / 1024).toFixed(2)} KB / ${(MAX_CSS_GZIP_BYTES / 1024).toFixed(0)} KB budget`);

  if (totalJsGzip > MAX_JS_GZIP_BYTES) {
    console.error(`❌ JS bundle size exceeded budget by ${((totalJsGzip - MAX_JS_GZIP_BYTES) / 1024).toFixed(2)} KB!`);
    hasBreach = true;
  }

  if (totalCssGzip > MAX_CSS_GZIP_BYTES) {
    console.error(`❌ CSS bundle size exceeded budget by ${((totalCssGzip - MAX_CSS_GZIP_BYTES) / 1024).toFixed(2)} KB!`);
    hasBreach = true;
  }

  if (hasBreach) {
    process.exit(1);
  } else {
    console.log('✅ All bundle sizes are strictly within performance budgets!');
    process.exit(0);
  }
}

checkSize();
