'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import InstallPWA from '@/components/InstallPWA';

const materias = [
  "Historia",
  "Literatura",
  "Geografía",
  "Filosofía",
  "Psicología",
  "Sociología",
  "Ética",
  "Economía",
];

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {!loading && (
          <div className="mb-6">
            {session ? (
              <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sesión activa</p>
                    <p className="text-sm text-white truncate max-w-[200px]">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-400 hover:text-red-400 transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block w-full bg-[#D4AF37] text-[#002B5C] py-3 rounded-xl font-bold text-center hover:bg-[#e5c349] transition"
              >
                Iniciar Sesión / Registrarse
              </Link>
            )}
          </div>
        )}

        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4AF37] mb-6">
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-3">
            ¡Bienvenido, futuro Puma!
          </h1>
          <p className="text-lg text-gray-300">
            Prepárate para el examen de Área 3 (Ciencias Sociales) con inteligencia artificial
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#D4AF37] mb-6 text-center">Elige tu modalidad</h2>
          <div className="flex flex-col gap-4">
            <Link
              href="/diagnostico"
              className="group bg-gradient-to-r from-[#D4AF37] to-[#c9a432] hover:from-[#e5c349] hover:to-[#D4AF37] rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#D4AF37]/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🎯</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#002B5C] mb-1">Examen Diagnóstico</h3>
                  <p className="text-[#002B5C]/80 text-sm">
                    Prueba rápida de 9 materias para detectar debilidades
                  </p>
                </div>
                <span className="text-2xl text-[#002B5C]">→</span>
              </div>
            </Link>

            <Link
              href="/simulador"
              className="group bg-gradient-to-r from-[#002B5C] to-[#003d7a] hover:from-[#003d7a] hover:to-[#004a94] border-2 border-[#D4AF37] rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#002B5C]/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🏆</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">Mega-Simulacro 120</h3>
                  <p className="text-gray-300 text-sm">
                    Examen completo con estructura oficial UNAM (3 horas)
                  </p>
                </div>
                <span className="text-2xl text-[#D4AF37]">→</span>
              </div>
            </Link>

            <Link href="/temario" className="block bg-white/5 border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">📚</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">Temario y Guías</h3>
                  <p className="text-gray-400 text-sm">
                    Consulta los temas oficiales de Área 3
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {materias.map((materia) => (
                  <span
                    key={materia}
                    className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-white/20"
                  >
                    {materia}
                  </span>
                ))}
              </div>
            </Link>

            <Link href="/debilidades" className="block bg-white/5 border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🎯</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">Entrenar Debilidades</h3>
                  <p className="text-gray-400 text-sm">
                    Repasa las preguntas que fallaste en simulacros
                  </p>
                </div>
                <span className="text-2xl text-[#D4AF37]">→</span>
              </div>
            </Link>
          </div>
        </section>

        <Link href="/progreso" className="block bg-[#002B5C]/30 border border-[#D4AF37]/20 rounded-2xl p-8 text-center hover:bg-[#002B5C]/50 transition">
          <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold text-[#D4AF37] mb-2">Mi Progreso</h2>
          <p className="text-gray-400">
            Consulta tus estadísticas y historial de exámenes
          </p>
        </Link>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Tutor IA UNAM © 2026</p>
          <p className="mt-1 text-xs">Potenciado por Grok AI</p>
        </footer>

        <InstallPWA />
      </div>
    </div>
  );
}
