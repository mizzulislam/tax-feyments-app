import { SupabaseClient } from '@supabase/supabase-js';

export interface ChartOfAccount {
  id: string;
  user_id: string;
  account_code: string;
  account_name: string;
  normal_balance: 'Debit' | 'Credit';
  is_temporary: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  debit_account_id: string;
  credit_account_id: string;
  transaction_type: string;
  description: string;
  category?: string;
  tax_type?: string;
  created_at?: string;
}

/**
 * Validates a new double-entry transaction before saving.
 */
export function validateTransaction(amount: number, debitId: string, creditId: string) {
  if (amount <= 0) throw new Error('Transaction amount must be strictly positive.');
  if (!debitId || !creditId) throw new Error('Both debit and credit accounts are required.');
  if (debitId === creditId) throw new Error('Debit and credit accounts cannot be the same.');
  return true;
}

/**
 * Calculates General Ledger (Running Balance) for a specific account.
 */
export async function generateGeneralLedger(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  accountNormalBalance: 'Debit' | 'Credit'
) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .or(`debit_account_id.eq.${accountId},credit_account_id.eq.${accountId}`)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  let balance = 0;
  const ledger = (data as Transaction[]).map(tx => {
    let debit = 0;
    let credit = 0;
    
    if (tx.debit_account_id === accountId) debit = tx.amount;
    if (tx.credit_account_id === accountId) credit = tx.amount;

    if (accountNormalBalance === 'Debit') {
      balance = balance + debit - credit;
    } else {
      balance = balance + credit - debit;
    }

    return { ...tx, debit, credit, balance };
  });

  return ledger;
}

/**
 * Generates the Trial Balance for the user.
 */
export async function generateTrialBalance(supabase: SupabaseClient, userId: string) {
  const { data: accounts, error: accError } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('account_code', { ascending: true });

  if (accError) throw accError;

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (txError) throw txError;

  let totalDebit = 0;
  let totalCredit = 0;

  const trialBalance = (accounts as ChartOfAccount[]).map(account => {
    let sumDebit = 0;
    let sumCredit = 0;

    (transactions as Transaction[]).forEach(tx => {
      if (tx.debit_account_id === account.id) sumDebit += tx.amount;
      if (tx.credit_account_id === account.id) sumCredit += tx.amount;
    });

    let finalBalance = 0;
    if (account.normal_balance === 'Debit') {
      finalBalance = sumDebit - sumCredit;
      if (finalBalance > 0) totalDebit += finalBalance;
      else if (finalBalance < 0) totalCredit += Math.abs(finalBalance);
    } else {
      finalBalance = sumCredit - sumDebit;
      if (finalBalance > 0) totalCredit += finalBalance;
      else if (finalBalance < 0) totalDebit += Math.abs(finalBalance);
    }

    return {
      ...account,
      debit: finalBalance > 0 && account.normal_balance === 'Debit' ? finalBalance : (finalBalance < 0 && account.normal_balance === 'Credit' ? Math.abs(finalBalance) : 0),
      credit: finalBalance > 0 && account.normal_balance === 'Credit' ? finalBalance : (finalBalance < 0 && account.normal_balance === 'Debit' ? Math.abs(finalBalance) : 0),
      balance: finalBalance
    };
  });

  // Floating point adjustment for equality check
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  return { trialBalance, totalDebit, totalCredit, isBalanced };
}

/**
 * Generates Financial Statements (Income Statement, Balance Sheet).
 */
export async function generateFinancialStatements(supabase: SupabaseClient, userId: string) {
  const { trialBalance, isBalanced } = await generateTrialBalance(supabase, userId);

  let totalRevenue = 0;
  let totalExpense = 0;
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const incomeStatement = trialBalance.filter(acc => acc.is_temporary);
  const balanceSheet = trialBalance.filter(acc => !acc.is_temporary);

  incomeStatement.forEach(acc => {
    if (acc.account_code.startsWith('4')) {
      totalRevenue += acc.balance; // Revenue has normal Credit balance
    } else if (acc.account_code.startsWith('5')) {
      totalExpense += acc.balance; // Expense has normal Debit balance
    }
  });

  const netIncome = totalRevenue - totalExpense;

  balanceSheet.forEach(acc => {
    if (acc.account_code.startsWith('1')) {
      totalAssets += acc.balance; 
    } else if (acc.account_code.startsWith('2')) {
      totalLiabilities += acc.balance;
    } else if (acc.account_code.startsWith('3')) {
      totalEquity += acc.balance;
    }
  });

  // The accounting equation: Assets = Liabilities + Equity + Net Income
  totalEquity += netIncome; // Closing temporary accounts to Retained Earnings
  const equationBalances = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.001;

  return {
    netIncome,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced,
    equationBalances,
    details: { incomeStatement, balanceSheet }
  };
}
