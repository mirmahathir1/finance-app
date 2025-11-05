# Currency Conversion System

## Overview
The app supports multi-currency tracking with automatic conversion for statistics and reporting. Exchange rates are stored per month to maintain historical accuracy. Users select their base currency during first-time setup, which serves as the reference point for all currency conversions.

## Conversion Logic

### Core Conversion Functions
```typescript
// Convert any currency to base currency (user's selected base currency)
function convertToBaseCurrency(
  amount: number, 
  fromCurrency: string, 
  baseCurrency: string,
  ratio: number
): number {
  if (fromCurrency === baseCurrency) return amount;
  // For other currencies: divide by ratio
  // Example (base=USD): 100 GBP with ratio 0.79 = 100 / 0.79 = 126.58 USD
  // Example (base=EUR): 100 GBP with ratio 0.86 = 100 / 0.86 = 116.28 EUR
  return amount / ratio;
}

// Convert from base currency to any currency
function convertFromBaseCurrency(
  amountInBase: number, 
  toCurrency: string, 
  baseCurrency: string,
  ratio: number
): number {
  if (toCurrency === baseCurrency) return amountInBase;
  // Multiply by ratio
  // Example (base=USD): 100 USD to GBP with ratio 0.79 = 100 * 0.79 = 79 GBP
  // Example (base=EUR): 100 EUR to GBP with ratio 0.86 = 100 * 0.86 = 86 GBP
  return amountInBase * ratio;
}

// Convert between any two currencies
function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  baseCurrency: string,
  fromRatio: number,
  toRatio: number
): number {
  // First convert to base currency, then to target currency
  const amountInBase = convertToBaseCurrency(amount, fromCurrency, baseCurrency, fromRatio);
  return convertFromBaseCurrency(amountInBase, toCurrency, baseCurrency, toRatio);
}
```

**Note:** All exchange rates are stored relative to the user's selected base currency. When the base currency is USD, a ratio of 0.79 for GBP means 1 USD = 0.79 GBP. If the base currency is EUR, the same ratio concept applies relative to EUR.

## Exchange Rate Management

### Adding New Currencies
1. User navigates to Manage Currencies page
2. Enters currency code (e.g., GBP), year, month, and exchange ratio
3. Ratio represents: **1 [Base Currency] = ratio × currency**
4. Example: If base is USD and 1 USD = 0.79 GBP, ratio is 0.79
5. Example: If base is EUR and 1 EUR = 0.86 GBP, ratio is 0.86
6. System validates and saves to `currencies.csv`
7. UI displays which currency is the base (e.g., "Exchange rates relative to USD")

### Using Currencies in Transactions
1. When creating expense/income, user selects date first
2. System extracts year and month from selected date
3. Loads available currencies for that specific month from `currencies.csv`
4. Populates currency dropdown with available options
5. If desired currency not available, user must add it via Manage Currencies

### Default Behavior
- User's base currency (selected during setup) is always available with ratio 1.0
- If no currencies defined for a month, only the base currency is available
- Users can define different exchange rates for different months
- The base currency serves as the reference point for all exchange rate calculations
- Base currency can be changed in settings, but will require recalculating all exchange rates

## Statistics Currency Conversion

### Aggregation Process
1. Load all transactions for selected month from `transactions-YYYY-MM.csv`
2. Filter transactions by `transactionType` for expenses and incomes separately
3. Identify all unique currencies used in transactions
4. Load exchange rates for those currencies from `currencies.csv`
5. User selects display currency from available options
6. Convert all transactions to display currency:
   ```typescript
   for (const transaction of transactions) {
     const ratio = exchangeRates[transaction.currency];
     const displayRatio = exchangeRates[displayCurrency];
     const convertedAmount = convertCurrency(
       transaction.amount,
       transaction.currency,
       displayCurrency,
       ratio,
       displayRatio
     );
     // Aggregate converted amounts by tag and type
     if (transaction.transactionType === 'expense') {
       aggregatedExpenses[transaction.tag] += convertedAmount;
     } else {
       aggregatedIncomes[transaction.tag] += convertedAmount;
     }
   }
   ```
7. Display pie chart and summary in selected currency

### Handling Missing Exchange Rates
- If transaction uses currency with no exchange rate for that month:
  - Show warning to user
  - Prompt to add exchange rate via Manage Currencies
  - Or exclude transaction from statistics with notification
  
### Example Scenario
**Transactions in November 2025:**
- Expense: $100 USD (Food)
- Expense: £50 GBP (Food)
- Income: €200 EUR (Salary)

**Exchange rates for November 2025:**
- USD: 1.0
- GBP: 0.79
- EUR: 0.92

**Statistics in USD:**
- Food expenses: $100 + (£50 / 0.79) = $100 + $63.29 = $163.29 USD
- Total Income: (€200 / 0.92) = $217.39 USD

**Statistics in GBP:**
- Food expenses: ($100 * 0.79) + £50 = £79 + £50 = £129 GBP
- Total Income: (€200 / 0.92) * 0.79 = $217.39 * 0.79 = £171.74 GBP

## Data Validation

### Currency Entry Validation
- Currency name: 3 uppercase letters (e.g., USD, GBP, EUR)
- Year: Valid 4-digit year
- Month: 1-12
- Ratio: Positive decimal number > 0

### Transaction Validation
- Currency must exist in `currencies.csv` for transaction's month
- Amount must be positive number
- All required fields must be filled

