'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TEMARIO_UNAM } from '@/data/unam_temario';
import { PreguntaGenerada } from '@/types/ia';

type Pantalla = 'bienvenida' | 'cargando' | 'examen' | 'resultados';

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
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);

  const totalMaterias = TEMARIO_UNAM.materias.length;

  const fetchPregunta = useCallback(async (materiaId: string) => {
    setLoading(true);
    setRespuestaSeleccionada(null);
    try {
      const res = await fetch('/api/generar-pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_materia: materiaId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPregunta(data.data);
        setPantalla('examen');
      } else {
        console.error('Error de API:', data.error);
      }
    } catch (error) {
      console.error('Error obteniendo pregunta:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const iniciarDiagnostico = () => {
    setIndiceMateria(0);
    setResultados([]);
    setPantalla('cargando');
    fetchPregunta(TEMARIO_UNAM.materias[0].id);
  };

  const handleRespuesta = (opcion: string) => {
    if (respuestaSeleccionada || !pregunta) return;

    setRespuestaSeleccionada(opcion);
    const materiaActual = TEMARIO_UNAM.materias[indiceMateria];
    const fueCorrecto = opcion === pregunta.respuestaCorrecta;

    const nuevoResultado: Resultado = {
      materia: materiaActual.nombre,
      acierto: fueCorrecto,
    };

    setResultados((prev) => [...prev, nuevoResultado]);

    setTimeout(() => {
      const siguienteIndice = indiceMateria + 1;
      if (siguienteIndice >= totalMaterias) {
        setPantalla('resultados');
      } else {
        setIndiceMateria(siguienteIndice);
        setPantalla('cargando');
        fetchPregunta(TEMARIO_UNAM.materias[siguienteIndice].id);
      }
    }, 800);
  };

  if (pantalla === 'bienvenida') {
    const materiasDebiles = resultados.filter((r) => !r.acierto);
    const porcentaje = Math.round(
      (resultados.filter((r) => r.acierto).length / Math.max(resultados.length, 1)) * 100
    );

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
            Evaluaremos tus conocimientos en las 9 materias del Área 3 con una pregunta rápida de cada una.
          </p>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-sm border border-[#D4AF37]/30">
            <h2 className="font-semibold text-lg mb-4 text-[#D4AF37]">¿Qué evaluarás?</h2>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li>• 9 preguntas (una por materia)</li>
              <li>• Sin límite de tiempo</li>
              <li>• Sin retroalimentación inmediata</li>
              <li>• Plan de estudio personalizado</li>
            </ul>
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

  if (pantalla === 'cargando') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col items-center justify-center">
        <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-xl text-[#D4AF37] font-semibold">Preparando siguiente materia...</p>
        <p className="text-gray-400 mt-2">
          {indiceMateria + 1} de {totalMaterias}
        </p>
      </div>
    );
  }

  if (pantalla === 'resultados') {
    const aciertosTotales = resultados.filter((r) => r.acierto).length;
    const erroresTotales = resultados.filter((r) => !r.acierto).length;
    const porcentaje = Math.round((aciertosTotales / totalMaterias) * 100);
    const materiasDebiles = resultados.filter((r) => !r.acierto).map((r) => r.materia);

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4AF37] mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Resultados del Diagnóstico</h1>
            <p className="text-gray-400">Área 3: Ciencias Sociales</p>
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
                className={`rounded-xl p-4 border ${
                  resultado.acierto
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-red-500/20 border-red-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{resultado.materia}</span>
                  <span className="text-xl">
                    {resultado.acierto ? '✓' : '✗'}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    resultado.acierto
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

  const materiaActual = TEMARIO_UNAM.materias[indiceMateria];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-[#D4AF37] font-medium">
          {materiaActual.nombre}
        </span>
        <span className="text-sm text-gray-400">
          {indiceMateria + 1} de {totalMaterias}
        </span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-1 mb-6">
        <div
          className="bg-[#D4AF37] h-1 rounded-full transition-all duration-500"
          style={{ width: `${((indiceMateria + 1) / totalMaterias) * 100}%` }}
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
