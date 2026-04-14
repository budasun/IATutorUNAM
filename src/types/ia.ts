export interface PreguntaGenerada {
  pregunta: string;
  opciones: [string, string, string, string];
  respuestaCorrecta: string;
  explicacion: string;
  textoLectura?: string;
  tema_usado?: string;
}

export interface SolicitudGenerarPregunta {
  id_materia: string;
  area?: string;
  model?: string;
  temas_excluidos?: string[];
}

export interface RespuestaGenerarPregunta {
  success: boolean;
  data?: PreguntaGenerada | PreguntaGenerada[];
  error?: string;
}