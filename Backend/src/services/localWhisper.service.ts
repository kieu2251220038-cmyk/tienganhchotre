import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { createInterface, Interface } from 'node:readline';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

interface WhisperWorkerResponse {
  id: string;
  ok: boolean;
  text?: string;
  confidence?: number | null;
  phonemeScore?: number | null;
  targetPhonemes?: string;
  recognizedPhonemes?: string;
  phonemeMethod?: string;
  error?: string;
}

interface PendingRequest {
  resolve: (value: {
    text: string;
    confidence: number | null;
    phonemeScore: number | null;
    targetPhonemes: string;
    recognizedPhonemes: string;
    phonemeMethod: string;
  }) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}

let worker: ChildProcessWithoutNullStreams | null = null;
let outputReader: Interface | null = null;
const pendingRequests = new Map<string, PendingRequest>();
const workerScript = path.resolve(__dirname, '../../scripts/whisper_worker.py');

const rejectPendingRequests = (error: Error) => {
  for (const [id, request] of pendingRequests) {
    clearTimeout(request.timer);
    request.reject(error);
    pendingRequests.delete(id);
  }
};

const startWorker = (): ChildProcessWithoutNullStreams => {
  if (worker && !worker.killed && worker.stdin.writable) return worker;

  const configuredPython = process.env.WHISPER_PYTHON?.trim();
  const localVenvPython = process.platform === 'win32'
    ? path.resolve(__dirname, '../../.venv/Scripts/python.exe')
    : path.resolve(__dirname, '../../.venv/bin/python');
  const configuredPythonIsUsable = Boolean(
    configuredPython && (!path.isAbsolute(configuredPython) || existsSync(configuredPython))
  );
  const pythonCommand = configuredPythonIsUsable
    ? configuredPython
    : (existsSync(localVenvPython) ? localVenvPython : '');
  const command = pythonCommand || (process.platform === 'win32' ? 'py' : 'python3');
  const args = pythonCommand
    ? [workerScript]
    : process.platform === 'win32'
      ? ['-3', workerScript]
      : [workerScript];

  const child = spawn(command, args, {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });

  worker = child;
  outputReader = createInterface({ input: child.stdout });
  outputReader.on('line', (line) => {
    try {
      const response = JSON.parse(line) as WhisperWorkerResponse;
      const request = pendingRequests.get(response.id);
      if (!request) return;
      clearTimeout(request.timer);
      pendingRequests.delete(response.id);
      if (!response.ok) {
        request.reject(new Error(response.error || 'Whisper không thể nhận diện âm thanh.'));
        return;
      }
      request.resolve({
        text: response.text || '',
        confidence: typeof response.confidence === 'number' ? response.confidence : null,
        phonemeScore: typeof response.phonemeScore === 'number' ? response.phonemeScore : null,
        targetPhonemes: response.targetPhonemes || '',
        recognizedPhonemes: response.recognizedPhonemes || '',
        phonemeMethod: response.phonemeMethod || 'unavailable'
      });
    } catch (error) {
      console.error('Local Whisper returned invalid JSON:', line, error);
    }
  });

  child.stderr.on('data', (chunk) => {
    const message = chunk.toString().trim();
    if (message) console.error('[local-whisper]', message);
  });

  child.once('error', (error) => {
    worker = null;
    outputReader?.close();
    outputReader = null;
    rejectPendingRequests(new Error(`Không thể khởi động Whisper cục bộ: ${error.message}`));
  });

  child.once('exit', (code, signal) => {
    worker = null;
    outputReader?.close();
    outputReader = null;
    if (code !== 0) {
      rejectPendingRequests(new Error(`Whisper cục bộ đã dừng (code=${code ?? 'unknown'}, signal=${signal ?? 'none'}).`));
    }
  });

  return child;
};

export const transcribeWithLocalWhisper = async (
  audioPath: string,
  targetText: string
): Promise<{
  text: string;
  confidence: number | null;
  phonemeScore: number | null;
  targetPhonemes: string;
  recognizedPhonemes: string;
  phonemeMethod: string;
}> => {
  const child = startWorker();
  const id = randomUUID();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Whisper xử lý quá lâu. Bé hãy thử lại với một câu nói ngắn và rõ hơn nhé.'));
    }, 90_000);

    pendingRequests.set(id, { resolve, reject, timer });
    try {
      child.stdin.write(JSON.stringify({ id, audioPath, targetText }) + '\n');
    } catch (error) {
      clearTimeout(timer);
      pendingRequests.delete(id);
      reject(error instanceof Error ? error : new Error('Không thể gửi âm thanh cho Whisper.'));
    }
  });
};

export const localWhisperStatus = () => ({
  enabled: process.env.WHISPER_ENABLED !== 'false',
  provider: 'local-whisper',
  language: process.env.WHISPER_LANGUAGE || 'en',
  model: process.env.WHISPER_MODEL || 'small.en',
  device: process.env.WHISPER_DEVICE || 'cpu'
});
