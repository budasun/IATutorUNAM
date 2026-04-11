export const METODOLOGIA_UNAM = {
  instrucciones_tutor: `Eres un tutor experto preparando aspirantes para el examen de la UNAM. Tu objetivo es evaluar, enseñar y retroalimentar. Cuando generes una pregunta, debe ser de opción múltiple con 4 incisos. Si el usuario falla, explica brevemente por qué la opción correcta lo es, y por qué las otras 3 fueron descartadas (Técnica de descarte).`
};

const MATEMATICAS_TEMAS = [
  "1. Operaciones con números reales, complejos y expresiones algebraicas",
  "2. Ecuaciones y desigualdades",
  "3. Sistemas de ecuaciones",
  "4. Funciones algebraicas",
  "5. Trigonometría",
  "6. Geometría analítica",
  "7. Límites y derivadas",
  "8. La integral"
];

const FISICA_TEMAS = [
  "1. Cinemática",
  "2. Fuerzas, leyes de Newton y Ley de la Gravitación Universal",
  "3. Trabajo y leyes de la conservación",
  "4. Termodinámica",
  "5. Ondas",
  "6. Electromagnetismo",
  "7. Fluidos y óptica",
  "8. Física contemporánea"
];

const QUIMICA_TEMAS = [
  "1. Temas básicos (materia, sustancias, mezclas)",
  "2. El agua",
  "3. Aire y oxígeno",
  "4. Estructura atómica y tabla periódica",
  "5. Enlaces químicos",
  "6. Reacciones químicas",
  "7. Química de compuestos del carbono"
];

const BIOLOGIA_TEMAS = [
  "1. La célula",
  "2. Metabolismo celular",
  "3. Reproducción",
  "4. Mecanismos de la herencia",
  "5. Evolución",
  "6. Los seres vivos y su ambiente"
];

const HISTORIA_UNI_TEMAS = [
  "1. La Historia y su estudio",
  "2. Las revoluciones burguesas",
  "3. Movimientos sociales y políticos del siglo XIX",
  "4. El imperialismo",
  "5. La Primera Guerra Mundial",
  "6. El mundo entre guerras",
  "7. La Segunda Guerra Mundial",
  "8. La Guerra Fría",
  "9. El mundo contemporáneo"
];

const HISTORIA_MEX_TEMAS = [
  "1. La Nueva España (siglos XVI a XIX)",
  "2. El movimiento de Independencia (1810-1821)",
  "3. México independiente (1821-1854)",
  "4. La Reforma liberal y la resistencia de la República (1854-1876)",
  "5. El Porfiriato (1876-1911)",
  "6. La Revolución Mexicana (1910-1920)",
  "7. La reconstrucción nacional (1920-1940)",
  "8. México contemporáneo (1940-2000)"
];

const ESPANOL_TEMAS = [
  "1. Funciones de la lengua",
  "2. Formas del discurso",
  "3. Comprensión de lectura",
  "4. Gramática",
  "5. Redacción",
  "6. Vocabulario",
  "7. Ortografía"
];

const LITERATURA_TEMAS = [
  "1. El texto (periodístico, dramático, poético)",
  "2. Géneros y corrientes literarias",
  "3. Redacción y técnicas de investigación documental"
];

const GEOGRAFIA_TEMAS = [
  "1. La Tierra, base del desarrollo del hombre",
  "2. Geografía física",
  "3. Geografía humana: el paisaje cultural",
  "4. Geografía económica",
  "5. Geografía política"
];

const FILOSOFIA_TEMAS = [
  "1. Lógica",
  "2. Ética",
  "3. Estética",
  "4. Historia de la filosofía"
];

