import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getGlobalAiLanguageDirective } from './languageEnforcement';

const router = Router();

function getReqLanguage(req: Request): string {
  return (req.body?.language || (req.headers['x-app-language'] as string) || (req.query?.language as string) || 'en');
}

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const STUDY_CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

interface AttachmentData {
  data: string; // base64 string
  mimeType: string;
  name?: string;
}

function cleanJsonText(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return cleaned;
}

function extractJson<T>(raw: string, fallback: T): T {
  const cleaned = cleanJsonText(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]);
      } catch {}
    }
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {}
    }
    return fallback;
  }
}

async function callStudyGemini(options: {
  prompt: string;
  systemInstruction: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  attachment?: AttachmentData | null;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
}): Promise<string> {
  const ai = getGenAI();
  let lastError: unknown = null;

  for (const model of STUDY_CANDIDATE_MODELS) {
    try {
      const contents: Array<{
        role: 'user' | 'model';
        parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
      }> = [];

      // History turns
      if (options.history && options.history.length > 0) {
        for (const turn of options.history) {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text }],
          });
        }
      }

      // Current prompt parts
      const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      if (options.attachment && options.attachment.data) {
        const cleanBase64 = options.attachment.data.replace(/^data:[^;]+;base64,/, '');
        userParts.push({
          inlineData: {
            mimeType: options.attachment.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      userParts.push({ text: options.prompt });
      contents.push({ role: 'user', parts: userParts });

      const config: Record<string, unknown> = {
        systemInstruction: options.systemInstruction,
      };

      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: unknown) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('Study AI service unavailable');
}

// =========================================================================
// 1. AI Study Assistant Tutor
// =========================================================================
router.post('/tutor', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      mode = 'general',
      subject = 'General Studies',
      topic = '',
      attachment = null,
    } = req.body;

    if (!message && !attachment) {
      res.status(400).json({ error: 'Message or study attachment required' });
      return;
    }

    let modeGuidance = '';
    if (mode === 'simplify') {
      modeGuidance = 'Explain this concept using simple language, clear everyday analogies, and break it down into easy mental steps.';
    } else if (mode === 'examples') {
      modeGuidance = 'Provide 2-3 vivid, practical, real-world examples that ground this concept in tangible reality.';
    } else if (mode === 'differently') {
      modeGuidance = 'Explain this from a completely alternative perspective (e.g., visual intuition, geometric or structural analogy, or cause-and-effect narrative).';
    } else if (mode === 'test_understanding') {
      modeGuidance = 'Provide a brief explanation, then ask the student 1 thoughtful check-for-understanding question to see if they grasp it.';
    } else if (mode === 'recap') {
      modeGuidance = 'Provide a crisp bulleted summary of key principles, terms, and formulas discussed.';
    }

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are the AI Study Tutor for the student in the Nafis Noor Study Platform.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}

Pedagogical Principles:
1. Pure Educational Focus: You are a rigorous, patient, encouraging, and clear academic tutor. Keep discussions strictly focused on learning, understanding, and academic mastery.
2. Structured Clarity: Use Markdown formatting (bold key terms, clean lists, code or formula blocks when relevant, neat line breaks).
3. Active Comprehension: Avoid overwhelming walls of text. Explain core principles concisely, provide intuitive explanations, and encourage curiosity.
4. Multimodal Analysis: When an image, worksheet, or PDF document is attached, carefully extract and analyze all visible questions, formulas, diagrams, tables, and notes. Directly reference the specific problem or diagram.
${modeGuidance}`;

    const isJsonRequested = typeof message === 'string' && (message.includes('Format as JSON') || message.includes('JSON:'));

    const reply = await callStudyGemini({
      prompt: message || 'Please analyze this study material and explain the key concepts.',
      systemInstruction,
      history,
      attachment,
      responseMimeType: isJsonRequested ? 'application/json' : undefined,
    });

    res.json({
      reply,
      result: reply,
      answer: reply,
    });
  } catch (error: any) {
    console.error('Study Tutor Error:', error);
    const fallbackText = 'I am your AI Study Coach. Please check your question or connection, and I will gladly help you break down this concept step by step.';
    res.json({
      reply: fallbackText,
      result: fallbackText,
      answer: fallbackText,
      isFallback: true,
      error: error?.message,
    });
  }
});

// =========================================================================
// Tutor Chat (Used by StudyPlannerView and FocusStudyView)
// =========================================================================
router.post('/tutor-chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      message = '',
      subject = 'General Studies',
      topic = '',
    } = req.body;

    let prompt = message;
    const history: Array<{ role: 'user' | 'model'; text: string }> = [];

    if (Array.isArray(messages) && messages.length > 0) {
      const pastMessages = messages.slice(0, -1);
      const lastMsg = messages[messages.length - 1];
      prompt = lastMsg.content || lastMsg.text || prompt;

      for (const m of pastMessages) {
        history.push({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          text: m.content || m.text || '',
        });
      }
    }

    if (!prompt) {
      res.status(400).json({ error: 'Message or prompt required' });
      return;
    }

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are an expert AI Study Coach and Academic Advisor on the Nafis Noor platform.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}
Provide direct, highly structured, accurate, and supportive academic assistance. If JSON format is requested by the prompt, output ONLY valid JSON without conversational preamble.`;

    const isJsonRequested = prompt.includes('JSON') || prompt.includes('valid JSON array');

    const reply = await callStudyGemini({
      prompt,
      systemInstruction,
      history,
      responseMimeType: isJsonRequested ? 'application/json' : undefined,
    });

    res.json({
      reply,
      result: reply,
      answer: reply,
    });
  } catch (error: any) {
    console.error('Tutor Chat Error:', error);
    const fallbackText = 'I am currently processing your study request. Focus on reviewing core principles and high-yield problems.';
    res.json({
      reply: fallbackText,
      result: fallbackText,
      answer: fallbackText,
      isFallback: true,
      error: error?.message,
    });
  }
});

