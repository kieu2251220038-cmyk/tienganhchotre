import { Request, Response } from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { localWhisperStatus, transcribeWithLocalWhisper } from '../services/localWhisper.service';

export const getLocalWhisperStatus = (_req: Request, res: Response): void => {
  res.json(localWhisperStatus());
};

export const transcribeWithLocalWhisperController = async (req: Request, res: Response): Promise<void> => {
  if (!localWhisperStatus().enabled) {
    res.status(503).json({ message: 'Whisper cục bộ đang bị tắt trong Backend/.env.' });
    return;
  }
  if (!req.file || req.file.size === 0) {
    res.status(400).json({ message: 'Không nhận được file âm thanh.' });
    return;
  }

  const targetText = typeof req.body?.targetText === 'string' ? req.body.targetText.trim() : '';
  const tempPath = path.join(os.tmpdir(), `kids-english-whisper-${randomUUID()}.webm`);
  try {
    await fs.writeFile(tempPath, req.file.buffer);
    const result = await transcribeWithLocalWhisper(tempPath, targetText);
    res.json({
      ...result,
      provider: 'local-whisper',
      language: process.env.WHISPER_LANGUAGE || 'en',
      model: process.env.WHISPER_MODEL || 'small.en'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Whisper không thể xử lý file âm thanh.';
    console.error('Local Whisper error:', message);
    res.status(502).json({ message });
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
};
