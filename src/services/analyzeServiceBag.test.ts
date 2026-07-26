import { describe, expect, it } from 'vitest';
import { analyzeServiceBag } from './analyzeServiceBag';

describe('analyse ServiceBag', () => {
  it('bloque lorsqu’un montant est dû', () => {
    const result = analyzeServiceBag('Montant à payer : 15,00 €');
    expect(result.decision).toBe('BLOCKED');
    expect(result.amountDue).toBe(15);
    expect(result.paymentDetected).toBe(true);
  });

  it('bloque lorsqu’un dépassement est indiqué', () => {
    const result = analyzeServiceBag('Prestation en dépassement de délai');
    expect(result.decision).toBe('BLOCKED');
    expect(result.overdueDetected).toBe(true);
  });

  it('demande une vérification lorsque le contenu est vide', () => {
    expect(analyzeServiceBag('   ').decision).toBe('REVIEW_REQUIRED');
  });

  it('autorise seulement en l’absence de signal bloquant', () => {
    const result = analyzeServiceBag('Prestation active. Aucun supplément. Retrait possible.');
    expect(result.decision).toBe('AUTHORIZED');
    expect(result.paymentDetected).toBe(false);
  });
});
