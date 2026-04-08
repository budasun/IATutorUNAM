'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { TEMARIO_UNAM } from '@/data/unam_temario';
import { PreguntaGenerada } from '@/types/ia';

type EstadoExamen = 'configuracion' | 'cargando' | 'activo' | 'finalizado';

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

export default function SimuladorPage() {
  const [estado, setEstado] = useState<EstadoExamen>('configuracion');
  const [pregunta, setPregunta] = useState<PreguntaGenerada | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_EXAMEN);
  const [aciertos, setAciertos] = useState(0);
  const [errores, setErrores] = useState(0);
  const [preguntaActualGlobal, setPreguntaActualGlobal] = useState(1);
  const [materiaActualIndex, setMateriaActualIndex] = useState(0);
  const [preguntasRespondidasDeMateriaActual, setPreguntasRespondidasDeMateriaActual] = useState(0);
  const [loading, setLoading] = useState(false);

  const materiaActual = ESTRUCTURA_EXAMEN[materiaActualIndex];
  const nombreMateriaActual = TEMARIO_UNAM.materias.find(m => m.id === materiaActual.id)?.nombre || materiaActual.id;

  const obtenerPregunta = useCallback(async (materiaId: string) => {
    setLoading(true);
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
    setPreguntaActualGlobal(1);
    setMateriaActualIndex(0);
    setPreguntasRespondidasDeMateriaActual(0);
    setTiempoRestante(TIEMPO_EXAMEN);
    setEstado('cargando');
    obtenerPregunta(ESTRUCTURA_EXAMEN[0].id);
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

  const handleRespuesta = (opcion: string) => {
    if (estado !== 'activo' || !pregunta) return;

    if (opcion === pregunta.respuestaCorrecta) {
      setAciertos((prev) => prev + 1);
    } else {
      setErrores((prev) => prev + 1);
    }

    const nuevasRespondidasDeMateria = preguntasRespondidasDeMateriaActual + 1;
    const nuevaPreguntaGlobal = preguntaActualGlobal + 1;

    let siguienteMateriaIndex: number | undefined;

    if (nuevasRespondidasDeMateria >= materiaActual.cantidad) {
      siguienteMateriaIndex = materiaActualIndex + 1;
      if (siguienteMateriaIndex >= ESTRUCTURA_EXAMEN.length) {
        setEstado('finalizado');
        return;
      }
      setMateriaActualIndex(siguienteMateriaIndex);
      setPreguntasRespondidasDeMateriaActual(0);
    } else {
      setPreguntasRespondidasDeMateriaActual(nuevasRespondidasDeMateria);
    }

    if (nuevaPreguntaGlobal > TOTAL_PREGUNTAS) {
      setEstado('finalizado');
      return;
    }

    setPreguntaActualGlobal(nuevaPreguntaGlobal);
    setEstado('cargando');
    const materiaParaSiguiente = siguienteMateriaIndex !== undefined 
      ? ESTRUCTURA_EXAMEN[siguienteMateriaIndex].id 
      : materiaActual.id;
    obtenerPregunta(materiaParaSiguiente);
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

  const calcularPorcentaje = (aciertos: number, total: number) => {
    return total > 0 ? Math.round((aciertos / total) * 100) : 0;
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
                <span>🎯</span> Sin retroalimentación inmediata
              </li>
              <li className="flex items-center gap-2">
                <span>📊</span> Resultados al finalizar
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-xl text-[#D4AF37] font-semibold">Generando pregunta...</p>
        <p className="text-gray-400 mt-2">
          {preguntaActualGlobal} de {TOTAL_PREGUNTAS}
        </p>
      </div>
    );
  }

  if (estado === 'finalizado') {
    const porcentajeTotal = calcularPorcentaje(aciertos, TOTAL_PREGUNTAS);
    
    const resultadosPorMateria = ESTRUCTURA_EXAMEN.map((item, index) => {
      const materia = TEMARIO_UNAM.materias.find(m => m.id === item.id);
      return {
        id: item.id,
        nombre: materia?.nombre || item.id,
        cantidad: item.cantidad,
      };
    });

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
            {resultadosPorMateria.map((materia) => (
              <div
                key={materia.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">{materia.nombre}</span>
                  <span className="text-[#D4AF37] font-bold">{materia.cantidad} preg.</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/diagnostico"
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg text-center hover:bg-[#e5c349] transition"
            >
              Hacer Diagnóstico
            </Link>
            <button
              onClick={() => setEstado('configuracion')}
              className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition"
            >
              Repetir Simulacro
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
