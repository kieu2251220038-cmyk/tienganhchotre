import API from './api';

export interface VoiceServiceStatus {
  enabled: boolean;
  provider: string;
  language: string;
  model: string;
}

export interface VoiceTranscriptionResult {
  text: string;
  confidence: number | null;
  phonemeScore?: number | null;
  targetPhonemes?: string;
  recognizedPhonemes?: string;
  phonemeMethod?: string;
  provider: string;
  language: string;
  model: string;
}

export const voiceService = {
  async getStatus(): Promise<VoiceServiceStatus> {
    const response = await API.get<VoiceServiceStatus>('/voice/status');
    return response.data;
  },

  async transcribe(audio: Blob, targetText: string): Promise<VoiceTranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', audio, 'speech.webm');
    formData.append('targetText', targetText);

    try {
      const response = await API.post<VoiceTranscriptionResult>('/voice/transcribe', formData);
      return response.data;
    } catch (error: unknown) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      throw new Error(responseMessage || 'Không thể kết nối Whisper cục bộ.');
    }
  }
};

export default voiceService;
