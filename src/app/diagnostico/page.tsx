'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { TEMARIO_UNAM } from '@/data/unam_temario';
import { PreguntaGenerada } from '@/types/ia';
import { getSupabase } from '@/lib/supabase/client';
import MathMarkdown from '@/components/MathMarkdown';

type Pantalla = 'bienvenida' | 'cargando' | 'examen' | 'retroalimentacion' | 'resultados';
type AreaKey = keyof typeof TEMARIO_UNAM;

interface Resultado {
  materia: string;
  acierto: boolean;
}

export default function DiagnosticoPage() {
  const [pantalla, setPantalla] = useState<Pantalla>('bienvenida');
  const [indiceMateria, setIndiceMateria] = useState(0);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [pregunta, setPregunta] = useState<PreguntaGenerada | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [fueCorrecta, setFueCorrecta] = useState<boolean>(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState<AreaKey>('area3');

  // PARCHE DE SEGURIDAD 1: Extracción segura de datos para evitar crasheos (Stale Closure)
  const areaActual = TEMARIO_UNAM[areaSeleccionada] || TEMARIO_UNAM['area3'];
  const materiasDelArea = areaActual?.materias || [];
  const totalMaterias = materiasDelArea.length;

  // PARCHE DE SEGURIDAD 2: Agregamos areaActual.nombre a las dependencias
  const fetchPregunta = useCallback(async (materiaId: string) => {
    setLoading(true);
    setErrorApi(null);
    try {
      const res = await fetch('/api/generar-pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_materia: materiaId, area: areaActual.nombre, model: 'openai/gpt-oss-120b' }),
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setPregunta(data.data[0]);
        setPantalla('examen');
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
  }, [areaActual.nombre]);

  const iniciarDiagnostico = () => {
    setIndiceMateria(0);
    setResultados([]);
    setPantalla('cargando');
    // Extracción segura del primer ID
    fetchPregunta(materiasDelArea[0]?.id);
  };

  const registrarErrorEnBanco = async (preguntaFallada: PreguntaGenerada, nombreMateria: string, nombreArea: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    await sb.from('banco_errores').insert({
      user_id: session.user.id,
      area: nombreArea,
      materia: nombreMateria,
      datos_pregunta: preguntaFallada
    });
  };

  const handleRespuesta = (opcion: string) => {
    if (pantalla !== 'examen' || !pregunta) return;

    // PARCHE DE SEGURIDAD 3: Leer siempre del estado actual para evitar Undefined
    const materiasAreaLocal = TEMARIO_UNAM[areaSeleccionada]?.materias || [];
    const materiaActualObjLocal = materiasAreaLocal[indiceMateria] || materiasAreaLocal[0];
    const nombreMateriaLocal = materiaActualObjLocal?.nombre || 'Materia Desconocida';
    const nombreAreaLocal = TEMARIO_UNAM[areaSeleccionada]?.nombre || 'Área Desconocida';

    const fueCorrecto = opcion === pregunta.respuestaCorrecta;

    if (!fueCorrecto) {
      registrarErrorEnBanco(pregunta, nombreMateriaLocal, nombreAreaLocal);
    }

    const nuevoResultado: Resultado = {
      materia: nombreMateriaLocal,
      acierto: fueCorrecto,
    };

    setResultados((prev) => [...prev, nuevoResultado]);
    setFueCorrecta(fueCorrecto);
    setPantalla('retroalimentacion');
  };

  const continuarDespuesRetroalimentacion = () => {
    setPantalla('cargando');

    setIndiceMateria(prevIndice => {
      const siguienteIndice = prevIndice + 1;
      if (siguienteIndice >= totalMaterias) {
        setPantalla('resultados');
        guardarProgresoDiagnostico(resultados);
        return prevIndice;
      }
      // Extracción segura del siguiente ID
      fetchPregunta(materiasDelArea[siguienteIndice]?.id);
      return siguienteIndice;
    });
  };

  const guardarProgresoDiagnostico = async (resultadosFinales: Resultado[]) => {
    const sb = getSupabase();
    if (!sb) {
      console.log('Supabase no configurado, progreso no guardado');
      return;
    }

    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      console.error('No hay usuario logeado. No se puede guardar el progreso.');
      return;
    }

    const aciertos = resultadosFinales.filter(r => r.acierto).length;
    const errores = resultadosFinales.filter(r => !r.acierto).length;
    const total = resultadosFinales.length;
    const porcentaje = total > 0 ? Math.round((aciertos / total) * 100) : 0;

    const { error } = await sb.from('progreso_simulacros').insert({
      user_id: session.user.id,
      area: areaActual.nombre,
      tipo: 'diagnostico',
      aciertos: aciertos,
      errores: errores,
      total_preguntas: total,
      porcentaje: porcentaje,
      fecha: new Date().toISOString(),
    });

    if (error) {
      console.error('Error guardando progreso del diagnóstico:', error);
    } else {
      console.log('¡Progreso guardado exitosamente!');
    }
  };

  if (pantalla === 'bienvenida') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4">
        <div className="flex flex-col items-center justify-center min-h-[85vh]">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#D4AF37] mb-6">
            <span className="text-5xl">🎯</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-3 text-center">
            Examen Diagnóstico
          </h1>
          <p className="text-gray-300 text-center mb-8 max-w-md">
            Evaluaremos tus conocimientos en las {totalMaterias} materias de {areaActual?.nombre} con una pregunta rápida de cada una.
          </p>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-sm border border-[#D4AF37]/30">
            <h2 className="font-semibold text-lg mb-4 text-[#D4AF37]">¿Qué evaluarás?</h2>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li>• {totalMaterias} preguntas (una por materia)</li>
              <li>• Sin límite de tiempo</li>
              <li>• Retroalimentación en cada pregunta</li>
              <li>• Plan de estudio personalizado</li>
            </ul>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 w-full text-left">
              <label className="block text-[#D4AF37] font-semibold mb-2">Selecciona tu Área de Ingreso:</label>
              <select
                value={areaSeleccionada}
                onChange={(e) => setAreaSeleccionada(e.target.value as AreaKey)}
                className="w-full bg-[#001a3d] border border-[#D4AF37]/50 text-white rounded-lg p-3 outline-none focus:border-[#D4AF37] transition appearance-none"
              >
                <option value="area1">Área 1: Físico-Matemáticas</option>
                <option value="area2">Área 2: Biológicas y de la Salud</option>
                <option value="area3">Área 3: Ciencias Sociales</option>
                <option value="area4">Área 4: Humanidades y Artes</option>
              </select>
            </div>
            <button
              onClick={iniciarDiagnostico}
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
            >
              Comenzar Diagnóstico
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
            <p className="text-gray-300 mb-6">{errorApi}<br /><br />(Suele ocurrir al responder muy rápido).</p>
            <button
              onClick={() => fetchPregunta(materiasDelArea[indiceMateria]?.id)}
              className="bg-[#D4AF37] text-[#002B5C] px-6 py-3 rounded-xl font-bold hover:bg-[#e5c349] transition"
            >
              Reintentar Pregunta
            </button>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-xl text-[#D4AF37] font-semibold">Preparando siguiente materia...</p>
            <p className="text-gray-400 mt-2">
              {indiceMateria + 1} de {totalMaterias}
            </p>
          </>
        )}
      </div>
    );
  }

  if (pantalla === 'retroalimentacion' && pregunta) {
    // PARCHE DE SEGURIDAD 4: Fallback de UI
    const materiaActualObj = materiasDelArea[indiceMateria] || materiasDelArea[0];

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
        <div className={`rounded-2xl p-6 mb-6 ${fueCorrecta
            ? 'bg-green-500/20 border border-green-500/50'
            : 'bg-yellow-500/20 border border-yellow-500/50'
          }`}>
          <div className={`flex items-center gap-3 font-bold text-xl mb-4 ${fueCorrecta ? 'text-green-400' : 'text-yellow-400'
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
            <strong className="text-white">Materia:</strong> {materiaActualObj?.nombre || 'Desconocida'}
          </p>
          {!fueCorrecta && (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-white font-medium mb-2">Tu respuesta:</p>
              <MathMarkdown content={pregunta.opciones.find(o => o !== pregunta.respuestaCorrecta) || ''} className="text-red-300" />
            </div>
          )}
          <div className="bg-green-500/10 rounded-xl p-4 mb-4">
            <p className="text-green-400 font-medium mb-2">Respuesta correcta:</p>
            <MathMarkdown content={pregunta.respuestaCorrecta} className="text-green-300" />
          </div>
          <div className="bg-[#002B5C]/50 rounded-xl p-4">
            <p className="text-[#D4AF37] font-semibold mb-2">
              {fueCorrecta ? '💡 Explicación y Fórmula:' : '📖 Explicación Pedagógica:'}
            </p>
            <MathMarkdown 
              content={fueCorrecta ? pregunta.explicacionCorrecta : pregunta.justificacionDescarte} 
              className="text-gray-300 text-sm leading-relaxed" 
            />
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
            Tómate tu tiempo para leer la explicación
          </p>
        </div>
      </div>
    );
  }

  if (pantalla === 'resultados') {
    const aciertosTotales = resultados.filter((r) => r.acierto).length;
    const erroresTotales = resultados.filter((r) => !r.acierto).length;
    const porcentaje = totalMaterias > 0 ? Math.round((aciertosTotales / totalMaterias) * 100) : 0;
    const materiasDebiles = resultados.filter((r) => !r.acierto).map((r) => r.materia);

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4AF37] mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Resultados del Diagnóstico</h1>
            <p className="text-gray-400">{areaActual?.nombre}</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 border border-[#D4AF37]/30 text-center">
            <div className="text-6xl font-bold text-[#D4AF37] mb-2">{porcentaje}%</div>
            <p className="text-gray-300">de efectividad</p>
            <div className="flex justify-center gap-8 mt-6">
              <div className="bg-green-500/20 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-green-400">{aciertosTotales}</div>
                <div className="text-sm text-green-300">Aciertos</div>
              </div>
              <div className="bg-red-500/20 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-red-400">{erroresTotales}</div>
                <div className="text-sm text-red-300">Errores</div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[#D4AF37] mb-4">Desglose por Materia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {resultados.map((resultado, index) => (
              <div
                key={index}
                className={`rounded-xl p-4 border ${resultado.acierto
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-red-500/20 border-red-500/50'
                  }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">{resultado.materia}</span>
                  <span className="text-xl">
                    {resultado.acierto ? '✓' : '✗'}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${resultado.acierto
                      ? 'bg-green-500/30 text-green-300'
                      : 'bg-red-500/30 text-red-300'
                    }`}
                >
                  {resultado.acierto ? 'Dominado' : 'Por repasar'}
                </span>
              </div>
            ))}
          </div>

          {materiasDebiles.length > 0 && (
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
                <span>📚</span> Plan de Estudio Sugerido
              </h3>
              <p className="text-gray-300 mb-3">
                Dedica el doble de tiempo a repasar las siguientes materias:
              </p>
              <div className="flex flex-wrap gap-2">
                {materiasDebiles.map((materia, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full text-red-300 font-medium"
                  >
                    {materia}
                  </span>
                ))}
              </div>
            </div>
          )}

          {materiasDebiles.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-6 text-center">
              <span className="text-4xl mb-2 block">🎉</span>
              <p className="text-green-300 font-semibold text-lg">
                ¡Excelente! Dominaste todas las materias
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/simulador"
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg text-center hover:bg-[#e5c349] transition"
            >
              Practicar con Simulador
            </Link>
            <button
              onClick={iniciarDiagnostico}
              className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition"
            >
              Repetir Diagnóstico
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

  // PARCHE DE SEGURIDAD 5: Fallback de UI
  const materiaActualObj = materiasDelArea[indiceMateria] || materiasDelArea[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-[#D4AF37] font-medium">
          {materiaActualObj?.nombre || 'Desconocida'}
        </span>
        <span className="text-sm text-gray-400">
          {indiceMateria + 1} de {totalMaterias}
        </span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-1 mb-6">
        <div
          className="bg-[#D4AF37] h-1 rounded-full transition-all duration-500"
          style={{ width: `${totalMaterias > 0 ? ((indiceMateria + 1) / totalMaterias) * 100 : 0}%` }}
        />
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
        <MathMarkdown content={pregunta.pregunta} className="text-lg font-medium text-white leading-relaxed" />
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