export type ServiceBagDecision = 'AUTHORIZED' | 'BLOCKED' | 'REVIEW_REQUIRED';

export type ServiceBagAnalysis = {
  decision: ServiceBagDecision;
  amountDue: number | null;
  paymentDetected: boolean;
  overdueDetected: boolean;
  alreadyClosed: boolean;
  prestationMissing: boolean;
  reasons: string[];
};