// =========================================================================
// 2. Live Study Interaction
// =========================================================================
router.post('/live', async (req: Request, res: Response) => {
  try {
    const {
      message,
      concept,
      action = 'explain',
      history = [],
      subject = 'General Studies',
    } = req.body;

    let actionInstruction = '';
    if (action === 'explain') {
      actionInstruction = 'Explain the core mechanism of the concept clearly in 2-4 sentences suitable for spoken listening or quick reading.';
    } else if (action === 'simplify') {
      actionInstruction = 'Slow down, strip away technical jargon, and use a memorable analogy to explain this simply.';
    } else if (action === 'quiz_me') {
      actionInstruction = 'Immediately ask the student a single focused quiz question with 3-4 options or a short question to test their understanding.';
    } else if (action === 'example') {
      actionInstruction = 'Provide a clear, relatable real-world example.';
    } else if (action === 'recap') {
      actionInstruction = 'Deliver a 3-bullet rapid recap of the most critical takeaways.';
    } else if (action === 'verify_understanding') {
      actionInstruction = 'Evaluate what the student just explained. Validate what they got right, gently correct any subtle misconception, and solidify the principle.';
    }

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are a real-time Live Study Coach for ${subject}.
Current Concept: ${concept || 'General Review'}
Target Action: ${action}
Guideline: ${actionInstruction}

Keep your responses conversational, spoken-friendly, encouraging, and pedagogically sharp.`;

    const reply = await callStudyGemini({
      prompt: message || `Help me with ${concept}`,
      systemInstruction,
      history,
    });

    res.json({
      reply,
      result: reply,
      answer: reply,
    });
  } catch (error: any) {
    console.error('Live Study Error:', error);
    res.status(500).json({
      error: error?.message || 'Live study error',
      reply: 'Let us pause a moment. What specific part of this concept would you like to review next?',
      result: 'Let us pause a moment. What specific part of this concept would you like to review next?',
    });
  }
});

// =========================================================================
// 3. AI Flashcard Generator
// =========================================================================
router.post('/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const {
      subject = 'General Studies',
      topic = '',
      text = '',
      attachment = null,
      count = 5,
    } = req.body;

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are an expert educational flashcard creator.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}

Create ${count} high-yield, active-recall flashcards.
Rules:
- Front: A precise question, definition query, or conceptual prompt in the user's selected language. Keep it punchy.
- Back: A clear, accurate answer in the user's selected language with essential context or mnemonic explanation.
- Focus on foundational understanding and high-yield examination facts.
- Output strictly JSON array of objects with keys "front" and "back". Do not include markdown code block backticks, output valid JSON only.`;

    const prompt = text || (attachment ? 'Generate flashcards based on this study material.' : `Generate flashcards for ${topic || subject}`);

    const raw = await callStudyGemini({
      prompt,
      systemInstruction,
      attachment,
      responseMimeType: 'application/json',
    });

    const fallbackFlashcards = [
      {
        front: `What is the core definition of ${topic || subject}?`,
        back: `The fundamental framework and principles governing ${topic || subject}.`,
      },
      {
        front: `Why is active recall important in studying ${topic || subject}?`,
        back: `Testing oneself strengthens synaptic pathways and long-term memory retrieval far more than passive re-reading.`,
      },
      {
        front: `What is a common pitfall when solving problems in ${topic || subject}?`,
        back: `Jumping to formulas before understanding the underlying physical or conceptual setup.`,
      },
    ];

    let flashcards = extractJson<Array<{ front: string; back: string }>>(raw, fallbackFlashcards);
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      flashcards = fallbackFlashcards;
    }

    res.json({ flashcards });
  } catch (error: any) {
    console.error('Flashcard Gen Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate flashcards' });
  }
});

