import { userDataService, type SpeakingSummary } from './userDataService';

export type { PronunciationAttempt, SpeakingSummary } from './userDataService';

export const speakingSummaryService = {
  save(summary: SpeakingSummary): Promise<void> {
    return userDataService.saveSpeakingSummary(summary);
  },

  getLatest(userId: number): Promise<SpeakingSummary | null> {
    return userDataService.getLatestSpeakingSummary(userId);
  }
};

export default speakingSummaryService;
