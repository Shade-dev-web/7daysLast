import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const viteReactEntryHtml = `<!doctype html>
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
    <style>html,body,#root{background-color:#07080A!important;color:#EDEEF0;margin:0;padding:0;width:100%;height:100%;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}</style>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Manrope:wght@500;600;700;800&family=Unbounded:wght@600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body data-state="title" class="bg-[#07080A] text-[#EDEEF0] overflow-hidden select-none" style="background-color:#07080A">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'serve-react-entry-while-keeping-23mb-apk-index-on-disk',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return viteReactEntryHtml;
          },
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
