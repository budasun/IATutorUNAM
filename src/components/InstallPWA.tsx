'use client';

import { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClickInstall = async () => {
    if (!promptInstall) return;
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      setSupportsPWA(false);
    }
  };

  if (isStandalone) return null;

  if (supportsPWA) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-[#002B5C] border border-[#D4AF37]/50 rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/apple-touch-icon.png" alt="TIAUNAM" className="w-12 h-12 rounded-xl" />
          <div>
            <h3 className="text-white font-bold text-sm">Instalar TIAUNAM</h3>
            <p className="text-gray-300 text-xs">Acceso rápido y sin internet</p>
          </div>
        </div>
        <button onClick={onClickInstall} className="bg-[#D4AF37] text-[#002B5C] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#e5c349]">
          Instalar
        </button>
      </div>
    );
  }

  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-6 left-4 right-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl z-50 animate-bounce">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-[#D4AF37] font-bold text-sm flex items-center gap-2">
            <span>🍎</span> Instalar en iPhone
          </h3>
          <button onClick={() => setShowIOSPrompt(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <p className="text-gray-200 text-xs leading-relaxed">
          Para instalar, toca el ícono de <strong className="text-white">Compartir</strong> <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> en la barra inferior y luego selecciona <strong className="text-white">"Agregar a inicio"</strong> ➕.
        </p>
      </div>
    );
  }

  return null;
}