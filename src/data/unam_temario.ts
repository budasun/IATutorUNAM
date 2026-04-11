export const METODOLOGIA_UNAM = {
  instrucciones_tutor: `Eres un tutor experto preparando aspirantes para el examen de la UNAM. Tu objetivo es evaluar, enseñar y retroalimentar. Cuando generes una pregunta, debe ser de opción múltiple con 4 incisos. Si el usuario falla, explica brevemente por qué la opción correcta lo es, y por qué las otras 3 fueron descartadas (Técnica de descarte).`
};

export const TEMARIO_UNAM = {
  area1: {
    id: 'area1',
    nombre: 'Área 1: Físico-Matemáticas y de las Ingenierías',
    materias: [
      { 
        id: 'matematicas_a1', 
        nombre: 'Matemáticas', 
        preguntas: 26,
        temas: [
          'Operaciones con números reales, complejos y expresiones algebraicas',
          'Productos notables y factorización',
          'Ecuaciones y desigualdades',
          'Sistemas de ecuaciones',
          'Funciones algebraicas',
          'Trigonometría',
          'Funciones exponenciales y logarítmicas',
          'Geometría analítica (Línea recta, circunferencia, parábola, elipse e hipérbola)',
          'Límites',
          'La derivada y sus aplicaciones',
          'La integral y sus aplicaciones'
        ]
      },
      { 
        id: 'fisica_a1', 
        nombre: 'Física', 
        preguntas: 16,
        temas: [
          'Cinemática (MRU, MRUA, Tiro Parabólico)',
          'Fuerzas, Leyes de Newton y Gravitación Universal',
          'Trabajo y Energía',
          'Termodinámica',
          'Ondas',
          'Electromagnetismo',
          'Mecánica de Fluidos',
          'Óptica',
          'Física Contemporánea'
        ]
      },
      { 
        id: 'quimica_a1', 
        nombre: 'Química', 
        preguntas: 10,
        temas: [
          'Conceptos básicos, sustancias y mezclas',
          'Estructura atómica',
          'Tabla periódica',
          'Enlaces químicos',
          'Nomenclatura inorgánica',
          'Reacciones químicas',
          'Estequiometría',
          'Ácidos y bases',
          'Química del carbono'
        ]
      },
      { 
        id: 'biologia_a1', 
        nombre: 'Biología', 
        preguntas: 10,
        temas: [
          'La célula',
          'Metabolismo celular',
          'Reproducción',
          'Mecanismos de la herencia (Genética)',
          'Evolución',
          'Los seres vivos y su ambiente'
        ]
      },
      { 
        id: 'espanol_a1', 
        nombre: 'Español', 
        preguntas: 18,
        temas: [
          'Funciones de la lengua',
          'Formas del discurso',
          'Comprensión de lectura',
          'Gramática',
          'Redacción',
          'Vocabulario',
          'Ortografía'
        ]
      },
      { 
        id: 'literatura_a1', 
        nombre: 'Literatura', 
        preguntas: 10,
        temas: [
          'El texto literario',
          'Géneros literarios',
          'Corrientes literarias',
          'Redacción e investigación documental'
        ]
      },
      { 
        id: 'historia_mex_a1', 
        nombre: 'Historia de México', 
        preguntas: 10,
        temas: [
          'Mesoamérica',
          'La Nueva España',
          'El movimiento de Independencia',
          'México independiente',
          'La Reforma liberal y la resistencia de la República',
          'El Porfiriato',
          'La Revolución Mexicana',
          'La reconstrucción nacional',
          'México contemporáneo'
        ]
      },
      { 
        id: 'historia_uni_a1', 
        nombre: 'Historia Universal', 
        preguntas: 10,
        temas: [
          'La historia como estudio',
          'Las revoluciones burguesas (Industrial, Francesa)',
          'Movimientos sociales y políticos del siglo XIX',
          'El Imperialismo',
          'La Primera Guerra Mundial',
          'El periodo de entreguerras',
          'La Segunda Guerra Mundial',
          'El conflicto entre capitalismo y socialismo (Guerra Fría)',
          'El mundo contemporáneo'
        ]
      },
      { 
        id: 'geografia_a1', 
        nombre: 'Geografía', 
        preguntas: 10,
        temas: [
          'El espacio geográfico',
          'Geografía física (Relieve, clima, hidrografía)',
          'Geografía humana (Población)',
          'Geografía económica',
          'Geografía política'
        ]
      }
    ]
  },
  area2: {
    id: 'area2',
    nombre: 'Área 2: Ciencias Biológicas, Químicas y de la Salud',
    materias: [
      { 
        id: 'matematicas_a2', 
        nombre: 'Matemáticas', 
        preguntas: 24,
        temas: [
          'Operaciones con números reales, complejos y expresiones algebraicas',
          'Ecuaciones y desigualdades',
          'Sistemas de ecuaciones',
          'Funciones algebraicas',
          'Trigonometría',
          'Geometría analítica',
          'Límites y derivadas',
          'La integral'
        ]
      },
      { 
        id: 'fisica_a2', 
        nombre: 'Física', 
        preguntas: 12,
        temas: [
          'Cinemática',
          'Fuerzas, leyes de Newton y Ley de la Gravitación Universal',
          'Trabajo y leyes de la conservación',
          'Termodinámica',
          'Ondas',
          'Electromagnetismo',
          'Fluidos y óptica',
          'Física contemporánea'
        ]
      },
      { 
        id: 'quimica_a2', 
        nombre: 'Química', 
        preguntas: 13,
        temas: [
          'Temas básicos (materia, sustancias, mezclas)',
          'El agua',
          'Aire y oxígeno',
          'Estructura atómica y tabla periódica',
          'Enlaces químicos',
          'Reacciones químicas',
          'Química de compuestos del carbono'
        ]
      },
      { 
        id: 'biologia_a2', 
        nombre: 'Biología', 
        preguntas: 13,
        temas: [
          'La célula',
          'Metabolismo celular',
          'Reproducción',
          'Mecanismos de la herencia',
          'Evolución',
          'Los seres vivos y su ambiente'
        ]
      },
      { 
        id: 'espanol_a2', 
        nombre: 'Español', 
        preguntas: 18,
        temas: [
          'Funciones de la lengua',
          'Formas del discurso',
          'Comprensión de lectura',
          'Gramática',
          'Redacción',
          'Vocabulario',
          'Ortografía'
        ]
      },
      { 
        id: 'literatura_a2', 
        nombre: 'Literatura', 
        preguntas: 10,
        temas: [
          'El texto (periodístico, dramático, poético)',
          'Géneros y corrientes literarias',
          'Redacción y técnicas de investigación documental'
        ]
      },
      { 
        id: 'historia_mex_a2', 
        nombre: 'Historia de México', 
        preguntas: 10,
        temas: [
          'La Nueva España (siglos XVI a XIX)',
          'El movimiento de Independencia (1810-1821)',
          'México independiente (1821-1854)',
          'La Reforma liberal y la resistencia de la República (1854-1876)',
          'El Porfiriato (1876-1911)',
          'La Revolución Mexicana (1910-1920)',
          'La reconstrucción nacional (1920-1940)',
          'México contemporáneo (1940-2000)'
        ]
      },
      { 
        id: 'historia_uni_a2', 
        nombre: 'Historia Universal', 
        preguntas: 10,
        temas: [
          'La Historia y su estudio',
          'Las revoluciones burguesas',
          'Movimientos sociales y políticos del siglo XIX',
          'El imperialismo',
          'La Primera Guerra Mundial',
          'El mundo entre guerras',
          'La Segunda Guerra Mundial',
          'La Guerra Fría',
          'El mundo contemporáneo'
        ]
      },
      { 
        id: 'geografia_a2', 
        nombre: 'Geografía', 
        preguntas: 10,
        temas: [
          'La Tierra, base del desarrollo del hombre',
          'Geografía física',
          'Geografía humana: el paisaje cultural',
          'Geografía económica',
          'Geografía política'
        ]
      }
    ]
  },
  area3: {
    id: 'area3',
    nombre: 'Área 3: Ciencias Sociales',
    materias: [
      { 
        id: 'matematicas_a3', 
        nombre: 'Matemáticas', 
        preguntas: 24,
        temas: [
          'Operaciones con números reales, complejos y expresiones algebraicas',
          'Ecuaciones y desigualdades',
          'Sistemas de ecuaciones',
          'Funciones algebraicas',
          'Trigonometría',
          'Geometría analítica',
          'Límites y derivadas',
          'La integral'
        ]
      },
      { 
        id: 'fisica_a3', 
        nombre: 'Física', 
        preguntas: 10,
        temas: [
          'Cinemática',
          'Fuerzas, leyes de Newton y Ley de la Gravitación Universal',
          'Trabajo y leyes de la conservación',
          'Termodinámica',
          'Ondas',
          'Electromagnetismo',
          'Fluidos y óptica',
          'Física contemporánea'
        ]
      },
      { 
        id: 'quimica_a3', 
        nombre: 'Química', 
        preguntas: 10,
        temas: [
          'Temas básicos (materia, sustancias, mezclas)',
          'El agua',
          'Aire y oxígeno',
          'Estructura atómica y tabla periódica',
          'Enlaces químicos',
          'Reacciones químicas',
          'Química de compuestos del carbono'
        ]
      },
      { 
        id: 'biologia_a3', 
        nombre: 'Biología', 
        preguntas: 10,
        temas: [
          'La célula',
          'Metabolismo celular',
          'Reproducción',
          'Mecanismos de la herencia',
          'Evolución',
          'Los seres vivos y su ambiente'
        ]
      },
      { 
        id: 'espanol_a3', 
        nombre: 'Español', 
        preguntas: 18,
        temas: [
          'Funciones de la lengua',
          'Formas del discurso',
          'Comprensión de lectura',
          'Gramática',
          'Redacción',
          'Vocabulario',
          'Ortografía'
        ]
      },
      { 
        id: 'literatura_a3', 
        nombre: 'Literatura', 
        preguntas: 10,
        temas: [
          'El texto (periodístico, dramático, poético)',
          'Géneros y corrientes literarias',
          'Redacción y técnicas de investigación documental'
        ]
      },
      { 
        id: 'historia_mex_a3', 
        nombre: 'Historia de México', 
        preguntas: 14,
        temas: [
          'La Nueva España (siglos XVI a XIX)',
          'El movimiento de Independencia (1810-1821)',
          'México independiente (1821-1854)',
          'La Reforma liberal y la resistencia de la República (1854-1876)',
          'El Porfiriato (1876-1911)',
          'La Revolución Mexicana (1910-1920)',
          'La reconstrucción nacional (1920-1940)',
          'México contemporáneo (1940-2000)'
        ]
      },
      { 
        id: 'historia_uni_a3', 
        nombre: 'Historia Universal', 
        preguntas: 14,
        temas: [
          'La Historia y su estudio',
          'Las revoluciones burguesas',
          'Movimientos sociales y políticos del siglo XIX',
          'El imperialismo',
          'La Primera Guerra Mundial',
          'El mundo entre guerras',
          'La Segunda Guerra Mundial',
          'La Guerra Fría',
          'El mundo contemporáneo'
        ]
      },
      { 
        id: 'geografia_a3', 
        nombre: 'Geografía', 
        preguntas: 10,
        temas: [
          'La Tierra, base del desarrollo del hombre',
          'Geografía física',
          'Geografía humana: el paisaje cultural',
          'Geografía económica',
          'Geografía política'
        ]
      }
    ]
  },
  area4: {
    id: 'area4',
    nombre: 'Área 4: Humanidades y de las Artes',
    materias: [
      { 
        id: 'matematicas_a4', 
        nombre: 'Matemáticas', 
        preguntas: 22,
        temas: [
          'Operaciones con números reales, complejos y expresiones algebraicas',
          'Ecuaciones y desigualdades',
          'Sistemas de ecuaciones',
          'Funciones algebraicas',
          'Trigonometría',
          'Geometría analítica',
          'Límites y derivadas',
          'La integral'
        ]
      },
      { 
        id: 'fisica_a4', 
        nombre: 'Física', 
        preguntas: 10,
        temas: [
          'Cinemática',
          'Fuerzas, leyes de Newton y Ley de la Gravitación Universal',
          'Trabajo y leyes de la conservación',
          'Termodinámica',
          'Ondas',
          'Electromagnetismo',
          'Fluidos y óptica',
          'Física contemporánea'
        ]
      },
      { 
        id: 'quimica_a4', 
        nombre: 'Química', 
        preguntas: 10,
        temas: [
          'Temas básicos (materia, sustancias, mezclas)',
          'El agua',
          'Aire y oxígeno',
          'Estructura atómica y tabla periódica',
          'Enlaces químicos',
          'Reacciones químicas',
          'Química de compuestos del carbono'
        ]
      },
      { 
        id: 'biologia_a4', 
        nombre: 'Biología', 
        preguntas: 10,
        temas: [
          'La célula',
          'Metabolismo celular',
          'Reproducción',
          'Mecanismos de la herencia',
          'Evolución',
          'Los seres vivos y su ambiente'
        ]
      },
      { 
        id: 'espanol_a4', 
        nombre: 'Español', 
        preguntas: 18,
        temas: [
          'Funciones de la lengua',
          'Formas del discurso',
          'Comprensión de lectura',
          'Gramática',
          'Redacción',
          'Vocabulario',
          'Ortografía'
        ]
      },
      { 
        id: 'literatura_a4', 
        nombre: 'Literatura', 
        preguntas: 10,
        temas: [
          'El texto (periodístico, dramático, poético)',
          'Géneros y corrientes literarias',
          'Redacción y técnicas de investigación documental'
        ]
      },
      { 
        id: 'historia_mex_a4', 
        nombre: 'Historia de México', 
        preguntas: 10,
        temas: [
          'La Nueva España (siglos XVI a XIX)',
          'El movimiento de Independencia (1810-1821)',
          'México independiente (1821-1854)',
          'La Reforma liberal y la resistencia de la República (1854-1876)',
          'El Porfiriato (1876-1911)',
          'La Revolución Mexicana (1910-1920)',
          'La reconstrucción nacional (1920-1940)',
          'México contemporáneo (1940-2000)'
        ]
      },
      { 
        id: 'historia_uni_a4', 
        nombre: 'Historia Universal', 
        preguntas: 10,
        temas: [
          'La Historia y su estudio',
          'Las revoluciones burguesas',
          'Movimientos sociales y políticos del siglo XIX',
          'El imperialismo',
          'La Primera Guerra Mundial',
          'El mundo entre guerras',
          'La Segunda Guerra Mundial',
          'La Guerra Fría',
          'El mundo contemporáneo'
        ]
      },
      { 
        id: 'geografia_a4', 
        nombre: 'Geografía', 
        preguntas: 10,
        temas: [
          'La Tierra, base del desarrollo del hombre',
          'Geografía física',
          'Geografía humana: el paisaje cultural',
          'Geografía económica',
          'Geografía política'
        ]
      },
      { 
        id: 'filosofia_a4', 
        nombre: 'Filosofía', 
        preguntas: 10,
        temas: [
          'Lógica',
          'Ética',
          'Estética',
          'Historia de la filosofía'
        ]
      }
    ]
  }
};