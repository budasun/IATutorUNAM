'use client';

export interface Concepto {
  termino: string;
  definicion: string;
  ejemplo?: string;
}

interface TablaConceptosProps {
  conceptos: Concepto[];
  titulo?: string;
}

export default function TablaConceptos({ conceptos, titulo }: TablaConceptosProps) {
  return (
    <div className="w-full">
      {titulo && (
        <h2 className="text-xl font-bold text-[#002B5C] mb-4">{titulo}</h2>
      )}

      <div className="block lg:hidden space-y-3">
        {conceptos.map((concepto, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="bg-[#002B5C] px-4 py-2">
              <h3 className="font-semibold text-white text-sm">{concepto.termino}</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 text-sm">{concepto.definicion}</p>
              {concepto.ejemplo && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-[#D4AF37] font-medium">Ejemplo:</p>
                  <p className="text-xs text-gray-600 italic">{concepto.ejemplo}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          <thead className="bg-[#002B5C]">
            <tr>
              <th className="px-4 py-3 text-left text-white font-semibold text-sm w-1/3">
                Término
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold text-sm w-1/2">
                Definición
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold text-sm w-1/6">
                Ejemplo
              </th>
            </tr>
          </thead>
          <tbody>
            {conceptos.map((concepto, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="px-4 py-3 text-[#002B5C] font-medium text-sm border-b border-gray-100">
                  {concepto.termino}
                </td>
                <td className="px-4 py-3 text-gray-700 text-sm border-b border-gray-100">
                  {concepto.definicion}
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm border-b border-gray-100 italic">
                  {concepto.ejemplo || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}