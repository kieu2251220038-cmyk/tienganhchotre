import API from './api';
import type { VoiceTranscriptionResult } from './voiceService';

export interface OpenAIWhisperStatus {
  enabled: boolean;
  provider: string;
  language: string;
  model: string;
}

export const openaiWhisperService = {
  async getStatus(): Promise<OpenAIWhisperStatus> {
    const response = await API.get<OpenAIWhisperStatus>('/openai-voice/status');
    return response.data;
  },

  async transcribe(audio: Blob, targetText: string): Promise<VoiceTranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', audio, 'speech.webm');
    formData.append('targetText', targetText);

    try {
      const response = await API.post<VoiceTranscriptionResult>('/openai-voice/transcribe', formData);
      return response.data;
    } catch (error: unknown) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      throw new Error(responseMessage || 'Không thể kết nối OpenAI Whisper API.');
    }
  }
};

export default openaiWhisperService;