// =========================================================================
// 4. AI Quiz Generator
// =========================================================================
router.post('/generate-quiz', async (req: Request, res: Response) => {
  try {
    const {
      subject = 'General Studies',
      topic = '',
      text = '',
      attachment = null,
      type = 'multiple_choice',
      difficulty = 'medium',
      questionCount = 5,
    } = req.body;

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are a professional educational assessment designer.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}
Target Quiz Type: ${type}
Difficulty Level: ${difficulty} (Easy, Medium, Hard, Exam-level)

Generate a quiz with ${questionCount} questions in the user's selected language.
All question text, options, and explanations MUST be written in the user's selected language.
For multiple_choice: include exactly 4 distinct options and specify the exact string of the correctAnswer.
For true_false: options should be appropriate in the selected language (e.g. ["صحيح", "خطأ"] for Arabic, ["Vrai", "Faux"] for French, ["True", "False"] for English), correctAnswer should match the chosen option.
For short_answer: concise model correctAnswer in the selected language.
For each question, provide a detailed "explanation" in the selected language explaining WHY the correct answer is correct and why common misconceptions fail.

Output format MUST be valid JSON:
{
  "title": "${topic || subject} Practice Quiz",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why Option A is correct..."
    }
  ]
}`;

    const prompt = text || (attachment ? 'Create a quiz assessing this study material.' : `Create a ${difficulty} quiz on ${topic || subject}`);

    const raw = await callStudyGemini({
      prompt,
      systemInstruction,
      attachment,
      responseMimeType: 'application/json',
    });

    const fallbackQuiz = {
      title: `${topic || subject} Diagnostic Quiz`,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: `Which methodology is foundational for mastering ${topic || subject}?`,
          options: [
            'Consistent active recall and spaced retrieval',
            'Passive scanning of textbooks',
            'Cramming right before an examination',
            'Skipping definitions and examples',
          ],
          correctAnswer: 'Consistent active recall and spaced retrieval',
          explanation: 'Evidence-based cognitive science shows that deliberate spaced retrieval produces the highest retention and conceptual flexibility.',
        },
      ],
    };

    let quizData = extractJson<any>(raw, fallbackQuiz);
    if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      quizData = fallbackQuiz;
    }

    res.json(quizData);
  } catch (error: any) {
    console.error('Quiz Gen Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate quiz' });
  }
});

// =========================================================================
// 5. Explain Mode
// =========================================================================
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const {
      concept,
      level = 'detailed',
      angle = 'step_by_step',
      attachment = null,
      subject = 'General Studies',
    } = req.body;

    if (!concept && !attachment) {
      res.status(400).json({ error: 'Concept or attachment required' });
      return;
    }

    let levelInstruction = '';
    if (level === 'quick') levelInstruction = 'Provide a fast, high-impact 2-sentence summary of the core essence.';
    else if (level === 'simple') levelInstruction = 'Explain in plain English using an accessible everyday metaphor, avoiding deep jargon.';
    else if (level === 'detailed') levelInstruction = 'Provide a comprehensive breakdown of principles, components, and how they interact.';
    else if (level === 'deep') levelInstruction = 'Deliver an exhaustive academic analysis covering underlying theory, edge cases, and mathematical/scientific rationale.';

    let angleInstruction = '';
    if (angle === 'example') angleInstruction = 'Center the explanation around a practical, concrete example.';
    else if (angle === 'step_by_step') angleInstruction = 'Deconstruct the concept into sequential, logical chronological steps.';
    else if (angle === 'new_to_this') angleInstruction = 'Explain as if the student has never seen this subject before.';
    else if (angle === 'real_world') angleInstruction = 'Show how this is applied in modern industry, nature, or everyday human life.';

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are a master academic explainer for ${subject}.
Target Depth: ${level} (${levelInstruction})
Perspective Angle: ${angle} (${angleInstruction})

Provide an engaging explanation formatted cleanly with Markdown in the user's selected language. Conclude with a clear "Key Takeaway" box.`;

    const explanation = await callStudyGemini({
      prompt: concept || 'Explain the provided study material in depth.',
      systemInstruction,
      attachment,
    });

    res.json({
      explanation,
      reply: explanation,
      result: explanation,
    });
  } catch (error: any) {
    console.error('Explain Mode Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to explain concept' });
  }
});

