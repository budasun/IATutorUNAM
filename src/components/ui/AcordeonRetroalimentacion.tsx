'use client';

import { useState } from 'react';

export interface ExplicacionDescarte {
  opcion: string;
  esCorrecta: boolean;
  porQue: string;
}

interface AcordeonRetroalimentacionProps {
  explicaciones: ExplicacionDescarte[];
  titulo?: string;
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg 
      className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function AcordeonRetroalimentacion({ 
  explicaciones, 
  titulo = 'Revisa por qué fallaste' 
}: AcordeonRetroalimentacionProps) {
  const [indexExpandido, setIndexExpandido] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setIndexExpandido(indexExpandido === index ? null : index);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-[#002B5C] mb-4">{titulo}</h2>
      
      <div className="space-y-2">
        {explicaciones.map((item, index) => {
          const isExpanded = indexExpandido === index;
          const isCorrecta = item.esCorrecta;
          
          return (
            <div
              key={index}
              className={`rounded-lg border-2 overflow-hidden transition-all ${
                isCorrecta 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  {isCorrecta ? <CheckIcon /> : <XIcon />}
                  <span className={`font-medium text-sm ${
                    isCorrecta ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {item.opcion}
                  </span>
                </div>
                <ChevronIcon expanded={isExpanded} />
              </button>
              
              {isExpanded && (
                <div className={`px-4 pb-4 pt-0 ${
                  isCorrecta ? 'text-green-700' : 'text-red-700'
                }`}>
                  <div className="text-sm leading-relaxed">
                    {isCorrecta ? (
                      <p>✓ Esta es la respuesta correcta.</p>
                    ) : (
                      <p>✗ {item.porQue}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}