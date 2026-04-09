'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import Link from 'next/link';

import { Session } from '@supabase/supabase-js';

interface Simulacro {
  id: number;
  tipo: string;
  aciertos: number;
  errores: number;
  porcentaje: number;
  fecha: string;
}

export default function ProgresoPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [simulacros, setSimulacros] = useState<Simulacro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession) {
        const { data } = await supabase
          .from('progreso_simulacros')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .order('fecha', { ascending: false });

        setSimulacros(data || []);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const totalSimulacros = simulacros.length;
  const promedioEfectividad = totalSimulacros > 0
    ? Math.round(simulacros.reduce((acc, s) => acc + s.porcentaje, 0) / totalSimulacros)
    : 0;
  const mejorPuntuacion = totalSimulacros > 0
    ? Math.max(...simulacros.map(s => s.porcentaje))
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[#D4AF37] font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 pb-24 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-3">Inicia sesión para ver tu progreso</h2>
          <p className="text-gray-300 mb-6">
            Para acceder a tus analíticas y historial de exámenes, necesitas una cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#D4AF37] text-black font-bold py-3 px-6 rounded-lg hover:bg-[#b8962e] transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 text-center">Mi Progreso</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#001a3d]/80 backdrop-blur-sm rounded-xl p-5 border border-[#D4AF37]/30">
          <p className="text-gray-300 text-sm mb-1">Total Simulacros</p>
          <p className="text-4xl font-bold text-[#D4AF37]">{totalSimulacros}</p>
        </div>
        <div className="bg-[#001a3d]/80 backdrop-blur-sm rounded-xl p-5 border border-[#D4AF37]/30">
          <p className="text-gray-300 text-sm mb-1">Promedio Efectividad</p>
          <p className="text-4xl font-bold text-[#D4AF37]">{promedioEfectividad}%</p>
        </div>
        <div className="bg-[#001a3d]/80 backdrop-blur-sm rounded-xl p-5 border border-[#D4AF37]/30">
          <p className="text-gray-300 text-sm mb-1">Mejor Puntuación</p>
          <p className="text-4xl font-bold text-[#D4AF37]">{mejorPuntuacion}%</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 px-1">Historial de Exámenes</h2>

      {simulacros.length === 0 ? (
        <div className="text-center py-12 px-4 bg-[#001a3d]/40 rounded-xl border border-[#D4AF37]/20">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-300 mb-2">Aún no has realizado ningún examen.</p>
          <p className="text-gray-400 text-sm">
            ¡Ve a la pestaña de Inicio y toma tu primer simulacro!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {simulacros.map((sim) => (
            <div
              key={sim.id}
              className="bg-[#001a3d]/60 backdrop-blur-sm rounded-lg p-4 border border-[#D4AF37]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    sim.tipo === 'Diagnóstico' 
                      ? 'bg-purple-500/30 text-purple-200' 
                      : 'bg-blue-500/30 text-blue-200'
                  }`}>
                    {sim.tipo}
                  </span>
                  <span className="text-gray-400 text-sm">{formatDate(sim.fecha)}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">✓ {sim.aciertos}</span>
                  <span className="text-red-400">✗ {sim.errores}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${
                  sim.porcentaje >= 70 ? 'text-green-400' : sim.porcentaje >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {sim.porcentaje}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