// =========================================================================
// 6. Teach Me Mode (Socratic Active Learning)
// =========================================================================
router.post('/teach-me', async (req: Request, res: Response) => {
  try {
    const {
      concept,
      history = [],
      studentAnswer = '',
      subject = 'General Studies',
    } = req.body;

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are a Socratic tutor teaching ${concept} in ${subject}.
Core Socratic Rule: NEVER lecture with a giant text block.
Instead:
1. If this is the start of the session: Introduce the concept in 1 sentence in the user's selected language, then ask the student an intuitive, open-ended question to gauge their starting intuition.
2. If the student answered:
   - Acknowledge what they got right or partially right in the user's selected language.
   - Gently guide them if they made an error without being discouraging.
   - Build on their answer with a concise insight in the user's selected language.
   - Ask the NEXT logical thought-provoking question that leads them one step closer to full mastery.
3. Keep turns short (under 75 words). Always end with a question for the student.`;

    const prompt = studentAnswer ? studentAnswer : `I want to learn ${concept}. Start teaching me step by step using questions!`;

    const reply = await callStudyGemini({
      prompt,
      systemInstruction,
      history,
    });

    res.json({
      reply,
      result: reply,
      answer: reply,
    });
  } catch (error: any) {
    console.error('Teach Me Error:', error);
    res.status(500).json({ error: error?.message || 'Teach me mode error' });
  }
});

// =========================================================================
// 7. Practice Mode (Single Adaptive Question)
// =========================================================================
router.post('/practice-question', async (req: Request, res: Response) => {
  try {
    const {
      subject = 'Mathematics',
      topic = '',
      difficulty = 'medium',
      lastCorrect = true,
    } = req.body;

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are an adaptive practice exam generator for ${subject} - ${topic || 'Core'}.
Difficulty target: ${difficulty}. The student ${lastCorrect ? 'answered the last question correctly' : 'struggled with the last question'}.
Generate a single practice question with options and comprehensive explanation in the user's selected language.
All question text, options, explanations, and follow-up prompts must be strictly in the user's selected language.

Output valid JSON:
{
  "id": "p-${Date.now()}",
  "question": "Question text here",
  "type": "multiple_choice",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "explanation": "Detailed step-by-step solution and explanation of why this is correct.",
  "followUpPrompt": "Optional deeper thinking question"
}`;

    const raw = await callStudyGemini({
      prompt: `Generate 1 practice question for ${subject}: ${topic || 'general'}. Difficulty: ${difficulty}.`,
      systemInstruction,
      responseMimeType: 'application/json',
    });

    const fallbackQuestion = {
      id: `p-${Date.now()}`,
      question: `What is a primary principle in ${topic || subject}?`,
      type: 'multiple_choice',
      options: [
        'Consistent conceptual understanding and derivation',
        'Passive memorization without application',
        'Skipping foundational definitions',
        'Ignoring prerequisite axioms',
      ],
      correctAnswer: 'Consistent conceptual understanding and derivation',
      explanation: `Mastery of ${topic || subject} requires grounding in fundamental definitions and systematic application rather than rote recitation.`,
      followUpPrompt: 'How would you explain this principle to a fellow student in your own words?',
    };

    const questionData = extractJson(raw, fallbackQuestion);
    res.json(questionData);
  } catch (error: any) {
    console.error('Practice Question Error:', error);
    const safeFallback = {
      id: `p-${Date.now()}`,
      question: `Which approach is most effective when preparing for questions in ${req.body?.subject || 'this subject'}?`,
      type: 'multiple_choice',
      options: [
        'Breaking down problems into atomic sub-steps',
        'Memorizing final answers without steps',
        'Skipping verification of boundary cases',
        'Relying only on intuition without calculation',
      ],
      correctAnswer: 'Breaking down problems into atomic sub-steps',
      explanation: 'Systematic decomposition allows complex problems to be verified reliably.',
    };
    res.json(safeFallback);
  }
});

