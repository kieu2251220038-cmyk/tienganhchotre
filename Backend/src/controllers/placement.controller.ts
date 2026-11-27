import { Request, Response } from 'express';
import pool from '../config/database';

interface PlacementAnswer {
    answerId: number;
    answerText: string;
    meaningVi: string;
    isCorrect: boolean;
    answerImageUrl: string | null;
    vocabularyImageUrl: string | null;
}

interface PlacementQuestionGroup {
    questionId: number;
    lessonId: number;
    questionText: string;
    topicName: string;
    ageGroup: number;
    questionImageUrl: string | null;
    answers: PlacementAnswer[];
}

// Gợi ý được tạo ở Backend để nội dung hint luôn đi cùng dữ liệu câu hỏi.
// Chỉ cung cấp manh mối (chữ cái đầu + nghĩa), không trả thẳng đáp án.
function buildPlacementHint(answer: PlacementAnswer | undefined): string {
    if (!answer) return 'Hãy nhìn kỹ hình và chọn từ phù hợp nhé.';

    const answerText = answer.answerText.trim();
    const firstLetter = Array.from(answerText)[0]?.toUpperCase();
    const meaning = answer.meaningVi.trim();

    if (firstLetter && meaning) {
        return `Từ này bắt đầu bằng chữ "${firstLetter}" và có nghĩa là "${meaning}".`;
    }

    if (firstLetter) return `Từ đúng bắt đầu bằng chữ "${firstLetter}".`;
    if (meaning) return `Đáp án có nghĩa là "${meaning}".`;
    return 'Hãy nhìn kỹ hình và chọn từ phù hợp nhé.';
}

function shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const current = shuffled[index];
        const swap = shuffled[swapIndex];
        if (current === undefined || swap === undefined) continue;
        [shuffled[index], shuffled[swapIndex]] = [swap, current];
    }
    return shuffled;
}

function toPublicMediaUrl(req: Request, fileUrl: string | null): string {
    if (!fileUrl) return '';
    if (/^(https?:)?\/\//i.test(fileUrl) || fileUrl.startsWith('data:')) return fileUrl;
    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${req.protocol}://${req.get('host')}${normalizedPath}`;
}

function getEmoji(word: string): string {
    const emojis: Record<string, string> = {
        apple: '🍎', banana: '🍌', orange: '🍊', mango: '🥭', strawberry: '🍓', watermelon: '🍉',
        dog: '🐶', cat: '🐱', bird: '🐦', elephant: '🐘', monkey: '🐵', lion: '🦁',
        red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', pink: '🩷', purple: '🟣',
        circle: '⚪', square: '🟦', triangle: '🔺', star: '⭐', book: '📖', pen: '🖊️'
    };
    return emojis[word.trim().toLowerCase()] || '⭐';
}

export const getPlacementQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await pool.query(`
            SELECT
                q.id AS question_id,
                q.question_text,
                l.id AS lesson_id,
                t.name AS topic_name,
                c.age_group,
                q_media.file_url AS question_image_url,
                a.id AS answer_id,
                a.answer_text,
                a.is_correct,
                answer_media.file_url AS answer_image_url,
                v.meaning_vi,
                vocabulary_media.file_url AS vocabulary_image_url
            FROM questions q
            INNER JOIN lessons l ON l.id = q.lesson_id
            INNER JOIN topics t ON t.id = l.topic_id
            INNER JOIN courses c ON c.id = t.course_id
            INNER JOIN answers a ON a.question_id = q.id
            LEFT JOIN media_assets q_media ON q_media.id = q.media_id
            LEFT JOIN media_assets answer_media ON answer_media.id = a.media_id
            LEFT JOIN vocabularies v
                ON LOWER(TRIM(v.word)) = LOWER(TRIM(a.answer_text))
               AND v.topic_id = t.id
            LEFT JOIN media_assets vocabulary_media ON vocabulary_media.id = v.image_id
            WHERE c.status = 'PUBLISHED'
              AND t.status = 'PUBLISHED'
              AND l.status = 'PUBLISHED'
              AND l.approval_status = 'APPROVED'
              AND l.lesson_type = 'QUIZ'
              AND CAST(c.age_group AS UNSIGNED) BETWEEN 3 AND 8
            ORDER BY q.id ASC, a.id ASC
        `);

        const questionMap = new Map<number, PlacementQuestionGroup>();
        for (const row of rows) {
            const questionId = Number(row.question_id);
            let question = questionMap.get(questionId);
            if (!question) {
                question = {
                    questionId,
                    lessonId: Number(row.lesson_id),
                    questionText: String(row.question_text || ''),
                    topicName: String(row.topic_name || ''),
                    ageGroup: Number(row.age_group),
                    questionImageUrl: row.question_image_url || null,
                    answers: []
                };
                questionMap.set(questionId, question);
            }

            question.answers.push({
                answerId: Number(row.answer_id),
                answerText: String(row.answer_text || ''),
                meaningVi: String(row.meaning_vi || ''),
                isCorrect: Number(row.is_correct) === 1,
                answerImageUrl: row.answer_image_url || null,
                vocabularyImageUrl: row.vocabulary_image_url || null
            });
        }

        const candidates = Array.from(questionMap.values()).filter((question) => question.answers.length >= 2);
        const selectedQuestions: PlacementQuestionGroup[] = [];
        const selectedIds = new Set<number>();
        const ageGroups = shuffle(Array.from(new Set(candidates.map((question) => question.ageGroup))));

        // Pick different age groups first when possible, then fill the rest randomly.
        for (const ageGroup of ageGroups) {
            const ageCandidates = shuffle(candidates.filter((question) => question.ageGroup === ageGroup));
            const selected = ageCandidates[0];
            if (!selected) continue;
            selectedQuestions.push(selected);
            selectedIds.add(selected.questionId);
            if (selectedQuestions.length === 4) break;
        }

        if (selectedQuestions.length < 4) {
            selectedQuestions.push(
                ...shuffle(candidates.filter((question) => !selectedIds.has(question.questionId)))
                    .slice(0, 4 - selectedQuestions.length)
            );
        }

        shuffle(selectedQuestions);

        res.status(200).json(selectedQuestions.map((question) => {
            const answers = shuffle(question.answers);
            const correctAnswer = answers.find((answer) => answer.isCorrect) || answers[0];
            const imageUrl = correctAnswer
                ? correctAnswer.vocabularyImageUrl || correctAnswer.answerImageUrl || question.questionImageUrl
                : question.questionImageUrl;

            return {
                id: question.questionId,
                lessonId: question.lessonId,
                ageGroup: question.ageGroup,
                topicName: question.topicName,
                promptVi: `Bé hãy trả lời câu hỏi về ${question.topicName} nhé!`,
                promptEn: question.questionText,
                speakText: question.questionText,
                image: toPublicMediaUrl(req, imageUrl),
                hint: buildPlacementHint(correctAnswer),
                options: answers.map((answer) => ({
                    text: answer.answerText,
                    subText: answer.meaningVi,
                    emoji: getEmoji(answer.answerText),
                    isCorrect: answer.isCorrect
                }))
            };
        }));
    } catch (error) {
        console.error('Lỗi khi tạo câu hỏi khảo sát từ lộ trình:', error);
        res.status(500).json({ message: 'Không thể tải câu hỏi khảo sát từ lộ trình.' });
    }
};
