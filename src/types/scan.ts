export type ScanStatus = 'ready' | 'scanning' | 'success' | 'error';

export interface OcrResult {
  rawText: string;
  prestationNumber: string | null;
  confidence: number;
}

export interface ScanRecord extends OcrResult {
  id: string;
  createdAt: string;
  source: 'camera' | 'file';
}
