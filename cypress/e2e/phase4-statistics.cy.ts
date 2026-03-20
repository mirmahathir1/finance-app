const verifiedEmail = 'demo+verified@finance-app.dev'
const verifiedPassword = 'Password123!'

function loginAsVerifiedUser() {
  cy.request('POST', '/api/auth/login', {
    email: verifiedEmail,
    password: verifiedPassword,
  })
    .its('status')
    .should('eq', 200)
}

describe('Phase 4 - Statistics', () => {
  beforeEach(() => {
    loginAsVerifiedUser()
  })

  it('returns Prisma-aggregated statistics with currency normalization', () => {
    const profileName = `StatsProfile-${Date.now()}`

    cy.request('POST', '/api/transactions', {
      profile: profileName,
      occurredAt: '2025-04-01',
      amountMinor: 50000,
      currency: 'USD',
      type: 'income',
      tags: ['Consulting'],
      note: 'Stats Income',
    }).its('status')
      .should('eq', 201)

    cy.request('POST', '/api/transactions', {
      profile: profileName,
      occurredAt: '2025-04-02',
      amountMinor: 20000,
      currency: 'EUR',
      type: 'expense',
      tags: ['Supplies'],
      note: 'Stats Expense EUR',
    }).its('status')
      .should('eq', 201)

    cy.request(
      `/api/statistics?profile=${encodeURIComponent(profileName)}&from=2025-04-01&to=2025-04-30&currency=USD&includeConverted=true`
    )
      .its('body.data')
      .should((data) => {
        expect(data.summary.totalIncome.amountMinor).to.eq(50000)
        expect(data.summary.totalExpense.amountMinor).to.eq(21739) // 20000 EUR -> USD conversion
        expect(data.summary.netBalance.amountMinor).to.eq(28261)
        expect(data.expenseBreakdown[0].tag).to.eq('Supplies')
        expect(data.incomeBreakdown[0].tag).to.eq('Consulting')
        expect(data.meta.skippedCurrencies).to.have.length(0)
      })
  })

  it('returns month calendar totals and converted transaction display values', () => {
    const profileName = `StatsCalendar-${Date.now()}`

    cy.request('POST', '/api/transactions', {
      profile: profileName,
      occurredAt: '2025-05-03',
      amountMinor: 125000,
      currency: 'USD',
      type: 'income',
      tags: ['Salary'],
      note: 'Salary USD',
    }).its('status')
      .should('eq', 201)

    cy.request('POST', '/api/transactions', {
      profile: profileName,
      occurredAt: '2025-05-03',
      amountMinor: 10000,
      currency: 'EUR',
      type: 'expense',
      tags: ['Travel'],
      note: 'Travel EUR',
    }).its('status')
      .should('eq', 201)

    cy.request(
      `/api/statistics/calendar?profile=${encodeURIComponent(profileName)}&month=2025-05&currency=USD&includeConverted=true`
    )
      .its('body.data')
      .should((data) => {
        expect(data.month).to.eq('2025-05')
        expect(data.currency).to.eq('USD')
        expect(data.days).to.have.length(1)
        expect(data.days[0].date).to.eq('2025-05-03')
        expect(data.days[0].totalIncome.amountMinor).to.eq(125000)
        expect(data.days[0].totalExpense.amountMinor).to.be.greaterThan(0)
      })

    cy.request(
      `/api/transactions?profile=${encodeURIComponent(profileName)}&from=2025-05-01&to=2025-05-31&currency=USD&displayCurrency=USD&includeConverted=true`
    )
      .its('body.data')
      .should((data) => {
        expect(data.transactions).to.have.length(2)
        const convertedExpense = data.transactions.find((transaction: any) => transaction.note === 'Travel EUR')
        expect(convertedExpense).to.exist
        expect(convertedExpense.displayCurrency).to.eq('USD')
        expect(convertedExpense.displayAmountMinor).to.be.greaterThan(0)
        expect(convertedExpense.displayWasConverted).to.eq(true)
        expect(convertedExpense.originalCurrency).to.eq('EUR')
      })
  })
})



export {}
