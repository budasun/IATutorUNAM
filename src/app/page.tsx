import Link from "next/link";

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5C] via-[#001a3d] to-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
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
          <h2 className="text-xl font-semibold text-[#D4AF37] mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/simulador"
              className="group bg-[#002B5C] hover:bg-[#003d7a] border-2 border-[#D4AF37] rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#D4AF37]/20"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📝</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Iniciar Simulador</h3>
                  <p className="text-gray-300 text-sm">Pon a prueba tus conocimientos</p>
                </div>
              </div>
            </Link>

            <div className="bg-[#002B5C]/50 border border-[#D4AF37]/30 rounded-2xl p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📚</span>
                </div>
                <div className="w-full">
                  <h3 className="text-2xl font-bold text-white mb-3">Explorar Temario</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {materias.map((materia) => (
                      <span
                        key={materia}
                        className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded-full border border-[#D4AF37]/30"
                      >
                        {materia}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#002B5C]/30 border border-[#D4AF37]/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold text-[#D4AF37] mb-2">Mi Progreso</h2>
          <p className="text-gray-400">
            Toma tu primer simulacro para ver tus estadísticas aquí
          </p>
        </section>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>IA Tutor UNAM © 2026</p>
          <p className="mt-1 text-xs">Potenciado por Gemini AI</p>
        </footer>
      </div>
    </div>
  );
}
