\# Super Prompt: Automated Accounting Cycle System for "My Tax" App

\#\# Context & Role  
You are an Expert Full-Stack Developer and Financial Systems Architect.   
I am building a tax and accounting application named "My Tax". I need you to build the core backend logic, database schema, and automated accounting cycle functions based on standard Double-Entry Accounting principles (GAAP/IFRS). 

Previously, I built this using Google Apps Script with a specific workflow. I want you to replicate that logic into our modern tech stack (e.g., Node.js/TypeScript/Python/Next.js \- adapt to our current workspace).

\#\# Core Architecture Requirements  
The system must follow a strict sequential accounting cycle triggered automatically by user input:  
1\. Form Input \-\> 2\. General Journal \-\> 3\. General Ledger \-\> 4\. Trial Balance \-\> 5\. Adjustments \-\> 6\. Adjusted Trial Balance \-\> 7\. Financial Statements \-\> 8\. Closing Entries \-\> 9\. Post-Closing Trial Balance.

\#\# 1\. Database Schema Design  
Please design the ORM/Database Models for the following:

\*\*A. ChartOfAccounts (CoA)\*\*  
\- \`id\`: UUID/Integer  
\- \`account\_code\`: String (e.g., 1000, 4000\)  
\- \`account\_name\`: String (e.g., "Cash in Bank", "Service Revenue")  
\- \`normal\_balance\`: Enum ("Debit", "Credit")  
\- \`is\_temporary\`: Boolean (True for Revenue, Expense, Dividend. False for Assets, Liabilities, Equity).

\*\*B. Transactions (Database of Transaction)\*\*  
\- \`id\`: UUID  
\- \`date\`: DateTime  
\- \`description\`: String  
\- \`type\`: Enum ("Income", "Cost", "Transfer", "Receivable", "Payable", "Adjustment", "Closing")  
\- \`amount\`: Decimal  
\- \`debit\_account\_id\`: Foreign Key to CoA  
\- \`credit\_account\_id\`: Foreign Key to CoA  
\- \`created\_at\`: Timestamp

\#\# 2\. Core Backend Functions to Implement  
Translate the following Google Apps Script logic into optimized backend services/utilities:

\*\*A. \`recordTransaction(data)\` (Ref: \`simpanTransaksiLapKeu\`)\*\*  
\- Validate that \`debit\_account\_id\` and \`credit\_account\_id\` are not empty and not the same.  
\- Ensure the transaction obeys double-entry: automatically post \`amount\` to the Debit side of \`debit\_account\_id\` and the Credit side of \`credit\_account\_id\`.

\*\*B. \`generateGeneralLedger(period)\` (Ref: \`generateLedgerOtomatis\`)\*\*  
\- Query all transactions within the specific period.  
\- Group transactions by Account.  
\- Calculate the \`running\_balance\` chronologically based on the account's \`normal\_balance\`. (If Normal Balance is Debit: Balance \= Debit \- Credit. If Normal Balance is Credit: Balance \= Credit \- Debit).

\*\*C. \`generateTrialBalance(period)\` (Ref: \`generateTrialBalance\`)\*\*  
\- Sum all ending balances from the General Ledger for each account.  
\- Map accounts to their normal balances and return an array of accounts with their final Debit or Credit balances.  
\- \*\*Validation check:\*\* Total Debits MUST exactly equal Total Credits.

\*\*D. \`processAdjustments(period)\` (Ref: \`generateAdjTrialBalance\`)\*\*  
\- Filter transactions where \`type\` is "Adjustment".  
\- Calculate the Adjusted Trial Balance by combining the unadjusted Trial Balance with the Adjustment entries.

\*\*E. \`generateFinancialStatements(period)\` (Ref: \`generateFinancialStatements\`)\*\*  
Return a JSON object containing three reports:  
1\. \*\*Income Statement:\*\* Calculate Total Revenues (Accounts 4xxx) minus Total Expenses (Accounts 5xxx, 6xxx). Return \`net\_profit\`.  
2\. \*\*Statement of Financial Position (Balance Sheet):\*\* Group Current Assets, Non-Current Assets, Current Liabilities, Long-Term Liabilities, and Equity. Include the \`net\_profit\` from the Income Statement into the Equity section. Check that Assets \= Liabilities \+ Equity.  
3\. \*\*Statement of Cash Flows:\*\* Classify cash-related transactions into Operating, Investing, and Financing activities.

\*\*F. \`processClosingEntries(period)\` (Ref: \`generateClosingEntries\`)\*\*  
\- Create an automated script to close the books at the end of the period.  
\- Generate system transactions to zero out all temporary accounts (\`is\_temporary \= true\`).  
\- Transfer the net difference (Net Income/Loss) into the "Retained Earnings" account (Account code: 3200).

\#\# 3\. Strict Accounting Rules & Validations  
\- \*\*Double-Entry Enforcement:\*\* Do not allow any manual journal entry where Total Debit \!= Total Credit.  
\- \*\*Immutability:\*\* Once a transaction is recorded and the period is closed, it cannot be deleted. Corrections must use reversing entries or adjustment types.  
\- \*\*Precision:\*\* Use decimal/numeric types for currency to avoid floating-point errors.

\#\# Output Format Request  
Please provide:  
1\. The Database Schema (Prisma/Sequelize/SQL or equivalent).  
2\. The core Service/Utility Classes for the accounting cycle functions described above.  
3\. Keep the code modular so the Financial Statement generation can be accessed via an API endpoint.