import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = process.cwd();
const outDir = path.join(root, 'public', 'apk-export');
fs.mkdirSync(outDir, { recursive: true });

// 1. Run Vite build to get compiled Tailwind CSS and full offline JS bundle
execSync('npx vite build', { stdio: 'inherit' });

const assetsDir = path.join(root, 'dist', 'assets');
const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find((f) => f.endsWith('.css'));
const jsFile = assetFiles.find((f) => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  throw new Error('Could not find built CSS or JS in dist/assets');
}

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const fullJsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

// Safely escape </script> inside inline script tags
const safeInlineJs = (code) => code.replace(/<\/script>/gi, '<\\/script>');

const buildHtmlTemplate = (inlineCss, inlineJs, importMap = '') => `<!doctype html>
<html lang="ru" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
    <meta name="theme-color" content="#07080A" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>Тишина: 7 дней — Ultra Horror Edition</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Manrope:wght@500;600;700;800&family=Unbounded:wght@600;700;800&display=swap" rel="stylesheet" />
    ${importMap}
    <style>${inlineCss}</style>
  </head>
  <body data-state="title" class="bg-[#07080A] text-[#EDEEF0] overflow-hidden select-none">
    <div id="root"></div>
    <script type="module">${safeInlineJs(inlineJs)}</script>
  </body>
</html>
`;

// 2. Write 100% Offline Standalone index.html
const offlineHtml = buildHtmlTemplate(cssContent, fullJsContent);
fs.writeFileSync(path.join(outDir, 'index-offline.html'), offlineHtml, 'utf8');

// 3. Build Compact Standalone index.html (with Three.js & React via importmap CDN)
const compactBuild = await esbuild.build({
  entryPoints: [path.join(root, 'src', 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'esm',
  write: false,
  jsx: 'automatic',
  external: ['three', 'three/*', 'react', 'react/*', 'react-dom', 'react-dom/*'],
  loader: {
    '.css': 'empty',
  },
});

const compactJs = compactBuild.outputFiles[0].text;
const importMapTag = `<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19.0.1",
    "react/jsx-runtime": "https://esm.sh/react@19.0.1/jsx-runtime",
    "react-dom/client": "https://esm.sh/react-dom@19.0.1/client",
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>`;

const compactHtml = buildHtmlTemplate(cssContent, compactJs, importMapTag);
fs.writeFileSync(path.join(outDir, 'index-compact.html'), compactHtml, 'utf8');

console.log('Generated standalone APK files:');
console.log(' - public/apk-export/index-offline.html:', Math.round(offlineHtml.length / 1024), 'KB');
console.log(' - public/apk-export/index-compact.html:', Math.round(compactHtml.length / 1024), 'KB');
