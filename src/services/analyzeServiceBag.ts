import type { ServiceBagAnalysis } from '../types/servicebag';

const paymentTerms = ['paiement', 'payer', 'montant dû', 'montant a payer', 'carte bancaire', 'cb', 'espèces'];
const overdueTerms = ['dépassement', 'hors délai', 'retard', 'supplément', 'majoration'];
const closedTerms = ['déjà clôturé', 'prestation clôturée', 'terminée', 'clôturée'];
const missingTerms = ['introuvable', 'aucun résultat', 'prestation inexistante'];

function normalize(value: string) {
  return value.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function removeKnownNegations(value: string) {
  return value
    .replace(/\b(?:aucun|aucune|sans|pas de|absence de)\s+(?:paiement|supplement|majoration|retard|depassement)\b/g, '')
    .replace(/\b(?:montant|total|a payer|du)\s*[:\-]?\s*0(?:[.,]0{1,2})?\s*€/g, '');
}

export function analyzeServiceBag(text: string): ServiceBagAnalysis {
  const normalized = normalize(text);
  const searchable = removeKnownNegations(normalized);
  const has = (terms: string[]) => terms.some((term) => searchable.includes(normalize(term)));
  const amountMatch = searchable.match(/(?:montant|total|a payer|du)\s*[:\-]?\s*(\d+(?:[.,]\d{1,2})?)\s*€/i);
  const amountDue = amountMatch ? Number(amountMatch[1].replace(',', '.')) : null;
  const paymentDetected = has(paymentTerms) || (amountDue !== null && amountDue > 0);
  const overdueDetected = has(overdueTerms);
  const alreadyClosed = has(closedTerms);
  const prestationMissing = has(missingTerms);
  const reasons: string[] = [];

  if (paymentDetected) {
    reasons.push(amountDue
      ? `Montant détecté : ${amountDue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
      : 'Zone ou instruction de paiement détectée');
  }
  if (overdueDetected) reasons.push('Dépassement ou retard détecté');
  if (alreadyClosed) reasons.push('Prestation déjà clôturée');
  if (prestationMissing) reasons.push('Prestation introuvable');
  if (!text.trim()) reasons.push('Contenu ServiceBag vide');

  const blocked = paymentDetected || overdueDetected || alreadyClosed || prestationMissing;
  return {
    decision: blocked ? 'BLOCKED' : text.trim() ? 'AUTHORIZED' : 'REVIEW_REQUIRED',
    amountDue,
    paymentDetected,
    overdueDetected,
    alreadyClosed,
    prestationMissing,
    reasons: reasons.length ? reasons : ['Aucun signal de paiement ou dépassement détecté. Validation humaine obligatoire.']
  };
}