// =========================================================================
// 8. AI Notes Organizer
// =========================================================================
router.post('/organize-notes', async (req: Request, res: Response) => {
  try {
    const { rawText, subject = 'General Studies', topic = '' } = req.body;

    if (!rawText) {
      res.status(400).json({ error: 'Text required to organize' });
      return;
    }

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are an expert academic editor and study notes architect.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}

Transform messy, unformatted, or raw notes into a beautifully organized study guide in the user's selected language.
Use clean headings, bullet points, definitions, formulas, and high-yield takeaways strictly in the user's selected language. Use Markdown.`;

    const structuredNotes = await callStudyGemini({
      prompt: `Organize and polish these study notes:\n\n${rawText}`,
      systemInstruction,
    });

    res.json({
      structuredNotes,
      notes: structuredNotes,
      reply: structuredNotes,
      result: structuredNotes,
    });
  } catch (error: any) {
    console.error('Organize Notes Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to organize notes' });
  }
});

// =========================================================================
// 9. Document Study Actions (PDF / Image OCR & Analysis)
// =========================================================================
router.post('/document-action', async (req: Request, res: Response) => {
  try {
    const {
      document,
      action = 'understand',
      query = '',
      subject = 'Study Document',
    } = req.body;

    if (!document || !document.data) {
      res.status(400).json({ error: 'Document data required' });
      return;
    }

    let actionPrompt = '';
    if (action === 'understand') {
      actionPrompt = 'Carefully read and analyze this study document. Summarize what it covers, list key topics and formulas, and highlight the main educational takeaways.';
    } else if (action === 'summarize') {
      actionPrompt = 'Provide an executive study summary of this document, organized with clear headings and bullet points.';
    } else if (action === 'important_concepts') {
      actionPrompt = 'Extract and define the top 5-10 most important concepts, formulas, or theorems found in this document.';
    } else if (action === 'make_notes') {
      actionPrompt = 'Convert the key contents of this document into structured, comprehensive revision notes.';
    } else if (action === 'ask_question') {
      actionPrompt = `Answer this student question strictly based on the provided document: "${query}"`;
    }

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are an expert academic document analyzer for ${subject}.
Strict Grounding: Rely strictly on readable text, formulas, diagrams, questions, and tables present in this document. Do NOT invent facts not present in the material.
Respond entirely in the user's selected language.`;

    const result = await callStudyGemini({
      prompt: actionPrompt,
      systemInstruction,
      attachment: {
        data: document.data,
        mimeType: document.mimeType || 'application/pdf',
        name: document.name,
      },
    });

    res.json({
      result,
      reply: result,
      answer: result,
    });
  } catch (error: any) {
    console.error('Document Action Error:', error);
    res.status(500).json({ error: error?.message || 'Document analysis failed' });
  }
});

