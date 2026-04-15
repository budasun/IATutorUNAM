export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#002B5C] text-white flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold text-[#D4AF37] mb-4">Sin Conexión</h1>
      <p className="text-gray-300 mb-8">Estás en modo offline, pero tus conocimientos están a salvo.</p>
      <a href="/temario" className="bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-3 rounded-xl font-bold hover:bg-[#D4AF37]/10 transition">
        Ir a mis Guías Guardadas
      </a>
    </div>
  );
}