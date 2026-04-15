'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { TEMARIO_UNAM } from '@/data/unam_temario';
import { PreguntaGenerada } from '@/types/ia';
import MathMarkdown from '@/components/MathMarkdown';

type EstadoExamen = 'configuracion' | 'cargando' | 'activo' | 'retroalimentacion' | 'finalizado' | 'recuperacion';
type AreaKey = keyof typeof TEMARIO_UNAM;

const STORAGE_KEY = 'ia_tutor_simulador_save';
const TIEMPO_EXAMEN = 3 * 60 * 60;

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
  const [bufferPreguntas, setBufferPreguntas] = useState<PreguntaGenerada[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<AreaKey>('area3');
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);
  const [temasUsados, setTemasUsados] = useState<Record<string, string[]>>({});
  const [timeoutCarga, setTimeoutCarga] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchActivo = useRef(false);

  // PROTECCIÓN 1: Evitar que el área sea undefined
  const areaActual = TEMARIO_UNAM[areaSeleccionada] || TEMARIO_UNAM['area3'];
  const materiasDelArea = areaActual?.materias || [];
  const ESTRUCTURA_EXAMEN = materiasDelArea.map(m => ({ id: m.id, cantidad: m.preguntas }));
  const TOTAL_PREGUNTAS = ESTRUCTURA_EXAMEN.reduce((acc, item) => acc + item.cantidad, 0);

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      setEstado('recuperacion');
    }
  }, []);

  // PROTECCIÓN 2: Guardar también el área seleccionada en la memoria
  useEffect(() => {
    if (estado === 'configuracion' || estado === 'recuperacion' || estado === 'finalizado') return;
    const bufferLimitado = bufferPreguntas.slice(0, 2);
    const saveData = {
      estado, pausado, pregunta, tiempoRestante, aciertos, errores,
      preguntaActualGlobal, materiaActualIndex, preguntasRespondidasDeMateriaActual,
      resultadosPorMateria, bufferPreguntas: bufferLimitado, areaSeleccionada, respuestaSeleccionada
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        const saveDataMinimo = {
          estado, pausado, pregunta: null, tiempoRestante, aciertos, errores,
          preguntaActualGlobal, materiaActualIndex, preguntasRespondidasDeMateriaActual,
          resultadosPorMateria, bufferPreguntas: [], areaSeleccionada, respuestaSeleccionada: null
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saveDataMinimo));
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [estado, pausado, pregunta, tiempoRestante, aciertos, errores, preguntaActualGlobal, materiaActualIndex, preguntasRespondidasDeMateriaActual, resultadosPorMateria, bufferPreguntas, areaSeleccionada, respuestaSeleccionada]);

  const restaurarSesion = () => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      const data = JSON.parse(guardado);
      
      let estadoRecuperado = data.estado || 'activo';
      
      if (estadoRecuperado === 'cargando' && data.pregunta) {
        estadoRecuperado = 'activo';
      }

      setAreaSeleccionada(data.areaSeleccionada || 'area3');
      setEstado(estadoRecuperado);
      setPausado(data.pausado ?? false);
      setPregunta(data.pregunta || null);
      setTiempoRestante(data.tiempoRestante || TIEMPO_EXAMEN);
      setAciertos(data.aciertos || 0);
      setErrores(data.errores || 0);
      setPreguntaActualGlobal(data.preguntaActualGlobal || 1);
      setMateriaActualIndex(data.materiaActualIndex || 0);
      setPreguntasRespondidasDeMateriaActual(data.preguntasRespondidasDeMateriaActual || 0);
      setResultadosPorMateria(data.resultadosPorMateria || inicializarResultadosPorMateria());
      setBufferPreguntas(data.bufferPreguntas || []);
      setRespuestaSeleccionada(data.respuestaSeleccionada || null);
    }
  };

  const descartarSesion = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEstado('configuracion');
  };

  // PROTECCIÓN 3: Extracción segura de nombres para evitar colapso de React
  const materiaActual = ESTRUCTURA_EXAMEN[materiaActualIndex] || ESTRUCTURA_EXAMEN[0];
  const materiaObj = materiasDelArea.find(m => m.id === materiaActual?.id);
  const nombreMateriaActual = materiaObj?.nombre || 'Materia Desconocida';

  const inicializarResultadosPorMateria = () => {
    const resultados: Record<string, ResultadoMateria> = {};
    ESTRUCTURA_EXAMEN.forEach(item => {
      resultados[item.id] = { aciertos: 0, errores: 0, total: item.cantidad };
    });
    return resultados;
  };

  // PROTECCIÓN 4: Agregamos areaActual.nombre a las dependencias
  const obtenerPregunta = useCallback(async (materiaId: string) => {
    if (fetchActivo.current) return;
    fetchActivo.current = true;
    
    setLoading(true);
    setErrorApi(null);
    setTimeoutCarga(false);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTimeoutCarga(true);
      setLoading(false);
    }, 60000);

    if (bufferPreguntas.length > 0) {
      const siguiente = bufferPreguntas[0];
      setBufferPreguntas(prev => prev.slice(1));
      setPregunta(siguiente);
      setEstado('activo');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
      fetchActivo.current = false; // Liberar el lock porque no entra al finally
      return;
    }

    try {
      const temasExcluidos = temasUsados[materiaId] || [];
      const res = await fetch('/api/generar-pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_materia: materiaId,
          area: areaActual.nombre,
          temas_excluidos: temasExcluidos
        }),
      });
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        const preguntasNuevas: PreguntaGenerada[] = data.data;
        const nuevaPreg = preguntasNuevas[0];
        setPregunta(nuevaPreg);
        setBufferPreguntas(preguntasNuevas.slice(1, 3));
        
        // Registrar tema usado
        if (nuevaPreg.tema_usado) {
          const temasPrev = temasUsados[materiaId] || [];
          setTemasUsados({
            ...temasUsados,
            [materiaId]: [...temasPrev, nuevaPreg.tema_usado]
          });
        }
        
        setEstado('activo');
      } else {
        setErrorApi(data.error || 'La IA está saturada por peticiones rápidas.');
      }
    } catch (error) {
      setErrorApi('Error de conexión. Revisa tu internet.');
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (!timeoutCarga) {
        setLoading(false);
      }
      fetchActivo.current = false;
    }
  }, [bufferPreguntas, areaActual.nombre, temasUsados]);

  const iniciarExamen = () => {
    setBufferPreguntas([]);
    setAciertos(0);
    setErrores(0);
    setPreguntaActualGlobal(1);
    setMateriaActualIndex(0);
    setPreguntasRespondidasDeMateriaActual(0);
    setTiempoRestante(TIEMPO_EXAMEN);
    setPausado(false);
    setResultadosPorMateria(inicializarResultadosPorMateria());
    setRespuestaSeleccionada(null);
    setTemasUsados({});
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
    if (estado !== 'activo' || !pregunta) return;

    const materiasArea = TEMARIO_UNAM[areaSeleccionada]?.materias || [];
    const materiaActualObjLocal = materiasArea[materiaActualIndex] || materiasArea[0];
    const materiaIdLocal = materiaActualObjLocal?.id || '';
    const nombreMateriaLocal = materiaActualObjLocal?.nombre || 'Materia Desconocida';
    const nombreAreaLocal = areaActual?.nombre || 'Área Desconocida';

    const esCorrecta = opcion === pregunta.respuestaCorrecta;

    if (!esCorrecta && pregunta) {
      registrarErrorEnBanco(pregunta, nombreMateriaLocal, nombreAreaLocal);
    }

    setRespuestaSeleccionada(opcion);
    setFueCorrecta(esCorrecta);

    // PROTECCIÓN 5: Optional chaining en la suma de resultados
    if (esCorrecta) {
      setAciertos((prev) => prev + 1);
      setResultadosPorMateria(prev => ({
        ...prev,
        [materiaIdLocal]: { ...prev[materiaIdLocal], aciertos: (prev[materiaIdLocal]?.aciertos || 0) + 1 }
      }));
    } else {
      setErrores((prev) => prev + 1);
      setResultadosPorMateria(prev => ({
        ...prev,
        [materiaIdLocal]: { ...prev[materiaIdLocal], errores: (prev[materiaIdLocal]?.errores || 0) + 1 }
      }));
    }

    setPausado(true);
    setEstado('retroalimentacion');
  };

  const avanzarSiguientePregunta = () => {
    setEstado('cargando');
    setRespuestaSeleccionada(null);

    const nuevasRespondidas = preguntasRespondidasDeMateriaActual + 1;
    let siguienteMateriaIndex = materiaActualIndex;
    let buscarSiguienteMateria = false;

    if (nuevasRespondidas >= ESTRUCTURA_EXAMEN[materiaActualIndex].cantidad) {
      siguienteMateriaIndex = materiaActualIndex + 1;
      buscarSiguienteMateria = true;
    }

    const nuevaGlobal = preguntaActualGlobal + 1;

    if (nuevaGlobal > TOTAL_PREGUNTAS) {
      setEstado('finalizado');
      return;
    }

    setPreguntaActualGlobal(nuevaGlobal);
    setMateriaActualIndex(siguienteMateriaIndex);

    if (buscarSiguienteMateria) {
      setPreguntasRespondidasDeMateriaActual(0);
      setBufferPreguntas([]); // Purgar el buffer
      obtenerPregunta(ESTRUCTURA_EXAMEN[siguienteMateriaIndex].id);
    } else {
      setPreguntasRespondidasDeMateriaActual(nuevasRespondidas);
      obtenerPregunta(ESTRUCTURA_EXAMEN[materiaActualIndex].id);
    }
  };

  const continuarDespuesRetroalimentacion = () => {
    setPausado(false);
    avanzarSiguientePregunta();
  };

  const guardarProgreso = async () => {
    const sb = getSupabase();
    if (!sb) return;

    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    const porcentaje = TOTAL_PREGUNTAS > 0 ? Math.round((aciertos / TOTAL_PREGUNTAS) * 100) : 0;

    await sb.from('progreso_simulacros').insert({
      user_id: session.user.id,
      area: areaActual.nombre,
      tipo: 'simulador',
      aciertos,
      errores,
      total_preguntas: TOTAL_PREGUNTAS,
      porcentaje,
      fecha: new Date().toISOString(),
    });

    localStorage.removeItem(STORAGE_KEY);
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
          <p className="text-gray-300 text-center mb-8">{areaActual.nombre}</p>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-md border border-[#D4AF37]/30 mb-6">
            <h2 className="font-semibold text-lg mb-4 text-[#D4AF37] text-center">Estructura del Examen</h2>
            <div className="space-y-2 text-sm">
              {ESTRUCTURA_EXAMEN.map((item) => {
                const materia = materiasDelArea.find(m => m.id === item.id);
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
              <li className="flex items-center gap-2"><span>⏱️</span> 3 horas de duración</li>
              <li className="flex items-center gap-2"><span>📋</span> {TOTAL_PREGUNTAS} preguntas de opción múltiple</li>
              <li className="flex items-center gap-2"><span>🎯</span> Retroalimentación al instante</li>
              <li className="flex items-center gap-2"><span>📊</span> Resultados detallados por materia</li>
            </ul>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 w-full text-left">
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
              onClick={iniciarExamen}
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
            >
              Comenzar Simulacro
            </button>
          </div>

          <Link href="/" className="mt-6 text-gray-400 hover:text-[#D4AF37] transition">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (estado === 'recuperacion') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#D4AF37] mb-6">
              <span className="text-5xl">⏸️</span>
            </div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-3">Tienes un Mega-Simulacro en pausa</h1>
            <p className="text-gray-300">¿Quieres continuar donde lo dejaste?</p>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={restaurarSesion}
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
            >
              Continuar examen
            </button>
            <button
              onClick={descartarSesion}
              className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition"
            >
              Descartar y empezar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || errorApi || timeoutCarga) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center">
        {errorApi ? (
          <div className="text-center bg-red-500/10 p-6 rounded-2xl border border-red-500/30 max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl text-red-400 font-bold mb-2">Pausa técnica</h2>
            <p className="text-gray-300 mb-6">{errorApi}<br /><br />(Suele ocurrir al responder muy rápido).</p>
            <button
              onClick={() => obtenerPregunta(ESTRUCTURA_EXAMEN[materiaActualIndex].id)}
              className="bg-[#D4AF37] text-[#002B5C] px-6 py-3 rounded-xl font-bold hover:bg-[#e5c349] transition"
            >
              Reintentar Pregunta
            </button>
          </div>
        ) : timeoutCarga ? (
          <div className="text-center bg-yellow-500/10 p-6 rounded-2xl border border-yellow-500/30 max-w-md">
            <div className="text-4xl mb-4">⏱️</div>
            <h2 className="text-xl text-yellow-400 font-bold mb-2">Tiempo de espera agotado</h2>
            <p className="text-gray-300 mb-6">La conexión está tardando más de lo normal. ¿Deseas reintentar?</p>
            <button
              onClick={() => obtenerPregunta(ESTRUCTURA_EXAMEN[materiaActualIndex].id)}
              className="bg-[#D4AF37] text-[#002B5C] px-6 py-3 rounded-xl font-bold hover:bg-[#e5c349] transition"
            >
              Reintentar conexión
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
    const explicacionCompleta = pregunta.explicacion || '';
    const regexAnalisis = /(?:###\s*)?(?:🔍|\\?\(?\s*\\[a-zA-Z]+\s*\\?\)?\s*)?An[aá]lisis de Distractores/i;
    const regexTip = /(?:###\s*)?(?:💡|\\?\(?\s*\\[a-zA-Z]+\s*\\?\)?\s*)?Tip Pro/i;

    let conceptoClave = explicacionCompleta;
    conceptoClave = conceptoClave.replace(/(?:###\s*)?(?:✅|\\?\(?\s*\\checkmark\s*\\?\)?\s*)?El Concepto Clave\s*:?\s*/i, '').trim();
    let analisis = '';
    let tip = '';

    if (regexAnalisis.test(explicacionCompleta)) {
      const partes = explicacionCompleta.split(regexAnalisis);
      conceptoClave = partes[0].replace(/(?:###\s*)?(?:✅|\\?\(?\s*\\checkmark\s*\\?\)?\s*)?El Concepto Clave/i, '').trim();
      const resto = partes[1];
      
      if (regexTip.test(resto)) {
        const partesTip = resto.split(regexTip);
        analisis = partesTip[0];
        tip = partesTip[1];
      } else {
        analisis = resto;
      }
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
        <span className="hidden">{nombreMateriaActual}</span>
        <div className="bg-[#002B5C] border border-white/10 rounded-xl p-5 mb-6 shadow-md">
          <p className="text-[#D4AF37] text-xs font-semibold mb-2 uppercase tracking-wide">Pregunta</p>
          <MathMarkdown content={pregunta.pregunta} className="text-lg font-medium text-white leading-relaxed" />
        </div>
        <div className={`rounded-2xl p-6 mb-6 ${fueCorrecta ? 'bg-green-500/20 border border-green-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'
          }`}>
          <div className={`flex items-center gap-3 font-bold text-xl mb-4 ${fueCorrecta ? 'text-green-400' : 'text-yellow-400'
            }`}>
            {fueCorrecta ? '¡Excelente! Respuesta Correcta' : 'Respuesta Incorrecta'}
          </div>
          <p className="text-gray-300 text-sm mb-3">
            <strong className="text-white">Materia:</strong> {nombreMateriaActual}
          </p>
          {!fueCorrecta && (
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-white font-medium mb-2">Tu respuesta:</p>
              <MathMarkdown content={respuestaSeleccionada || ''} className="text-white font-bold" />
            </div>
          )}
          <div className="bg-green-500/10 rounded-xl p-4 mb-4">
            <p className="text-green-400 font-medium mb-2">Respuesta correcta:</p>
            <MathMarkdown content={pregunta.respuestaCorrecta} className="text-green-300" />
          </div>
          <div className="bg-[#002B5C]/50 rounded-xl p-4">
            <p className="text-[#D4AF37] font-semibold mb-3">📖 Explicación Completa</p>
            
            <MathMarkdown content={conceptoClave} className="text-gray-300 text-sm leading-relaxed mb-4" />
            
            {analisis && (
              <details className="group mb-4 bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                <summary className="cursor-pointer p-4 font-semibold text-blue-300 list-none flex justify-between items-center hover:bg-white/5 transition">
                  <span className="flex items-center gap-2">🔍 Ver Análisis de Errores Comunes</span>
                  <span className="group-open:rotate-180 transition-transform duration-300">▼</span>
                </summary>
                <div className="p-4 pt-0">
                  <MathMarkdown content={analisis} className="text-gray-300 text-sm leading-relaxed" />
                </div>
              </details>
            )}

            {tip && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <MathMarkdown content={`### 💡 Tip Pro\n${tip}`} className="text-[#D4AF37] text-sm leading-relaxed" />
              </div>
            )}
          </div>
        </div>
        <div className="mt-auto">
          <button
            onClick={continuarDespuesRetroalimentacion}
            className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition"
          >
            Entendido, continuar →
          </button>
          <p className="text-center text-gray-500 text-sm mt-3">⏱️ Reloj pausado</p>
        </div>
      </div>
    );
  }

  if (estado === 'finalizado') {
    const porcentajeTotal = TOTAL_PREGUNTAS > 0 ? Math.round((aciertos / TOTAL_PREGUNTAS) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4AF37] mb-4">
              <span className="text-4xl">🎓</span>
            </div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Resultados del Mega-Simulacro</h1>
            <p className="text-gray-400">{areaActual.nombre}</p>
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
              const materia = materiasDelArea.find(m => m.id === item.id);
              const resultado = resultadosPorMateria[item.id] || { aciertos: 0, errores: 0 };
              const porcentajeMateria = item.cantidad > 0 ? Math.round((resultado.aciertos / item.cantidad) * 100) : 0;
              const esDominado = porcentajeMateria >= 70;

              return (
                <div key={item.id} className={`rounded-xl p-4 border ${esDominado ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">{materia?.nombre || item.id}</span>
                    <span className={`text-sm font-bold ${esDominado ? 'text-green-400' : 'text-red-400'}`}>{porcentajeMateria}%</span>
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
            <Link href="/diagnostico" className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg text-center hover:bg-[#e5c349] transition">
              Hacer Nuevo Diagnóstico
            </Link>
            <button onClick={iniciarExamen} className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition">
              Repetir Mega-Simulacro
            </button>
            <Link href="/" className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-semibold text-center hover:bg-white/20 transition">
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
        <span className="text-sm text-gray-400">Pregunta {preguntaActualGlobal} de {TOTAL_PREGUNTAS}</span>
        <span className={`font-mono text-lg font-bold ${tiempoRestante < 300 ? 'text-red-400' : 'text-[#D4AF37]'}`}>
          {formatTime(tiempoRestante)}
        </span>
      </div>

      <div className="bg-[#D4AF37]/20 rounded-lg px-3 py-1 inline-block mb-4 self-start">
        <span className="text-sm text-[#D4AF37] font-medium">{nombreMateriaActual}</span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-1 mb-6">
        <div className="bg-[#D4AF37] h-1 rounded-full transition-all duration-300" style={{ width: `${(preguntaActualGlobal / TOTAL_PREGUNTAS) * 100}%` }} />
      </div>

      {pregunta.textoLectura && (
        <div className="bg-[#002B5C] border border-[#D4AF37]/30 rounded-2xl p-6 mb-6 shadow-lg shadow-[#001a3d]">
          <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2"><span>📖</span> Lectura</h3>
          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <MathMarkdown content={pregunta.textoLectura} className="text-gray-200 text-sm md:text-base leading-relaxed" />
          </div>
        </div>
      )}

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
            <MathMarkdown content={opcion} />
          </button>
        ))}
      </div>
    </div>
  );
}