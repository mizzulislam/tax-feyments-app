const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateBphtb,
  calculateAnnualPph21,
  calculateCorporateIncomeTax,
  calculateConsolidatedTax,
  calculateFinalTax,
  calculateLocalTax,
  calculateMonthlyTerTax,
  calculatePbbP2,
  calculatePph23,
  calculatePph26,
  calculatePphUnification,
  calculatePpnBm,
  calculateProgressiveTax,
  calculateStampDuty,
  calculateTaxPenalty,
  calculateUmkmTax,
  calculateVat,
  getTerCategory,
} = require('../.test-build/lib/taxEngine.js');

test('calculateProgressiveTax applies UU HPP progressive brackets', () => {
  assert.equal(calculateProgressiveTax(0), 0);
  assert.equal(calculateProgressiveTax(60_000_000), 3_000_000);
  assert.equal(calculateProgressiveTax(250_000_000), 31_500_000);
  assert.equal(calculateProgressiveTax(500_000_000), 94_000_000);
});

test('TER category and monthly tax use PTKP status brackets', () => {
  assert.equal(getTerCategory('TK/0'), 'A');
  assert.equal(getTerCategory('TK/2'), 'B');
  assert.equal(getTerCategory('K/1'), 'B');
  assert.equal(getTerCategory('K/3'), 'C');
  assert.equal(calculateMonthlyTerTax(5_000_000, 'TK/0'), 0);
  assert.equal(calculateMonthlyTerTax(6_000_000, 'TK/0'), 45_000);
});

test('calculateAnnualPph21 reconciles deductions, previous net income, and credits', () => {
  const result = calculateAnnualPph21({
    grossIncome: 120_000_000,
    ptkpStatus: 'TK/2',
    pensionContribution: 2_400_000,
    religiousContribution: 600_000,
    previousNetIncome: 20_000_000,
    withheldTaxCredit: 1_500_000,
  });

  assert.equal(result.jobExpense, 6_000_000);
  assert.equal(result.currentNetIncome, 111_000_000);
  assert.equal(result.netIncomeForTax, 131_000_000);
  assert.equal(result.ptkpValue, 63_000_000);
  assert.equal(result.taxableIncome, 68_000_000);
  assert.equal(result.annualTax, 4_200_000);
  assert.equal(result.taxDue, 2_700_000);
});

test('calculateUmkmTax respects WPOP Rp500 juta threshold', () => {
  assert.equal(calculateUmkmTax(500_000_000), 0);
  assert.equal(calculateUmkmTax(600_000_000), 500_000);
});

test('calculateConsolidatedTax combines progressive, credits, and final taxes', () => {
  const result = calculateConsolidatedTax(
    [
      {
        id: 'income-1',
        userId: 'user-1',
        sourceName: 'Gaji',
        sourceType: 'pekerjaan_tetap',
        annualIncome: 120_000_000,
        taxYear: 2026,
        isTaxWithheld: true,
        withheldAmount: 1_000_000,
        createdAt: '2026-01-01',
      },
      {
        id: 'income-2',
        userId: 'user-1',
        sourceName: 'Usaha',
        sourceType: 'usaha',
        annualIncome: 600_000_000,
        taxYear: 2026,
        isTaxWithheld: false,
        withheldAmount: 0,
        createdAt: '2026-01-01',
      },
    ],
    'TK/0'
  );

  assert.equal(result.biayaJabatan, 6_000_000);
  assert.equal(result.pkp, 60_000_000);
  assert.equal(result.estimatedProgressiveTax, 3_000_000);
  assert.equal(result.netProgressiveTaxDue, 2_000_000);
  assert.equal(result.totalFinalTax, 500_000);
  assert.equal(result.grandTotalTaxPayable, 2_500_000);
});

test('calculateVat supports 2025 non-luxury DPP value and standard rate', () => {
  assert.equal(calculateVat(12_000_000, 'non_luxury_2025').tax, 1_320_000);
  assert.equal(calculateVat(12_000_000, 'standard').tax, 1_440_000);
});

test('calculatePph23 doubles withholding rate when recipient has no NPWP', () => {
  assert.equal(calculatePph23(10_000_000, 'service_rent').tax, 200_000);
  assert.equal(calculatePph23(10_000_000, 'service_rent', true).tax, 400_000);
  assert.equal(calculatePph23(10_000_000, 'royalty_dividend_interest').tax, 1_500_000);
});

