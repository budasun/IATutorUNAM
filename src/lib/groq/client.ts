import Groq from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error('GROQ_API_KEY environment variable is not set');
}

export const groqClient = new Groq({
  apiKey: groqApiKey,
});