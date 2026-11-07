import OpenAI from 'openai';
import { createReadStream } from 'node:fs';

export interface OpenAIWhisperResult {
  text: string;
  confidence: number | null;
}

const isEnabled = (): boolean =>
  process.env.OPENAI_WHISPER_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY?.trim());

const getClient = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('Chưa cấu hình OPENAI_API_KEY trong Backend/.env.');
  return new OpenAI({ apiKey });
};

export const openAIWhisperStatus = () => ({
  enabled: isEnabled(),
  provider: 'openai-whisper-api',
  language: process.env.OPENAI_WHISPER_LANGUAGE || 'en',
  model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1'
});

export const transcribeWithOpenAIWhisper = async (
  audioPath: string
): Promise<OpenAIWhisperResult> => {
  if (!isEnabled()) {
    throw new Error('OpenAI Whisper API chưa được bật hoặc thiếu OPENAI_API_KEY trong Backend/.env.');
  }

  const transcription = await getClient().audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
    language: process.env.OPENAI_WHISPER_LANGUAGE || 'en',
    response_format: 'json',
    temperature: 0,
    prompt: 'English pronunciation practice. Transcribe exactly what the child says. Do not correct or rewrite the words.'
  });

  return {
    text: transcription.text.trim(),
    confidence: null
  };
};
