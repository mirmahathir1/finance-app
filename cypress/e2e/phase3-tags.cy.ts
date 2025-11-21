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

describe('Phase 3 - Tags', () => {
  beforeEach(() => {
    loginAsVerifiedUser()
  })

  it('loads the Tags screen', () => {
    cy.visit('/tags')
    cy.contains('Edit Tags').should('be.visible')
  })
})



export {}
