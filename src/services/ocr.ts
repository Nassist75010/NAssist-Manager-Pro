import { createWorker } from 'tesseract.js';
import type { OcrResult } from '../types/scan';

const PRESTATION_PATTERNS = [
  /(?:prestation|ticket|dossier|n[°o]?)[\s:#-]*([A-Z0-9-]{5,20})/i,
  /\b([0-9]{6,12})\b/
];

export function extractPrestationNumber(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  for (const pattern of PRESTATION_PATTERNS) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return null;
}

export async function recognizeTicket(image: Blob): Promise<OcrResult> {
  const worker = await createWorker('fra');
  try {
    const result = await worker.recognize(image);
    return {
      rawText: result.data.text.trim(),
      prestationNumber: extractPrestationNumber(result.data.text),
      confidence: Math.round(result.data.confidence)
    };
  } finally {
    await worker.terminate();
  }
}
