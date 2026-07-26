export {};

type ScanStatus = 'READ' | 'OCR_ERROR' | 'BLOCKED' | 'AUTHORIZED';

interface ScanRecord {
  id: number;
  prestationNumber: string | null;
  confidence: number;
  rawText: string;
  status: ScanStatus;
  agentName: string;
  createdAt: string;
}

interface ScanInput {
  prestationNumber: string | null;
  confidence: number;
  rawText: string;
  status: ScanStatus;
  agentName?: string;
}

declare global {
  interface Window {
    nassist?: {
      platform: string;
      version: string;
      scans: {
        list(limit?: number): Promise<ScanRecord[]>;
        save(scan: ScanInput): Promise<number>;
      };
    };
  }
}