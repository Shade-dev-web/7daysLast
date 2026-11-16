import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = process.cwd();
const outDir = path.join(root, 'public', 'apk-export');
fs.mkdirSync(outDir, { recursive: true });

const baseStyle = `html,body,#root{background-color:#07080A!important;color:#EDEEF0;margin:0;padding:0;width:100%;height:100%;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}`;

// 1. Run Vite build (vite.config.ts transformIndexHtml provides the clean React entry automatically)
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

const safeInlineJs = (code) => code.replace(/<\/script>/gi, '<\\/script>');

const buildStandaloneHtml = (inlineCss, inlineJs, importMap = '') => `<!doctype html>
<html lang="ru" class="dark" style="background-color:#07080A;color:#EDEEF0">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
    <meta name="theme-color" content="#07080A" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>Тишина: 7 дней — Ultra Horror Edition</title>
    <style>${baseStyle}</style>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Manrope:wght@500;600;700;800&family=Unbounded:wght@600;700;800&display=swap" rel="stylesheet" />
    ${importMap}
    <style>${inlineCss}</style>
  </head>
  <body data-state="title" class="bg-[#07080A] text-[#EDEEF0] overflow-hidden select-none" style="background-color:#07080A">
    <div id="root"></div>
    <script type="module">${safeInlineJs(inlineJs)}</script>
  </body>
</html>
`;

// 2. Write 100% Offline Standalone React index-offline.html
const offlineHtml = buildStandaloneHtml(cssContent, fullJsContent);
fs.writeFileSync(path.join(outDir, 'index-offline.html'), offlineHtml, 'utf8');

// 3. Build Compact Standalone index-compact.html
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

const compactHtml = buildStandaloneHtml(cssContent, compactJs, importMapTag);
fs.writeFileSync(path.join(outDir, 'index-compact.html'), compactHtml, 'utf8');

// 4. Write the pure 23.65 MB ARNEX WORK v2.3.1 ULTRA HTML directly to root /index.html on disk!
// That way, when the user transfers files from AI Studio to GitHub, root /index.html is ALREADY 23.65 MB
// and boots ARNEX WORK v2.3.1 ULTRA directly in the Android APK with ZERO wrapper scripts or errors!
const heavyArnexPath = path.join(outDir, 'index-heavy-20mb.html');
if (!fs.existsSync(heavyArnexPath)) {
  throw new Error('Missing public/apk-export/index-heavy-20mb.html — run build-arnex-v231.mjs first!');
}
fs.copyFileSync(heavyArnexPath, path.join(root, 'index.html'));

// Also ensure both .github/workflows/main.yml and .github/workflows/build_apk.yml exist and are identical
const wfDir = path.join(root, '.github', 'workflows');
if (fs.existsSync(path.join(wfDir, 'main.yml'))) {
  fs.copyFileSync(path.join(wfDir, 'main.yml'), path.join(wfDir, 'build_apk.yml'));
}

const rootStat = fs.statSync(path.join(root, 'index.html'));
console.log('Generated standalone APK files & 23.65 MB root index.html:');
console.log(' - root /index.html (pure ARNEX v2.3.1 23.65 MB for direct GitHub APK build):', (rootStat.size / (1024 * 1024)).toFixed(2), 'MB');
console.log(' - public/apk-export/index-arnex-v2.3.1.html:', Math.round(fs.statSync(path.join(outDir, 'index-arnex-v2.3.1.html')).size / 1024), 'KB');
console.log(' - public/apk-export/index-offline.html:', Math.round(offlineHtml.length / 1024), 'KB');
console.log(' - public/apk-export/index-compact.html:', Math.round(compactHtml.length / 1024), 'KB');
