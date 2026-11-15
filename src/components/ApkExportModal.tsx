import React, { useEffect, useState } from 'react';

interface ApkExportModalProps {
  open: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ open, onClose }) => {
  const [compactHtml, setCompactHtml] = useState<string>('');
  const [workflowYml, setWorkflowYml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedKind, setCopiedKind] = useState<'html' | 'yml' | null>(null);
  const [activePreview, setActivePreview] = useState<'html' | 'yml'>('html');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch('/apk-export/index-compact.html').then((r) => (r.ok ? r.text() : '')),
      fetch('/assets/aistudio/build_apk_023f68b6.yml').then((r) => (r.ok ? r.text() : '')),
    ])
      .then(([htmlText, ymlText]) => {
        setCompactHtml(htmlText);
        setWorkflowYml(ymlText);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const triggerDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch {
      window.location.href = url;
    }
  };

  const copyToClipboard = async (text: string, kind: 'html' | 'yml') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      setTimeout(() => setCopiedKind(null), 2800);
    } catch {
      const ta = document.getElementById('apk-export-textarea') as HTMLTextAreaElement | null;
      if (ta) {
        ta.focus();
        ta.select();
        document.execCommand('copy');
        setCopiedKind(kind);
        setTimeout(() => setCopiedKind(null), 2800);
      }
    }
  };

  const previewText = activePreview === 'html' ? compactHtml : workflowYml;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Экспорт одного файла index.html для GitHub и сборки APK"
      data-testid="apk-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 select-none"
    >
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#111318] border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-[#0B0D11]">
          <div>
            <h2 className="font-['Unbounded'] text-base sm:text-lg font-bold text-white">
              ГОТОВЫЙ ФАЙЛ <span className="text-amber-400">index.html</span> ДЛЯ GITHUB И СБОРКИ APK
            </h2>
            <p className="text-xs text-[#9499A3] mt-0.5">
              Один автономный файл со всей обновлённой игрой, шейдерами, шкалой слева, крафтом и 120 FPS
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-apk-modal-btn"
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
          >
            Закрыть [Esc]
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Card 1: Single File index.html */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-amber-500/35 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-base">1. Файл игры: index.html</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                    1 ФАЙЛ (ВСЁ ВНУТРИ)
                  </span>
                </div>
                <p className="text-xs text-[#9499A3] mt-1.5 leading-relaxed">
                  Положи этот файл в корень своего GitHub-репозитория под именем <code className="text-white font-mono">index.html</code>. Твой <code className="text-white font-mono">build_apk.yml</code> автоматически упакует его в Android APK.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  data-testid="download-offline-html-btn"
                  onClick={() => triggerDownload('/apk-export/index-offline.html', 'index.html')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-wide cursor-pointer shadow-lg"
                >
                  Скачать index.html (Полный Offline APK — работает без интернета)
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="download-compact-html-btn"
                    onClick={() => triggerDownload('/apk-export/index-compact.html', 'index.html')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs cursor-pointer"
                  >
                    Скачать компактный index.html
                  </button>
                  <button
                    type="button"
                    data-testid="copy-html-btn"
                    onClick={() => {
                      setActivePreview('html');
                      copyToClipboard(compactHtml, 'html');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer"
                  >
                    {copiedKind === 'html' ? '✓ Скопировано в буфер!' : 'Скопировать код index.html'}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: GitHub Actions build_apk.yml */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base">2. Сборщик: build_apk.yml</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[#9499A3] font-mono text-[11px]">
                    .github/workflows/
                  </span>
                </div>
                <p className="text-xs text-[#9499A3] mt-1.5 leading-relaxed">
                  Файл GitHub Actions для автоматической сборки <code className="text-white font-mono">Silence7-APK (app-debug.apk)</code> при каждом коммите в ветку <code className="text-white font-mono">main</code>.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    triggerDownload('/assets/aistudio/build_apk_023f68b6.yml', 'build_apk.yml')
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs cursor-pointer"
                >
                  Скачать build_apk.yml
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePreview('yml');
                    copyToClipboard(workflowYml, 'yml');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#9499A3] hover:text-white font-bold text-xs cursor-pointer"
                >
                  {copiedKind === 'yml'
                    ? '✓ build_apk.yml скопирован!'
                    : 'Скопировать код build_apk.yml'}
                </button>
              </div>
            </div>
          </div>

          {/* Code Box for Direct Selection / Copy */}
          <div className="rounded-xl bg-[#07080A] border border-white/15 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreview('html')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    activePreview === 'html'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-[#9499A3]'
                  }`}
                >
                  Код index.html ({Math.round(compactHtml.length / 1024)} КБ)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreview('yml')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    activePreview === 'yml'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-[#9499A3]'
                  }`}
                >
                  Код .github/workflows/build_apk.yml
                </button>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(previewText, activePreview)}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer"
              >
                {copiedKind === activePreview ? '✓ Скопировано!' : 'Копировать весь код'}
              </button>
            </div>

            <textarea
              id="apk-export-textarea"
              readOnly
              value={loading ? 'Генерация файла...' : previewText}
              onClick={(e) => e.currentTarget.select()}
              className="w-full h-48 rounded-lg bg-black/90 border border-white/10 p-3 font-mono text-[11px] text-emerald-300 select-all focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
