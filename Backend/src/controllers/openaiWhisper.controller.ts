import { Request, Response } from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  openAIWhisperStatus,
  transcribeWithOpenAIWhisper
} from '../services/openaiWhisper.service';

export const getOpenAIWhisperStatus = (_req: Request, res: Response): void => {
  res.json(openAIWhisperStatus());
};

export const transcribeWithOpenAIWhisperController = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!openAIWhisperStatus().enabled) {
    res.status(503).json({
      message: 'OpenAI Whisper API chưa sẵn sàng. Hãy bật OPENAI_WHISPER_ENABLED và cấu hình OPENAI_API_KEY ở Backend/.env.'
    });
    return;
  }

  if (!req.file || req.file.size === 0) {
    res.status(400).json({ message: 'Không nhận được file âm thanh.' });
    return;
  }

  const tempPath = path.join(os.tmpdir(), `kids-english-openai-${randomUUID()}.webm`);

  try {
    await fs.writeFile(tempPath, req.file.buffer);
    const result = await transcribeWithOpenAIWhisper(tempPath);
    res.json({
      ...result,
      provider: 'openai-whisper-api',
      language: process.env.OPENAI_WHISPER_LANGUAGE || 'en',
      model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1'
    });
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : 'OpenAI Whisper API không thể xử lý file âm thanh.';
    console.error('OpenAI Whisper error:', message);
    res.status(502).json({ message: 'OpenAI Whisper API lỗi: ' + message });
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
};
