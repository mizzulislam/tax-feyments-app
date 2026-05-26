const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateServerTax, createTaxReportSchema } = require('../.test-build/lib/taxReportServer.js');

test('createTaxReportSchema rejects invalid report payloads', () => {
  const result = createTaxReportSchema.safeParse({
    taxYear: 2019,
    taxPeriod: '13',
    grossIncome: -1,
    status: 'paid',
  });

  assert.equal(result.success, false);
});

test('createTaxReportSchema accepts complete PTKP status options', () => {
  const result = createTaxReportSchema.safeParse({
    taxYear: 2026,
    taxPeriod: '12',
    grossIncome: 120_000_000,
    status: 'draft',
    ptkpStatus: 'TK/3',
    pensionContribution: 0,
  });

  assert.equal(result.success, true);
});

test('calculateServerTax recalculates monthly TER server-side', () => {
  const input = createTaxReportSchema.parse({
    taxYear: 2026,
    taxPeriod: '01',
    grossIncome: 6_000_000,
    status: 'draft',
    ptkpStatus: 'TK/0',
    pensionContribution: 0,
  });

  assert.equal(calculateServerTax(input), 45_000);
});

test('calculateServerTax recalculates annual progressive PPh 21 server-side', () => {
  const input = createTaxReportSchema.parse({
    taxYear: 2026,
    taxPeriod: '12',
    grossIncome: 120_000_000,
    status: 'submitted',
    ptkpStatus: 'TK/0',
    pensionContribution: 0,
  });

  assert.equal(calculateServerTax(input), 3_000_000);
});
