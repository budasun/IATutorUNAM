'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TEMARIO_UNAM } from '@/data/unam_temario';

interface Guia {
  titulo: string;
  resumen: string;
  puntosClave: string[];
  ejemploPractico?: string;
}

export default function TemarioPage() {
  const [materiaActiva, setMateriaActiva] = useState<string | null>(null);
  const [temaSeleccionado, setTemaSeleccionado] = useState<string | null>(null);
  const [guia, setGuia] = useState<Guia | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [ejemplosExtras, setEjemplosExtras] = useState<string[]>([]);
  const [loadingEjemplo, setLoadingEjemplo] = useState(false);

  const generarGuia = async (materia: string, tema: string) => {
    setLoading(true);
    setErrorApi(null);
    setTemaSeleccionado(tema);
    setMateriaActiva(materia);

    try {
      const res = await fetch('/api/generar-guia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia, tema }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGuia(data.data);
      } else {
        setErrorApi(data.error || 'Error al generar la guía');
      }
    } catch (error) {
      setErrorApi('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const volverAlTemario = () => {
    setGuia(null);
    setTemaSeleccionado(null);
    setErrorApi(null);
    setEjemplosExtras([]);
  };

  const pedirOtroEjemplo = async () => {
    if (!materiaActiva || !temaSeleccionado) return;
    setLoadingEjemplo(true);
    try {
      const res = await fetch('/api/generar-ejemplo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia: materiaActiva, tema: temaSeleccionado }),
      });
      const data = await res.json();
      if (data.success && data.data?.ejemplo) {
        setEjemplosExtras(prev => [...prev, data.data.ejemplo]);
      }
    } catch (error) {
      console.error("Error pidiendo ejemplo:", error);
    } finally {
      setLoadingEjemplo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#D4AF37] font-medium">Generando tu guía de estudio...</p>
        </div>
      </div>
    );
  }

  if (guia && temaSeleccionado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 pb-24">
        <button
          onClick={volverAlTemario}
          className="text-gray-400 hover:text-[#D4AF37] transition mb-4 flex items-center gap-2"
        >
          ← Volver al temario
        </button>

        <h1 className="text-2xl font-bold text-[#D4AF37] mb-6">{guia.titulo}</h1>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 border border-[#D4AF37]/30">
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{guia.resumen}</p>
        </div>

        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
            💡 Puntos Clave para el examen
          </h2>
          <ul className="space-y-2">
            {guia.puntosClave.map((punto, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-300">
                <span className="text-[#D4AF37]">•</span>
                {punto}
              </li>
            ))}
          </ul>
        </div>

        {guia.ejemploPractico && (
          <div className="bg-[#002B5C] border border-[#D4AF37]/50 rounded-xl p-5 mt-6 shadow-lg shadow-[#D4AF37]/5">
            <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
              <span>📐</span> Fórmulas y Ejemplo Práctico
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line font-mono bg-black/30 p-4 rounded-lg">
              {guia.ejemploPractico}
            </p>
          </div>
        )}

        {ejemplosExtras.map((ej, index) => (
          <div key={index} className="bg-[#002B5C] border border-[#D4AF37]/50 rounded-xl p-5 mt-4 shadow-lg shadow-[#D4AF37]/5">
            <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
              <span>🔄</span> Ejemplo Adicional {index + 1}
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line font-mono bg-black/30 p-4 rounded-lg">
              {ej}
            </p>
          </div>
        ))}

        {(materiaActiva === 'Matemáticas' || materiaActiva === 'Física' || materiaActiva === 'Química') && guia?.ejemploPractico && (
          <button
            onClick={pedirOtroEjemplo}
            disabled={loadingEjemplo}
            className="mt-6 w-full bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] py-3 rounded-xl font-bold hover:bg-[#D4AF37]/10 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingEjemplo ? (
               <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            ) : '➕ Generar otro ejemplo'}
          </button>
        )}
      </div>
    );
  }

  if (errorApi) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 pb-24">
        <button
          onClick={volverAlTemario}
          className="text-gray-400 hover:text-[#D4AF37] transition mb-4 flex items-center gap-2"
        >
          ← Volver al temario
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <p className="text-red-400">{errorApi}</p>
          <button
            onClick={() => generarGuia(materiaActiva!, temaSeleccionado!)}
            className="mt-4 bg-[#D4AF37] text-black px-6 py-2 rounded-xl font-bold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 text-center">Temario Oficial UNAM</h1>

      <div className="grid gap-4">
        {TEMARIO_UNAM.materias.map((materia) => (
          <div key={materia.id} className="bg-white/10 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setMateriaActiva(materiaActiva === materia.id ? null : materia.id)}
              className="w-full p-4 flex justify-between items-center hover:bg-white/5 transition"
            >
              <span className="font-semibold">{materia.nombre}</span>
              <span className={`text-[#D4AF37] transition-transform ${materiaActiva === materia.id ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {materiaActiva === materia.id && materia.temas && (
              <div className="px-4 pb-4 flex flex-col gap-2">
                {materia.temas.map((tema, index) => (
                  <button
                    key={index}
                    onClick={() => generarGuia(materia.nombre, tema)}
                    className="text-left text-gray-300 hover:text-[#D4AF37] py-2 px-3 rounded-lg hover:bg-white/5 transition text-sm"
                  >
                    {tema}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-gray-400 hover:text-[#D4AF37] transition">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}