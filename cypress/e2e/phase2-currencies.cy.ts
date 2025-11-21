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

describe('Phase 2 - Currencies', () => {
  beforeEach(() => {
    loginAsVerifiedUser()
  })

  it('loads the Manage Currencies screen', () => {
    cy.visit('/currencies')
    cy.contains('Manage Currencies').should('be.visible')
  })
})



export {}
