'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { PreguntaGenerada } from '@/types/ia';
import MathMarkdown from '@/components/MathMarkdown';

interface ErrorBanco {
  id: number;
  materia: string;
  datos_pregunta: PreguntaGenerada;
  fecha: string;
}

type Pantalla = 'cargando' | 'vacio' | 'resumen' | 'entrenando' | 'retroalimentacion' | 'fin';

export default function DebilidadesPage() {
  const [pantalla, setPantalla] = useState<Pantalla>('cargando');
  const [errores, setErrores] = useState<ErrorBanco[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [fueCorrecta, setFueCorrecta] = useState(false);
  const [opcionElegida, setOpcionElegida] = useState('');

  const cargarErrores = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    const { data, error } = await sb
      .from('banco_errores')
      .select('*')
      .eq('user_id', session.user.id)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error cargando debilidades:', error);
      return;
    }

    if (data && data.length > 0) {
      setErrores(data);
      setPantalla('resumen');
    } else {
      setPantalla('vacio');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarErrores();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const manejarRespuesta = async (opcion: string) => {
    const errorActual = errores[indiceActual];
    const pregunta = errorActual.datos_pregunta;
    const esCorrecta = opcion === pregunta.respuestaCorrecta;
    
    setOpcionElegida(opcion);
    setFueCorrecta(esCorrecta);
    setPantalla('retroalimentacion');

    if (esCorrecta) {
      const sb = getSupabase();
      if (sb) {
        await sb.from('banco_errores').delete().eq('id', errorActual.id);
      }
    }
  };

  const siguientePregunta = () => {
    if (indiceActual + 1 >= errores.length) {
      setPantalla('fin');
    } else {
      setIndiceActual(prev => prev + 1);
      setPantalla('entrenando');
    }
  };

  if (pantalla === 'cargando') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (pantalla === 'vacio') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center">
        <span className="text-6xl mb-6">🏆</span>
        <h1 className="text-2xl font-bold text-[#D4AF37] mb-2">¡Banco de Errores Limpio!</h1>
        <p className="text-gray-300 text-center mb-8 max-w-md">
          No tienes debilidades registradas actualmente. Sigue practicando en los simulacros.
        </p>
        <Link href="/" className="bg-[#D4AF37] text-[#002B5C] px-8 py-3 rounded-xl font-bold hover:bg-[#e5c349] transition">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  if (pantalla === 'resumen') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-4">Entrenar Debilidades</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 mb-8 text-center max-w-sm w-full">
          <span className="text-5xl font-bold text-red-400 block mb-2">{errores.length}</span>
          <p className="text-gray-300">Preguntas por repasar</p>
        </div>
        <button onClick={() => setPantalla('entrenando')} className="w-full max-w-sm bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition mb-4">
          Comenzar Entrenamiento
        </button>
        <Link href="/" className="text-gray-400 hover:text-white transition">← Volver</Link>
      </div>
    );
  }

  if (pantalla === 'fin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center text-center">
        <span className="text-6xl mb-4">✨</span>
        <h1 className="text-2xl font-bold text-[#D4AF37] mb-2">Entrenamiento Completado</h1>
        <p className="text-gray-300 mb-8">Las preguntas que contestaste correctamente han sido eliminadas de tu banco de debilidades.</p>
        <Link href="/" className="bg-[#D4AF37] text-[#002B5C] px-8 py-3 rounded-xl font-bold hover:bg-[#e5c349] transition">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const errorActual = errores[indiceActual];
  const pregunta = errorActual.datos_pregunta;

  if (pantalla === 'entrenando') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[#D4AF37] font-medium">{errorActual.materia}</span>
          <span className="text-gray-400">{indiceActual + 1} / {errores.length}</span>
        </div>
        
        {pregunta.textoLectura && (
          <div className="bg-[#002B5C] border border-[#D4AF37]/30 rounded-2xl p-4 mb-4 shadow-lg shadow-[#001a3d]">
            <MathMarkdown content={pregunta.textoLectura} className="text-gray-200 text-sm leading-relaxed" />
          </div>
        )}

        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
          <MathMarkdown content={pregunta.pregunta} className="text-lg font-medium" />
        </div>

        <div className="flex flex-col gap-3">
          {pregunta.opciones.map((opcion: string, idx: number) => (
            <button key={idx} onClick={() => manejarRespuesta(opcion)} className="p-4 rounded-xl text-left font-medium transition bg-white/10 border-2 border-white/20 hover:border-[#D4AF37]">
              <MathMarkdown content={opcion} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (pantalla === 'retroalimentacion') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
        <div className={`rounded-2xl p-6 mb-6 border ${fueCorrecta ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
          <h2 className={`text-xl font-bold mb-4 ${fueCorrecta ? 'text-green-400' : 'text-red-400'}`}>
            {fueCorrecta ? '¡Correcto! Eliminada del banco 🗑️' : 'Incorrecto. La mantendremos para repasar 🧠'}
          </h2>
          {!fueCorrecta && (
<div className="mb-4">
            <p className="text-white text-sm mb-1">Tu respuesta:</p>
            <MathMarkdown content={opcionElegida} className="text-red-300" />
          </div>
        )}
        <div className="mb-4">
          <p className="text-green-400 text-sm mb-1">Respuesta correcta:</p>
          <MathMarkdown content={pregunta.respuestaCorrecta} className="text-green-300" />
        </div>
        <div className="bg-[#002B5C]/50 p-4 rounded-xl mt-4">
          <p className="text-[#D4AF37] font-semibold mb-2">Explicación:</p>
          <MathMarkdown content={fueCorrecta ? pregunta.explicacionCorrecta : pregunta.justificacionDescarte} className="text-gray-300 text-sm" />
        </div>
        </div>
        <button onClick={siguientePregunta} className="mt-auto w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349]">
          Siguiente →
        </button>
      </div>
    );
  }

  return null;
}