export const TEMARIO_UNAM = {
  area1: {
    id: 'area1',
    nombre: 'Área 1: Físico-Matemáticas y de las Ingenierías',
    materias: [
      { id: 'matematicas_a1', nombre: 'Matemáticas', preguntas: 26, temas: MATEMATICAS_TEMAS },
      { id: 'fisica_a1', nombre: 'Física', preguntas: 16, temas: FISICA_TEMAS },
      { id: 'quimica_a1', nombre: 'Química', preguntas: 10, temas: QUIMICA_TEMAS },
      { id: 'biologia_a1', nombre: 'Biología', preguntas: 10, temas: BIOLOGIA_TEMAS },
      { id: 'espanol_a1', nombre: 'Español', preguntas: 18, temas: ESPANOL_TEMAS },
      { id: 'literatura_a1', nombre: 'Literatura', preguntas: 10, temas: LITERATURA_TEMAS },
      { id: 'historia_mex_a1', nombre: 'Historia de México', preguntas: 10, temas: HISTORIA_MEX_TEMAS },
      { id: 'historia_uni_a1', nombre: 'Historia Universal', preguntas: 10, temas: HISTORIA_UNI_TEMAS },
      { id: 'geografia_a1', nombre: 'Geografía', preguntas: 10, temas: GEOGRAFIA_TEMAS }
    ]
  },
  area2: {
    id: 'area2',
    nombre: 'Área 2: Ciencias Biológicas, Químicas y de la Salud',
    materias: [
      { id: 'matematicas_a2', nombre: 'Matemáticas', preguntas: 24, temas: MATEMATICAS_TEMAS },
      { id: 'fisica_a2', nombre: 'Física', preguntas: 12, temas: FISICA_TEMAS },
      { id: 'quimica_a2', nombre: 'Química', preguntas: 13, temas: QUIMICA_TEMAS },
      { id: 'biologia_a2', nombre: 'Biología', preguntas: 13, temas: BIOLOGIA_TEMAS },
      { id: 'espanol_a2', nombre: 'Español', preguntas: 18, temas: ESPANOL_TEMAS },
      { id: 'literatura_a2', nombre: 'Literatura', preguntas: 10, temas: LITERATURA_TEMAS },
      { id: 'historia_mex_a2', nombre: 'Historia de México', preguntas: 10, temas: HISTORIA_MEX_TEMAS },
      { id: 'historia_uni_a2', nombre: 'Historia Universal', preguntas: 10, temas: HISTORIA_UNI_TEMAS },
      { id: 'geografia_a2', nombre: 'Geografía', preguntas: 10, temas: GEOGRAFIA_TEMAS }
    ]
  },
  area3: {
    id: 'area3',
    nombre: 'Área 3: Ciencias Sociales',
    materias: [
      { id: 'matematicas_a3', nombre: 'Matemáticas', preguntas: 24, temas: MATEMATICAS_TEMAS },
      { id: 'fisica_a3', nombre: 'Física', preguntas: 10, temas: FISICA_TEMAS },
      { id: 'quimica_a3', nombre: 'Química', preguntas: 10, temas: QUIMICA_TEMAS },
      { id: 'biologia_a3', nombre: 'Biología', preguntas: 10, temas: BIOLOGIA_TEMAS },
      { id: 'espanol_a3', nombre: 'Español', preguntas: 18, temas: ESPANOL_TEMAS },
      { id: 'literatura_a3', nombre: 'Literatura', preguntas: 10, temas: LITERATURA_TEMAS },
      { id: 'historia_mex_a3', nombre: 'Historia de México', preguntas: 14, temas: HISTORIA_MEX_TEMAS },
      { id: 'historia_uni_a3', nombre: 'Historia Universal', preguntas: 14, temas: HISTORIA_UNI_TEMAS },
      { id: 'geografia_a3', nombre: 'Geografía', preguntas: 10, temas: GEOGRAFIA_TEMAS }
    ]
  },
  area4: {
    id: 'area4',
    nombre: 'Área 4: Humanidades y de las Artes',
    materias: [
      { id: 'matematicas_a4', nombre: 'Matemáticas', preguntas: 22, temas: MATEMATICAS_TEMAS },
      { id: 'fisica_a4', nombre: 'Física', preguntas: 10, temas: FISICA_TEMAS },
      { id: 'quimica_a4', nombre: 'Química', preguntas: 10, temas: QUIMICA_TEMAS },
      { id: 'biologia_a4', nombre: 'Biología', preguntas: 10, temas: BIOLOGIA_TEMAS },
      { id: 'espanol_a4', nombre: 'Español', preguntas: 18, temas: ESPANOL_TEMAS },
      { id: 'literatura_a4', nombre: 'Literatura', preguntas: 10, temas: LITERATURA_TEMAS },
      { id: 'historia_mex_a4', nombre: 'Historia de México', preguntas: 10, temas: HISTORIA_MEX_TEMAS },
      { id: 'historia_uni_a4', nombre: 'Historia Universal', preguntas: 10, temas: HISTORIA_UNI_TEMAS },
      { id: 'geografia_a4', nombre: 'Geografía', preguntas: 10, temas: GEOGRAFIA_TEMAS },
      { id: 'filosofia_a4', nombre: 'Filosofía', preguntas: 10, temas: FILOSOFIA_TEMAS }
    ]
  }
};