// =========================================================================
// 10. Contextual In-Study Help
// =========================================================================
router.post('/contextual-help', async (req: Request, res: Response) => {
  try {
    const { screen = 'study-dashboard', question = '' } = req.body;

    const langDirective = getGlobalAiLanguageDirective(getReqLanguage(req));
    const systemInstruction = `${langDirective}

You are the in-app guide for the Nafis Noor Study & Learning platform.
The student is currently looking at the "${screen}" section and asking for assistance on how to use it.
Provide clear, friendly, and practical instructions in the user's selected language on how the feature works. Keep it concise.`;

    const answer = await callStudyGemini({
      prompt: question || `How do I make the most of the ${screen} feature?`,
      systemInstruction,
    });

    res.json({
      answer,
      reply: answer,
      result: answer,
    });
  } catch (error: any) {
    console.error('Contextual Help Error:', error);
    res.status(500).json({
      answer: 'The Study platform offers an AI Tutor, Live Study, Spaced Repetition Flashcards, Quiz Mode, Practice Mode, Document/Image Study, and a Distraction-Free Focus Timer. Choose any tool from the top toolbar to begin!',
    });
  }
});

// =========================================================================
// 11. Studio Arabic Audio Synthesis (Gemini TTS)
// =========================================================================
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * 2, 28); // ByteRate
  header.writeUInt16LE(numChannels * 2, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

const ttsAudioCache = new Map<string, string>();

router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text = '', voice = 'Fenrir' } = req.body;
    const cleanText = (text || '').trim();

    if (!cleanText) {
      res.status(400).json({ error: 'Text parameter required' });
      return;
    }

    const selectedVoice = voice || 'Fenrir';
    const cacheKey = `${selectedVoice}:${cleanText}`;
    if (ttsAudioCache.has(cacheKey)) {
      res.json({ audioUrl: ttsAudioCache.get(cacheKey), cached: true });
      return;
    }

    const ai = getGenAI();
    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    const speechPrompt = isArabic
      ? `Speak in a natural, warm, mature, calm, clear, and teacher-like voice with authentic Arabic pronunciation, classical articulation, and smooth pauses:\n\n${cleanText}`
      : `Speak in a natural, warm, mature, calm, clear, and teacher-like tone with proper Arabic pronunciation for Islamic words, and smooth pauses:\n\n${cleanText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ parts: [{ text: speechPrompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const pcmBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!pcmBase64) {
      throw new Error('TTS model did not return audio data');
    }

    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1);
    const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

    // Cache in memory (cap at 300 entries to avoid memory leak)
    if (ttsAudioCache.size > 300) {
      const firstKey = ttsAudioCache.keys().next().value;
      if (firstKey) ttsAudioCache.delete(firstKey);
    }
    ttsAudioCache.set(cacheKey, audioDataUrl);

    res.json({ audioUrl: audioDataUrl, cached: false });
  } catch (error: any) {
    console.warn('Gemini TTS Error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

export default router;
