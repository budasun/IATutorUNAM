'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';

type ModoAuth = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<ModoAuth>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase no está configurado. Contacta al administrador.');
      setLoading(false);
      return;
    }

    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const alternarModo = () => {
    setModo(modo === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37] mb-4">
            <span className="text-3xl">🎓</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#D4AF37]">IA Tutor UNAM</h1>
          <p className="text-gray-400 mt-2">Portal de Aspirantes</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-[#D4AF37]/30">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                <p className="text-green-300 text-sm text-center">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#002B5C] py-4 rounded-xl font-bold text-lg hover:bg-[#e5c349] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : modo === 'login' ? (
                'Iniciar Sesión'
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={alternarModo}
              className="text-gray-400 hover:text-[#D4AF37] transition text-sm"
            >
              {modo === 'login'
                ? '¿No tienes cuenta? Crea una aquí'
                : '¿Ya tienes cuenta? Inicia sesión aquí'}
            </button>
          </div>
        </div>

        <Link
          href="/"
          className="block text-center mt-6 text-gray-400 hover:text-[#D4AF37] transition"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
