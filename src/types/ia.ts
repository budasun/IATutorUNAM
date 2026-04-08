export interface PreguntaGenerada {
  pregunta: string;
  opciones: [string, string, string, string];
  respuestaCorrecta: string;
  justificacionDescarte: string;
}

export interface SolicitudGenerarPregunta {
  tema: string;
}

export interface RespuestaGenerarPregunta {
  success: boolean;
  data?: PreguntaGenerada;
  error?: string;
}