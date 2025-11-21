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

describe('Phase 3 - Transactions', () => {
  beforeEach(() => {
    loginAsVerifiedUser()
  })

  it('performs full CRUD and verifies statistics', () => {
    const profile = 'Personal'
    const note = `Phase3Tx-${Date.now()}`
    const updatedNote = `${note}-Updated`

    cy.request('POST', '/api/transactions', {
      profile,
      occurredAt: '2025-03-15',
      amountMinor: 7890,
      currency: 'USD',
      type: 'expense',
      tags: ['Food & Dining'],
      note,
    })
      .its('body.data.transaction.id')
      .as('transactionId')

    cy.get<string>('@transactionId').then((transactionId) => {
      cy.request(`/api/transactions/${transactionId}`)
        .its('body.data.transaction.note')
        .should('eq', note)
    })

    cy.visit('/transactions')
    cy.contains(note, { timeout: 10000 }).should('exist')

    cy.get<string>('@transactionId').then((transactionId) => {
      cy.request('PUT', `/api/transactions/${transactionId}`, {
        note: updatedNote,
        amountMinor: 9900,
      })
        .its('body.data.transaction.note')
        .should('eq', updatedNote)
    })

    cy.request(
      '/api/statistics?profile=Personal&from=2025-03-01&to=2025-03-31&currency=USD'
    )
      .its('body.data.summary.totalExpense.amountMinor')
      .should('be.greaterThan', 0)

    cy.visit('/transactions')
    cy.contains(updatedNote, { timeout: 10000 }).should('exist')

    cy.get<string>('@transactionId').then((transactionId) => {
      cy.request('DELETE', `/api/transactions/${transactionId}`)
        .its('body.success')
        .should('eq', true)
    })

    cy.visit('/transactions')
    cy.get('body').should('not.contain', updatedNote)
  })
})



export {}
