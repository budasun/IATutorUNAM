'use client';

import { useState } from 'react';

export interface EventoHistorico {
  anio: string;
  titulo: string;
  descripcion: string;
}

interface LineaTiempoProps {
  eventos: EventoHistorico[];
  titulo?: string;
}

export default function LineaTiempo({ eventos, titulo }: LineaTiempoProps) {
  const [eventoExpandido, setEventoExpandido] = useState<number | null>(null);

  const toggleEvento = (index: number) => {
    setEventoExpandido(eventoExpandido === index ? null : index);
  };

  return (
    <div className="w-full">
      {titulo && (
        <h2 className="text-xl font-bold text-[#002B5C] mb-4">{titulo}</h2>
      )}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#D4AF37] md:left-1/2 md:-translate-x-px" />
        
        {eventos.map((evento, index) => (
          <div
            key={index}
            className={`relative pl-10 pb-6 md:pl-0 md:w-1/2 ${
              index % 2 === 0 
                ? 'md:pr-8 md:ml-auto md:text-right' 
                : 'md:pl-8 md:ml-0 md:text-left'
            }`}
          >
            <div 
              className={`absolute top-2 w-4 h-4 rounded-full bg-[#002B5C] border-2 border-white shadow-md z-10 ${
                index % 2 === 0 
                  ? 'left-2 md:left-auto md:right-0 md:-mr-2' 
                  : 'left-2 md:left-0 md:-ml-2'
              }`}
            />
            
            <button
              onClick={() => toggleEvento(index)}
              className={`w-full text-left p-3 rounded-lg transition ${
                eventoExpandido === index
                  ? 'bg-[#002B5C] text-white'
                  : 'bg-white shadow-md hover:shadow-lg border border-gray-200'
              }`}
            >
              <span className={`text-xs font-bold ${
                eventoExpandido === index ? 'text-[#D4AF37]' : 'text-[#002B5C]'
              }`}>
                {evento.anio}
              </span>
              <h3 className={`font-semibold text-sm ${
                eventoExpandido === index ? 'text-white' : 'text-gray-800'
              }`}>
                {evento.titulo}
              </h3>
              
              {eventoExpandido === index && (
                <p className="mt-2 text-sm opacity-90">{evento.descripcion}</p>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}