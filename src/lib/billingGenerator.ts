export function generateBillingDraftReference(from: Date = new Date()): string {
  const stamp = from.toISOString().replace(/\D/g, '').slice(0, 14);
  return `DRAFT-TAX-${stamp}`;
}

export function calculateDraftReviewDate(from: Date = new Date()): Date {
  const reviewDate = new Date(from);
  reviewDate.setDate(reviewDate.getDate() + 30);
  return reviewDate;
}

export function isDraftReviewDue(reviewAt: string | Date): boolean {
  return new Date(reviewAt).getTime() < Date.now();
}

export function buildDraftPaymentPayload(input: {
  draftReference: string;
  amount: number;
  reportId?: string | null;
}) {
  return JSON.stringify({
    issuer: 'My Tax',
    type: 'PAYMENT_PREPARATION_DRAFT',
    draftReference: input.draftReference,
    amount: input.amount,
    reportId: input.reportId || null,
    generatedAt: new Date().toISOString(),
    disclaimer: 'Draft persiapan pembayaran. Bukan kode billing, bukan kanal pembayaran, dan bukan bukti resmi DJP.',
  });
}

export const generateBillingCode = generateBillingDraftReference;
export const calculateExpiry = calculateDraftReviewDate;
export const isBillingExpired = isDraftReviewDue;
export const buildBillingVerificationPayload = buildDraftPaymentPayload;
