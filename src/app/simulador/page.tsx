'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { TEMARIO_UNAM } from '@/data/unam_temario';
import { PreguntaGenerada } from '@/types/ia';

type EstadoExamen = 'configuracion' | 'cargando' | 'activo' | 'retroalimentacion' | 'finalizado';

const TIEMPO_POR_PREGUNTA = 120;

export default function SimuladorPage() {
  const [estado, setEstado] = useState<EstadoExamen>('configuracion');
  const [pregunta, setPregunta] = useState<PreguntaGenerada | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_POR_PREGUNTA);
  const [aciertos, setAciertos] = useState(0);
  const [errores, setErrores] = useState(0);
  const [preguntasRespondidas, setPreguntasRespondidas] = useState(0);
  const [indiceMateria, setIndiceMateria] = useState(0);
  const [loading, setLoading] = useState(false);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);

  const totalMaterias = TEMARIO_UNAM.materias.length;

  const obtenerPregunta = useCallback(async (materiaId: string) => {
    setLoading(true);
    setTiempoRestante(TIEMPO_POR_PREGUNTA);
    try {
      const res = await fetch('/api/generar-pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_materia: materiaId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPregunta(data.data);
        setEstado('activo');
      } else {
        console.error('Error de API:', data.error);
      }
    } catch (error) {
      console.error('Error obteniendo pregunta:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const iniciarExamen = () => {
    setAciertos(0);
    setErrores(0);
    setPreguntasRespondidas(0);
    setIndiceMateria(0);
    setTiempoRestante(TIEMPO_POR_PREGUNTA);
    const primeraMateria = TEMARIO_UNAM.materias[0];
    obtenerPregunta(primeraMateria.id);
  };

  useEffect(() => {
    if (estado !== 'activo') return;
    if (tiempoRestante <= 0) {
      handleOpcionClick('');
      return;
    }
    const timer = setInterval(() => {
      setTiempoRestante((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [estado, tiempoRestante]);

  const handleOpcionClick = (opcion: string) => {
    if (estado !== 'activo' || !pregunta) return;
    if (tiempoRestante <= 0 && opcion === '') {
      setRespuestaSeleccionada(null);
      setPreguntasRespondidas((prev) => prev + 1);
      setErrores((prev) => prev + 1);
      setEstado('retroalimentacion');
      return;
    }
    setRespuestaSeleccionada(opcion);
    setPreguntasRespondidas((prev) => prev + 1);
    if (opcion === pregunta.respuestaCorrecta) {
      setAciertos((prev) => prev + 1);
      siguientePregunta();
    } else {
      setErrores((prev) => prev + 1);
      setEstado('retroalimentacion');
    }
  };

  const siguientePregunta = () => {
    const siguienteIndice = indiceMateria + 1;
    if (siguienteIndice >= totalMaterias) {
      setEstado('finalizado');
      return;
    }
    setIndiceMateria(siguienteIndice);
    setRespuestaSeleccionada(null);
    const siguienteMateria = TEMARIO_UNAM.materias[siguienteIndice];
    obtenerPregunta(siguienteMateria.id);
  };

  const guardarProgreso = async () => {
    const sb = getSupabase();
    if (!sb) {
      console.log('Supabase no configurado, progreso no guardado');
      return;
    }
    const total = preguntasRespondidas + (estado === 'retroalimentacion' ? 1 : 0);
    const { error } = await sb.from('progreso_simulacros').insert({
      aciertos,
      errores: estado === 'retroalimentacion' ? errores + 1 : errores,
      total_preguntas: total,
      fecha: new Date().toISOString(),
    });
    if (error) {
      console.error('Error guardando progreso:', error);
    }
  };

  useEffect(() => {
    if (estado === 'finalizado') {
      guardarProgreso();
    }
  }, [estado]);

  if (estado === 'configuracion') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4AF37] mb-6">
            <span className="text-4xl">📝</span>
          </div>
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2 text-center">Simulador UNAM</h1>
          <p className="text-gray-300 text-center mb-8">{TEMARIO_UNAM.area}</p>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-sm border border-[#D4AF37]/30">
            <h2 className="font-semibold text-lg mb-4 text-[#D4AF37]">Configuración</h2>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li>• {totalMaterias} preguntas (una por materia)</li>
              <li>• 2 minutos por pregunta</li>
              <li>• Temario completo Area 3</li>
            </ul>
            <button
              onClick={iniciarExamen}
              className="w-full bg-[#D4AF37] text-[#002B5C] py-3 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
            >
              Iniciar Examen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || estado === 'cargando') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-300">Generando pregunta...</p>
        <p className="text-[#D4AF37] text-sm mt-2">IA trabajando</p>
      </div>
    );
  }

  if (estado === 'retroalimentacion' && pregunta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 text-yellow-400 font-bold text-lg mb-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Respuesta Incorrecta
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{pregunta.justificacionDescarte}</p>
        </div>
        <div className="flex-1"></div>
        <button
          onClick={() => {
            setRespuestaSeleccionada(null);
            siguientePregunta();
          }}
          className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
        >
          Entendido, siguiente
        </button>
      </div>
    );
  }

  if (estado === 'finalizado') {
    const total = preguntasRespondidas;
    const porcentaje = total > 0 ? Math.round((aciertos / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">Examen Finalizado</h1>
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 w-full max-w-sm text-center border border-[#D4AF37]/30">
          <div className="text-6xl font-bold text-[#D4AF37] mb-2">{porcentaje}%</div>
          <p className="text-gray-300 mb-6">de efectividad</p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-500/20 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-400">{aciertos}</div>
              <div className="text-sm text-green-300">Aciertos</div>
            </div>
            <div className="bg-red-500/20 rounded-xl p-4">
              <div className="text-3xl font-bold text-red-400">{errores}</div>
              <div className="text-sm text-red-300">Errores</div>
            </div>
          </div>
          <button
            onClick={() => setEstado('configuracion')}
            className="w-full bg-[#D4AF37] text-[#002B5C] py-3 rounded-xl font-bold mt-6 hover:bg-[#e5c349] transition"
          >
            Nuevo Examen
          </button>
        </div>
      </div>
    );
  }

  if (!pregunta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center">
        <p className="text-gray-400">Inicializando...</p>
      </div>
    );
  }

  const materiaActual = TEMARIO_UNAM.materias[indiceMateria];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-[#D4AF37] font-medium">
          {materiaActual.nombre}
        </span>
        <span className="text-sm text-gray-400">
          {preguntasRespondidas + 1} de {totalMaterias}
        </span>
        <span className={`font-mono text-lg font-bold ${tiempoRestante < 30 ? 'text-red-400' : 'text-[#D4AF37]'}`}>
          {tiempoRestante}s
        </span>
      </div>

      <div className="w-full bg-[#D4AF37]/20 rounded-full h-1 mb-6">
        <div 
          className="bg-[#D4AF37] h-1 rounded-full transition-all duration-1000"
          style={{ width: `${((preguntasRespondidas + 1) / totalMaterias) * 100}%` }}
        />
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
        <p className="text-lg font-medium text-white leading-relaxed">{pregunta.pregunta}</p>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {pregunta.opciones.map((opcion, index) => (
          <button
            key={index}
            onClick={() => handleOpcionClick(opcion)}
            disabled={respuestaSeleccionada !== null}
            className={`p-4 rounded-xl text-left font-medium transition ${
              respuestaSeleccionada === opcion
                ? opcion === pregunta.respuestaCorrecta
                  ? 'bg-green-500/30 border-2 border-green-400'
                  : 'bg-red-500/30 border-2 border-red-400'
                : respuestaSeleccionada !== null && opcion === pregunta.respuestaCorrecta
                ? 'bg-green-500/30 border-2 border-green-400'
                : 'bg-white/10 border-2 border-white/20 hover:border-[#D4AF37]'
            }`}
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/30 text-[#D4AF37] font-bold mr-3">
              {String.fromCharCode(65 + index)}
            </span>
            {opcion}
          </button>
        ))}
      </div>
    </div>
  );
}
