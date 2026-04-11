'use client';

import { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya es nativa
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // 2. Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // 3. Capturar el evento de instalación de Android de forma silenciosa
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Evitar que Chrome muestre su mini-banner automático feo
      setPromptInstall(e);
      setSupportsPWA(true);
      console.log("¡Evento de instalación capturado!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Nuevo requisito de Chrome: Detectar interacción del usuario
    const handleInteraction = () => {
      setUserInteracted(true);
      // Una vez que interactúa, ya no necesitamos escuchar esto
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  const onClickInstall = async () => {
    if (!promptInstall) {
      alert("Tu navegador aún no habilita la instalación. Intenta navegar un poco más por la app o usa el menú de opciones (⋮) -> 'Instalar aplicación'.");
      return;
    }
    
    // Mostrar el cuadro de diálogo nativo de Google
    promptInstall.prompt();
    
    // Esperar la decisión del alumno
    const { outcome } = await promptInstall.userChoice;
    
    if (outcome === 'accepted') {
      console.log('El usuario aceptó instalar TIAUNAM');
      setSupportsPWA(false); // Ocultar nuestro botón personalizado
    } else {
      console.log('El usuario rechazó la instalación');
    }
    
    // El prompt solo se puede usar una vez. Si lo rechaza, lo perdemos hasta que recargue.
    setPromptInstall(null); 
  };

  if (isStandalone) return null;

  // Solo mostramos el banner en Android SI ya capturamos el evento Y el usuario ya tocó la pantalla
  if (supportsPWA && userInteracted && !isIOS) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 bg-[#002B5C] border border-[#D4AF37]/50 rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <img src="/apple-touch-icon.png" alt="TIAUNAM" className="w-12 h-12 rounded-xl border border-white/20" />
          <div>
            <h3 className="text-white font-bold text-sm">Instalar TIAUNAM</h3>
            <p className="text-gray-300 text-xs">Acelera tus simulacros</p>
          </div>
        </div>
        <button onClick={onClickInstall} className="bg-[#D4AF37] text-[#002B5C] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#e5c349] transition active:scale-95 shadow-lg shadow-[#D4AF37]/20">
          Instalar App
        </button>
      </div>
    );
  }

  // iOS Fallback (Se mantiene igual)
  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-[#002B5C]/90 backdrop-blur-xl border border-[#D4AF37]/50 rounded-2xl p-4 shadow-2xl z-50 animate-bounce">
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