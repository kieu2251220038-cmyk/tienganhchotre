import { Router } from 'express';
import multer from 'multer';
import {
  getOpenAIWhisperStatus,
  transcribeWithOpenAIWhisperController
} from '../controllers/openaiWhisper.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

router.get('/status', getOpenAIWhisperStatus);
router.post('/transcribe', upload.single('audio'), transcribeWithOpenAIWhisperController);

export default router;
