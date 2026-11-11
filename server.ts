import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();

// Parse port from environment or CLI arguments (e.g. --port 3000)
let port = Number(process.env.PORT) || 3000;
const portArgIdx = process.argv.indexOf('--port');
if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
  const p = parseInt(process.argv[portArgIdx + 1], 10);
  if (!isNaN(p)) port = p;
}

// Immediate healthcheck endpoints for container supervisors
app.get(['/healthz', '/health'], (_req, res) => {
  res.status(200).send('OK');
});

// Body parser with 50MB limit for high-resolution rendered PDF page images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side multimodal portion analysis endpoint
app.post('/api/analyze-portion', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        reason: 'no_api_key',
        message: 'No GEMINI_API_KEY configured on server. Falling back to client-side visual layout engine.'
      });
    }

    const { images, defaultExamName, grade } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, message: 'No page images provided' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Process up to first 5 pages for syllabus portions
    const pagesToAnalyze = images.slice(0, 5);
    const contents: any[] = [];

    // Instruction prompt enforcing strict visual understanding and no hallucination
    const promptText = `You are an expert visual document analysis engine for school examination portion divisions and syllabus tables.
Examine the attached high-resolution page image(s) from a school examination syllabus document.

Strict Rules:
1. READ THE ACTUAL VISUAL LAYOUT, TABLES, COLUMNS, ROWS, AND HEADINGS:
   - Identify table columns (e.g. Subject, Chapter/Topics, Page Range, Date, Remarks).
   - Follow rows carefully: map the exact page range to the subject in that same row.
   - Do NOT mix up rows or columns. Never assign one subject's page range to another subject.
2. STRICT EXAMINATION SYSTEM — ONLY THREE EXAMS ALLOWED:
   - The school strictly uses ONLY three examination types: 'Test 2', 'FQT', and 'FE' (Final Examination).
   - Never invent, suggest, or return any other exam name.
   - If a section header or column indicates an examination, tag each subject with one of the 3 allowed names: 'Test 2', 'FQT', or 'FE'.
   - If the exam name is not clearly stated or matches none of the 3, set detectedExamName to "Unclear".
3. DETECT GRADE AND TARGET DATE:
   - Identify grade (e.g. "Grade 10", "Grade 6", etc. Default: "${grade || 'Grade 10'}").
   - Identify any overall examination dates mentioned.
4. EXTRACT EXACT PAGE NUMBERS:
   - Find start page and end page for each subject.
   - NEVER invent or guess page numbers.
   - If a page range is not clearly stated or illegible, mark confidence as "uncertain" and set startPage/endPage to null or best legible integer.
5. TOPICS AND CHAPTERS:
   - Extract the chapter titles or topics listed for that subject's portion.

Return structured JSON strictly following the schema.`;

    contents.push({ text: promptText });

    for (let i = 0; i < pagesToAnalyze.length; i++) {
      const imgDataUrl = pagesToAnalyze[i];
      // Extract base64 part
      const matches = imgDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const data = matches[2];
        contents.push({
          inlineData: {
            mimeType,
            data
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedExamName: {
              type: Type.STRING,
              enum: ['Test 2', 'FQT', 'FE', 'Unclear'],
              description: 'Overall examination name: strictly Test 2, FQT, FE, or Unclear'
            },
            detectedGrade: { type: Type.STRING, description: 'Grade level found in header' },
            detectedDate: { type: Type.STRING, description: 'Target exam date if found' },
            subjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  examName: {
                    type: Type.STRING,
                    enum: ['Test 2', 'FQT', 'FE'],
                    description: 'Examination this row belongs to: strictly Test 2, FQT, or FE'
                  },
                  name: { type: Type.STRING, description: 'Subject name exactly as written' },
                  startPage: { type: Type.INTEGER, description: 'Starting textbook page number' },
                  endPage: { type: Type.INTEGER, description: 'Ending textbook page number' },
                  topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Chapters or topics for this subject'
                  },
                  sourcePageNumber: { type: Type.INTEGER, description: 'PDF page index (1-based) where this was found' },
                  confidence: { type: Type.STRING, enum: ['high', 'uncertain'] },
                  notes: { type: Type.STRING, description: 'Notes or warning if uncertain' }
                },
                required: ['name', 'examName', 'confidence']
              }
            }
          },
          required: ['subjects']
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.status(200).json({
      success: true,
      hasGemini: true,
      data: parsedJson
    });
  } catch (err: any) {
    console.error('Server multimodal portion analysis error:', err);
    return res.status(200).json({
      success: false,
      reason: 'api_error',
      message: err?.message || 'Multimodal analysis failed. Falling back to client-side visual layout engine.'
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Study Quest server listening on http://0.0.0.0:${port}`);
    console.log(`  ➜  Local:   http://localhost:${port}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${port}/`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
