'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { TEMARIO_UNAM } from '@/data/unam_temario';
import { PreguntaGenerada } from '@/types/ia';

type EstadoExamen = 'configuracion' | 'cargando' | 'activo' | 'retroalimentacion' | 'finalizado';

const TIEMPO_EXAMEN = 3 * 60 * 60;

const ESTRUCTURA_EXAMEN = [
  { id: 'matematicas', cantidad: 24 },
  { id: 'fisica', cantidad: 10 },
  { id: 'quimica', cantidad: 10 },
  { id: 'biologia', cantidad: 10 },
  { id: 'hist_universal', cantidad: 14 },
  { id: 'hist_mexico', cantidad: 14 },
  { id: 'literatura', cantidad: 10 },
  { id: 'geografia', cantidad: 10 },
  { id: 'espanol', cantidad: 18 },
];

const TOTAL_PREGUNTAS = ESTRUCTURA_EXAMEN.reduce((acc, item) => acc + item.cantidad, 0);

const MATERIAS_EXACTAS = ['matematicas', 'fisica', 'quimica'];

interface ResultadoMateria {
  aciertos: number;
  errores: number;
  total: number;
}

export default function SimuladorPage() {
  const [estado, setEstado] = useState<EstadoExamen>('configuracion');
  const [pausado, setPausado] = useState(false);
  const [pregunta, setPregunta] = useState<PreguntaGenerada | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_EXAMEN);
  const [aciertos, setAciertos] = useState(0);
  const [errores, setErrores] = useState(0);
  const [preguntaActualGlobal, setPreguntaActualGlobal] = useState(1);
  const [materiaActualIndex, setMateriaActualIndex] = useState(0);
  const [preguntasRespondidasDeMateriaActual, setPreguntasRespondidasDeMateriaActual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [resultadosPorMateria, setResultadosPorMateria] = useState<Record<string, ResultadoMateria>>({});
  const [fueCorrecta, setFueCorrecta] = useState<boolean>(false);

  const materiaActual = ESTRUCTURA_EXAMEN[materiaActualIndex];
  const nombreMateriaActual = TEMARIO_UNAM.materias.find(m => m.id === materiaActual.id)?.nombre || materiaActual.id;

  const inicializarResultadosPorMateria = () => {
    const resultados: Record<string, ResultadoMateria> = {};
    ESTRUCTURA_EXAMEN.forEach(item => {
      resultados[item.id] = { aciertos: 0, errores: 0, total: item.cantidad };
    });
    return resultados;
  };

  const obtenerPregunta = useCallback(async (materiaId: string) => {
    setLoading(true);
    setErrorApi(null);
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
        setErrorApi(data.error || 'La IA está saturada por peticiones rápidas.');
      }
    } catch (error) {
      console.error('Error obteniendo pregunta:', error);
      setErrorApi('Error de conexión. Revisa tu internet.');
    } finally {
      setLoading(false);
    }
  }, []);

  const iniciarExamen = () => {
    setAciertos(0);
    setErrores(0);
    setPreguntaActualGlobal(1);
    setMateriaActualIndex(0);
    setPreguntasRespondidasDeMateriaActual(0);
    setTiempoRestante(TIEMPO_EXAMEN);
    setPausado(false);
    setResultadosPorMateria(inicializarResultadosPorMateria());
    setEstado('cargando');
    obtenerPregunta(ESTRUCTURA_EXAMEN[0].id);
  };

  useEffect(() => {
    if (estado !== 'activo') return;
    if (pausado) return;
    if (tiempoRestante <= 0) {
      setEstado('finalizado');
      return;
    }
    const timer = setInterval(() => {
      setTiempoRestante((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [estado, pausado, tiempoRestante]);

  const handleRespuesta = (opcion: string) => {
    if (estado !== 'activo' || !pregunta) return;

    const esCorrecta = opcion === pregunta.respuestaCorrecta;
    const materiaId = materiaActual.id;

    setFueCorrecta(esCorrecta);

    if (esCorrecta) {
      setAciertos((prev) => prev + 1);
      setResultadosPorMateria(prev => ({
        ...prev,
        [materiaId]: { ...prev[materiaId], aciertos: prev[materiaId].aciertos + 1 }
      }));
    } else {
      setErrores((prev) => prev + 1);
      setResultadosPorMateria(prev => ({
        ...prev,
        [materiaId]: { ...prev[materiaId], errores: prev[materiaId].errores + 1 }
      }));
    }

    setPausado(true);
    setEstado('retroalimentacion');
  };

  const avanzarSiguientePregunta = () => {
    setEstado('cargando');

    setPreguntasRespondidasDeMateriaActual(prevRespondidas => {
      const nuevasRespondidas = prevRespondidas + 1;
      
      setMateriaActualIndex(prevMateriaIndex => {
        let siguienteMateriaIndex = prevMateriaIndex;
        let buscarSiguienteMateria = false;

        if (nuevasRespondidas >= ESTRUCTURA_EXAMEN[prevMateriaIndex].cantidad) {
          siguienteMateriaIndex = prevMateriaIndex + 1;
          buscarSiguienteMateria = true;
        }

        setPreguntaActualGlobal(prevGlobal => {
          const nuevaGlobal = prevGlobal + 1;
          
          if (nuevaGlobal > TOTAL_PREGUNTAS) {
            setEstado('finalizado');
            return prevGlobal;
          }

          if (buscarSiguienteMateria) {
             setTimeout(() => setPreguntasRespondidasDeMateriaActual(0), 0);
             obtenerPregunta(ESTRUCTURA_EXAMEN[siguienteMateriaIndex].id);
          } else {
             obtenerPregunta(ESTRUCTURA_EXAMEN[prevMateriaIndex].id);
          }

          return nuevaGlobal;
        });

        return siguienteMateriaIndex;
      });

      return nuevasRespondidas;
    });
  };

  const continuarDespuesRetroalimentacion = () => {
    setPausado(false);
    avanzarSiguientePregunta();
  };

  const guardarProgreso = async () => {
    const sb = getSupabase();
    if (!sb) {
      console.log('Supabase no configurado, progreso no guardado');
      return;
    }
    const { error } = await sb.from('progreso_simulacros').insert({
      aciertos,
      errores,
      total_preguntas: TOTAL_PREGUNTAS,
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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (estado === 'configuracion') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4">
        <div className="flex flex-col items-center justify-center min-h-[85vh]">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#D4AF37] mb-6">
            <span className="text-5xl">🏆</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2 text-center">
            Mega-Simulador UNAM
          </h1>
          <p className="text-gray-300 text-center mb-8">{TEMARIO_UNAM.area}</p>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-md border border-[#D4AF37]/30 mb-6">
            <h2 className="font-semibold text-lg mb-4 text-[#D4AF37] text-center">Estructura del Examen</h2>
            <div className="space-y-2 text-sm">
              {ESTRUCTURA_EXAMEN.map((item) => {
                const materia = TEMARIO_UNAM.materias.find(m => m.id === item.id);
                return (
                  <div key={item.id} className="flex justify-between items-center py-1 border-b border-white/10">
                    <span className="text-gray-300">{materia?.nombre || item.id}</span>
                    <span className="text-[#D4AF37] font-bold">{item.cantidad}</span>
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-2 font-bold">
                <span className="text-white">TOTAL</span>
                <span className="text-[#D4AF37] text-lg">{TOTAL_PREGUNTAS}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-md border border-[#D4AF37]/30">
            <ul className="space-y-2 text-gray-300 mb-6">
              <li className="flex items-center gap-2">
                <span>⏱️</span> 3 horas de duración
              </li>
              <li className="flex items-center gap-2">
                <span>📋</span> {TOTAL_PREGUNTAS} preguntas de opción múltiple
              </li>
              <li className="flex items-center gap-2">
                <span>🎯</span> Retroalimentación al instante si fallas
              </li>
              <li className="flex items-center gap-2">
                <span>📊</span> Resultados detallados por materia
              </li>
            </ul>
            <button
              onClick={iniciarExamen}
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
            >
              Comenzar Simulacro
            </button>
          </div>

          <Link
            href="/"
            className="mt-6 text-gray-400 hover:text-[#D4AF37] transition"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (loading || errorApi) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center">
        {errorApi ? (
          <div className="text-center bg-red-500/10 p-6 rounded-2xl border border-red-500/30 max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl text-red-400 font-bold mb-2">Pausa técnica</h2>
            <p className="text-gray-300 mb-6">{errorApi}<br/><br/>(Suele ocurrir al responder muy rápido).</p>
            <button
              onClick={() => obtenerPregunta(ESTRUCTURA_EXAMEN[materiaActualIndex].id)}
              className="bg-[#D4AF37] text-[#002B5C] px-6 py-3 rounded-xl font-bold hover:bg-[#e5c349] transition"
            >
              Reintentar Pregunta
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-xl text-[#D4AF37] font-semibold">Generando pregunta...</p>
            <p className="text-gray-400 mt-2">
              {preguntaActualGlobal} de {TOTAL_PREGUNTAS}
            </p>
          </>
        )}
      </div>
    );
  }

  if (estado === 'retroalimentacion' && pregunta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
        <div className={`rounded-2xl p-6 mb-6 ${
          fueCorrecta 
            ? 'bg-green-500/20 border border-green-500/50' 
            : 'bg-yellow-500/20 border border-yellow-500/50'
        }`}>
          <div className={`flex items-center gap-3 font-bold text-xl mb-4 ${
            fueCorrecta ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {fueCorrecta ? (
              <>
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ¡Excelente! Respuesta Correcta
              </>
            ) : (
              <>
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Respuesta Incorrecta
              </>
            )}
          </div>
          <p className="text-gray-300 text-sm mb-3">
            <strong className="text-white">Materia:</strong> {nombreMateriaActual}
          </p>
          {!fueCorrecta && (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-white font-medium mb-2">Tu respuesta:</p>
              <p className="text-red-300">{pregunta.opciones.find(o => o !== pregunta.respuestaCorrecta)}</p>
            </div>
          )}
          <div className={`rounded-xl p-4 mb-4 ${fueCorrecta ? 'bg-green-500/10' : 'bg-green-500/10'}`}>
            <p className="text-green-400 font-medium mb-2">Respuesta correcta:</p>
            <p className="text-green-300">{pregunta.respuestaCorrecta}</p>
          </div>
          <div className="bg-[#002B5C]/50 rounded-xl p-4">
            <p className="text-[#D4AF37] font-semibold mb-2">
              {fueCorrecta ? '💡 Profundiza tu conocimiento:' : '📖 Explicación Pedagógica:'}
            </p>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {fueCorrecta ? pregunta.explicacionCorrecta : pregunta.justificacionDescarte}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={continuarDespuesRetroalimentacion}
            className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
          >
            Entendido, continuar →
          </button>
          <p className="text-center text-gray-500 text-sm mt-3">
            ⏱️ Reloj pausado - Tómate tu tiempo para leer
          </p>
        </div>
      </div>
    );
  }

  if (estado === 'finalizado') {
    const porcentajeTotal = Math.round((aciertos / TOTAL_PREGUNTAS) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4AF37] mb-4">
              <span className="text-4xl">🎓</span>
            </div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Resultados del Mega-Simulacro</h1>
            <p className="text-gray-400">Examen Área 3: Ciencias Sociales</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-6 border border-[#D4AF37]/30 text-center">
            <div className="text-6xl font-bold text-[#D4AF37] mb-2">{porcentajeTotal}%</div>
            <p className="text-gray-300 mb-6">de efectividad</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/20 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-400">{aciertos}</div>
                <div className="text-sm text-green-300">Aciertos</div>
              </div>
              <div className="bg-red-500/20 rounded-xl p-4">
                <div className="text-3xl font-bold text-red-400">{errores}</div>
                <div className="text-sm text-red-300">Errores</div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[#D4AF37] mb-4">Desglose por Materia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {ESTRUCTURA_EXAMEN.map((item) => {
              const materia = TEMARIO_UNAM.materias.find(m => m.id === item.id);
              const resultado = resultadosPorMateria[item.id] || { aciertos: 0, errores: 0 };
              const porcentajeMateria = Math.round((resultado.aciertos / item.cantidad) * 100);
              const esDominado = porcentajeMateria >= 70;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-4 border ${
                    esDominado ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">{materia?.nombre || item.id}</span>
                    <span className={`text-sm font-bold ${esDominado ? 'text-green-400' : 'text-red-400'}`}>
                      {porcentajeMateria}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-300">✓ {resultado.aciertos}/{item.cantidad}</span>
                    <span className="text-red-300">✗ {resultado.errores}/{item.cantidad}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/diagnostico"
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg text-center hover:bg-[#e5c349] transition"
            >
              Hacer Nuevo Diagnóstico
            </Link>
            <button
              onClick={iniciarExamen}
              className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition"
            >
              Repetir Mega-Simulacro
            </button>
            <Link
              href="/"
              className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-semibold text-center hover:bg-white/20 transition"
            >
              ← Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pregunta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex items-center justify-center">
        <p className="text-gray-400">Inicializando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-400">
          Pregunta {preguntaActualGlobal} de {TOTAL_PREGUNTAS}
        </span>
        <span className={`font-mono text-lg font-bold ${tiempoRestante < 300 ? 'text-red-400' : 'text-[#D4AF37]'}`}>
          {formatTime(tiempoRestante)}
        </span>
      </div>

      <div className="bg-[#D4AF37]/20 rounded-lg px-3 py-1 inline-block mb-4 self-start">
        <span className="text-sm text-[#D4AF37] font-medium">
          {nombreMateriaActual}
        </span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-1 mb-6">
        <div
          className="bg-[#D4AF37] h-1 rounded-full transition-all duration-300"
          style={{ width: `${(preguntaActualGlobal / TOTAL_PREGUNTAS) * 100}%` }}
        />
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
        <p className="text-lg font-medium text-white leading-relaxed">{pregunta.pregunta}</p>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {pregunta.opciones.map((opcion, index) => (
          <button
            key={index}
            onClick={() => handleRespuesta(opcion)}
            className="p-4 rounded-xl text-left font-medium transition bg-white/10 border-2 border-white/20 hover:border-[#D4AF37]"
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
