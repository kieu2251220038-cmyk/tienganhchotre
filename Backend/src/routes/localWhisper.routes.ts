import { Router } from 'express';
import multer from 'multer';
import {
  getLocalWhisperStatus,
  transcribeWithLocalWhisperController
} from '../controllers/localWhisper.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});

router.get('/status', getLocalWhisperStatus);
router.post('/transcribe', upload.single('audio'), transcribeWithLocalWhisperController);

export default router;
