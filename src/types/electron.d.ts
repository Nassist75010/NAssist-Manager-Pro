export {};

type ScanStatus = 'READ' | 'OCR_ERROR' | 'BLOCKED' | 'AUTHORIZED' | 'REVIEW_REQUIRED';

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

interface ServiceBagPageSnapshot {
  text: string;
  url: string;
  title: string;
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
      serviceBag: {
        open(url: string): Promise<boolean>;
        extractVisibleText(): Promise<ServiceBagPageSnapshot>;
        close(): Promise<boolean>;
      };
    };
  }
}