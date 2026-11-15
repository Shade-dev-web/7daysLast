import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = process.cwd();
const outDir = path.join(root, 'public', 'apk-export');
fs.mkdirSync(outDir, { recursive: true });

const baseStyle = `html,body,#root{background-color:#07080A!important;color:#EDEEF0;margin:0;padding:0;width:100%;height:100%;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}`;

// 1. Write clean Vite entry index.html before running vite build
const cleanViteIndex = `<!doctype html>
<html lang="ru" class="dark" style="background-color:#07080A;color:#EDEEF0">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
    <meta name="theme-color" content="#07080A" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>Тишина: 7 дней — Ultra Horror Edition</title>
    <meta name="description" content="Хоррор на выживание от первого лица: постоянная шкала шума слева, динамическое освещение, шейдеры, ограниченный фонарик, инвентарь, крафт капканов и 120 FPS." />
    <meta property="og:title" content="Тишина: 7 дней — Ultra Horror Edition" />
    <meta property="og:description" content="Хоррор на выживание от первого лица: постоянная шкала шума слева, динамическое освещение, шейдеры, ограниченный фонарик, инвентарь, крафт капканов и 120 FPS." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <style>${baseStyle}</style>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Manrope:wght@500;600;700;800&family=Unbounded:wght@600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body data-state="title" class="bg-[#07080A] text-[#EDEEF0] overflow-hidden select-none" style="background-color:#07080A">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), cleanViteIndex, 'utf8');

// 2. Run Vite build to get compiled Tailwind CSS and full offline JS bundle
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

// 3. Write 100% Offline Standalone index.html
const offlineHtml = buildStandaloneHtml(cssContent, fullJsContent);
fs.writeFileSync(path.join(outDir, 'index-offline.html'), offlineHtml, 'utf8');

// 4. Build Compact Standalone index.html (with Three.js & React via importmap CDN)
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

// 5. Write hybrid root /index.html that works in BOTH Vite AND standalone Android WebView (cp index.html apk/app/src/main/assets/index.html)
const hybridRootIndex = `<!doctype html>
<html lang="ru" class="dark" style="background-color:#07080A;color:#EDEEF0">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
    <meta name="theme-color" content="#07080A" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>Тишина: 7 дней — Ultra Horror Edition</title>
    <meta name="description" content="Хоррор на выживание от первого лица: постоянная шкала шума слева, динамическое освещение, шейдеры, ограниченный фонарик, инвентарь, крафт капканов и 120 FPS." />
    <meta property="og:title" content="Тишина: 7 дней — Ultra Horror Edition" />
    <meta property="og:description" content="Хоррор на выживание от первого лица: постоянная шкала шума слева, динамическое освещение, шейдеры, ограниченный фонарик, инвентарь, крафт капканов и 120 FPS." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <style>${baseStyle}</style>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Manrope:wght@500;600;700;800&family=Unbounded:wght@600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body data-state="title" class="bg-[#07080A] text-[#EDEEF0] overflow-hidden select-none" style="background-color:#07080A">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script id="apk-offline-css" type="text/plain">${safeInlineJs(cssContent)}</script>
    <script id="apk-offline-js" type="text/plain">${safeInlineJs(fullJsContent)}</script>
    <script>
      (function() {
        var isApkWebView = location.hostname === 'appassets.androidplatform.net' || location.protocol === 'file:';
        function bootStandaloneApk() {
          if (window.__s7_apk_booted) return;
          window.__s7_apk_booted = true;
          var cssEl = document.getElementById('apk-offline-css');
          var jsEl = document.getElementById('apk-offline-js');
          if (cssEl && cssEl.textContent) {
            var st = document.createElement('style');
            st.textContent = cssEl.textContent;
            document.head.appendChild(st);
          }
          if (jsEl && jsEl.textContent) {
            var sc = document.createElement('script');
            sc.type = 'module';
            sc.textContent = jsEl.textContent;
            document.body.appendChild(sc);
          }
        }
        if (isApkWebView) {
          bootStandaloneApk();
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              var root = document.getElementById('root');
              if (root && !root.hasChildNodes()) {
                bootStandaloneApk();
              }
            }, 1200);
          });
        }
      })();
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), hybridRootIndex, 'utf8');

console.log('Generated standalone APK files & hybrid root index.html:');
console.log(' - index.html (hybrid Vite + APK offline):', Math.round(hybridRootIndex.length / 1024), 'KB');
console.log(' - public/apk-export/index-offline.html:', Math.round(offlineHtml.length / 1024), 'KB');
console.log(' - public/apk-export/index-compact.html:', Math.round(compactHtml.length / 1024), 'KB');
