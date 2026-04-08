'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { PreguntaGenerada } from '@/types/ia';

type EstadoExamen = 'configuracion' | 'cargando' | 'activo' | 'retroalimentacion' | 'finalizado';

const TEMAS_PRUEBA = [
  'La Revolución Mexicana',
  'El Porfiriato',
  'La Reforma liberal',
  'El movimiento de Independencia',
  'La Nueva España',
];

const TIEMPO_EXAMEN = 15 * 60;

export default function SimuladorPage() {
  const [estado, setEstado] = useState<EstadoExamen>('configuracion');
  const [pregunta, setPregunta] = useState<PreguntaGenerada | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_EXAMEN);
  const [aciertos, setAciertos] = useState(0);
  const [errores, setErrores] = useState(0);
  const [preguntasRespondidas, setPreguntasRespondidas] = useState(0);
  const [indiceTema, setIndiceTema] = useState(0);
  const [loading, setLoading] = useState(false);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);

  const obtenerPregunta = useCallback(async (tema: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generar-pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPregunta(data.data);
        setEstado('activo');
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
    setIndiceTema(0);
    setTiempoRestante(TIEMPO_EXAMEN);
    obtenerPregunta(TEMAS_PRUEBA[0]);
  };

  useEffect(() => {
    if (estado !== 'activo') return;
    if (tiempoRestante <= 0) {
      setEstado('finalizado');
      return;
    }
    const timer = setInterval(() => {
      setTiempoRestante((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [estado, tiempoRestante]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpcionClick = (opcion: string) => {
    if (estado !== 'activo' || !pregunta) return;
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
    const siguienteIndice = indiceTema + 1;
    if (siguienteIndice >= TEMAS_PRUEBA.length) {
      setEstado('finalizado');
      return;
    }
    setIndiceTema(siguienteIndice);
    setRespuestaSeleccionada(null);
    obtenerPregunta(TEMAS_PRUEBA[siguienteIndice]);
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
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-2xl font-bold text-[#002B5C] mb-4 text-center">Simulador UNAM</h1>
        <p className="text-gray-600 text-center mb-8">
          Área 3: Ciencias Sociales
        </p>
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm">
          <h2 className="font-semibold text-lg mb-4">Configuración</h2>
          <ul className="space-y-2 text-gray-600 mb-6">
            <li>• 5 preguntas</li>
            <li>• 15 minutos</li>
            <li>• Temas: Historia de México</li>
          </ul>
          <button
            onClick={iniciarExamen}
            className="w-full bg-[#002B5C] text-white py-3 rounded-lg font-semibold text-lg hover:bg-[#001f42] transition"
          >
            Iniciar Examen
          </button>
        </div>
      </div>
    );
  }

  if (loading || estado === 'cargando') {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-[#002B5C] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Cargando pregunta...</p>
      </div>
    );
  }

  if (estado === 'retroalimentacion' && pregunta) {
    return (
      <div className="p-4 flex flex-col min-h-[80vh]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Respuesta Incorrecta
          </div>
          <p className="text-yellow-800 text-sm">{pregunta.justificacionDescarte}</p>
        </div>
        <div className="flex-1"></div>
        <button
          onClick={() => {
            setRespuestaSeleccionada(null);
            siguientePregunta();
          }}
          className="w-full bg-[#002B5C] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#001f42] transition"
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
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-2xl font-bold text-[#002B5C] mb-4">Examen Finalizado</h1>
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm text-center">
          <div className="text-5xl font-bold text-[#002B5C] mb-2">{porcentaje}%</div>
          <p className="text-gray-600 mb-4">de efectividad</p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{aciertos}</div>
              <div className="text-sm text-green-600">Aciertos</div>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-700">{errores}</div>
              <div className="text-sm text-red-600">Errores</div>
            </div>
          </div>
          <button
            onClick={() => setEstado('configuracion')}
            className="w-full bg-[#002B5C] text-white py-3 rounded-lg font-semibold mt-6 hover:bg-[#001f42] transition"
          >
            Nuevo Examen
          </button>
        </div>
      </div>
    );
  }

  if (!pregunta) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <p className="text-gray-600">Inicializando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col min-h-[80vh]">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Pregunta {preguntasRespondidas + 1} de {TEMAS_PRUEBA.length}
        </span>
        <span className={`font-mono text-lg font-semibold ${tiempoRestante < 60 ? 'text-red-600' : 'text-[#002B5C]'}`}>
          {formatTime(tiempoRestante)}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <p className="text-lg font-medium text-gray-800">{pregunta.pregunta}</p>
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
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-red-100 border-2 border-red-500'
                : 'bg-white border-2 border-gray-200 hover:border-[#002B5C]'
            } ${
              respuestaSeleccionada !== null && opcion === pregunta.respuestaCorrecta
                ? 'bg-green-100 border-2 border-green-500'
                : ''
            }`}
          >
            <span className="inline-block w-8 h-8 rounded-full bg-gray-200 text-center mr-3">
              {String.fromCharCode(65 + index)}
            </span>
            {opcion}
          </button>
        ))}
      </div>
    </div>
  );
}