test('calculateFinalTax handles UMKM threshold and property final tax', () => {
  assert.equal(calculateFinalTax(600_000_000, 'umkm_individual').tax, 500_000);
  assert.equal(calculateFinalTax(600_000_000, 'umkm_entity').tax, 3_000_000);
  assert.equal(calculateFinalTax(100_000_000, 'land_building_rent').tax, 10_000_000);
});

test('calculateCorporateIncomeTax applies small business facility proportionally', () => {
  const result = calculateCorporateIncomeTax(1_000_000_000, 10_000_000_000, true);

  assert.equal(result.facilityIncome, 480_000_000);
  assert.equal(result.normalIncome, 520_000_000);
  assert.equal(result.tax, 167_200_000);
});

test('calculateCorporateIncomeTax supports public company and UMKM final modes', () => {
  assert.equal(calculateCorporateIncomeTax(1_000_000_000, 0, false, 'public_company').tax, 190_000_000);
  assert.equal(calculateCorporateIncomeTax(0, 600_000_000, false, 'umkm_final').tax, 3_000_000);
});

test('calculateStampDuty applies Rp10.000 above Rp5 juta document value', () => {
  assert.equal(calculateStampDuty(5_000_000), 0);
  assert.equal(calculateStampDuty(5_000_001), 10_000);
});

test('calculatePpnBm applies selected luxury goods rate band', () => {
  assert.equal(calculatePpnBm(100_000_000, '10').tax, 10_000_000);
  assert.equal(calculatePpnBm(100_000_000, '75').tax, 75_000_000);
});

test('calculateBphtb uses higher NPOP between transaction and NJOP less NPOPTKP', () => {
  const result = calculateBphtb(900_000_000, 1_000_000_000, 80_000_000);

  assert.equal(result.npop, 1_000_000_000);
  assert.equal(result.taxableBase, 920_000_000);
  assert.equal(result.tax, 46_000_000);
});

test('calculatePph26 supports gross income and estimated net basis objects', () => {
  assert.equal(calculatePph26(100_000_000, 'gross_income').tax, 20_000_000);
  assert.equal(calculatePph26(100_000_000, 'asset_transfer').tax, 5_000_000);
  assert.equal(calculatePph26(100_000_000, 'gross_income', 0.1).tax, 10_000_000);
});

test('calculatePphUnification covers common 4(2), 15, 22, 23, and 26 objects', () => {
  assert.equal(calculatePphUnification(100_000_000, 'pph22_government_goods').tax, 1_500_000);
  assert.equal(calculatePphUnification(100_000_000, 'pph22_government_goods', true).tax, 3_000_000);
  assert.equal(calculatePphUnification(100_000_000, 'pph4_land_building_rent').tax, 10_000_000);
  assert.equal(calculatePphUnification(100_000_000, 'pph15_domestic_shipping').tax, 1_200_000);
  assert.equal(calculatePphUnification(100_000_000, 'pph26_gross_income').tax, 20_000_000);
});

test('calculatePbbP2 uses NJOP less NJOPTKP and regional maximum rate', () => {
  const result = calculatePbbP2(1_000_000_000, 10_000_000);

  assert.equal(result.taxableBase, 990_000_000);
  assert.equal(result.tax, 4_950_000);
});

test('calculateLocalTax supports common HKPD regional tax rates', () => {
  assert.equal(calculateLocalTax(100_000_000, 'pkb_first').tax, 1_200_000);
  assert.equal(calculateLocalTax(100_000_000, 'bbnkb').tax, 12_000_000);
  assert.equal(calculateLocalTax(100_000_000, 'reklame').tax, 25_000_000);
  assert.equal(calculateLocalTax(100_000_000, 'pbjt_general', 0.075).tax, 7_500_000);
});

test('calculateTaxPenalty supports fixed late filing fines and May 2026 interest rates', () => {
  assert.equal(calculateTaxPenalty(0, 'late_spt_annual_individual').penalty, 100_000);
  assert.equal(calculateTaxPenalty(0, 'late_spt_annual_corporate').penalty, 1_000_000);
  assert.equal(calculateTaxPenalty(10_000_000, 'interest_correction_late_payment', 2).penalty, 194_000);
  assert.equal(calculateTaxPenalty(10_000_000, 'interest_skpkb_additional', 25).months, 24);
});
