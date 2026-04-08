export interface PreguntaGenerada {
  pregunta: string;
  opciones: [string, string, string, string];
  respuestaCorrecta: string;
  justificacionDescarte: string;
}

export interface SolicitudGenerarPregunta {
  id_materia: string;
}

export interface RespuestaGenerarPregunta {
  success: boolean;
  data?: PreguntaGenerada;
  error?: string;
}