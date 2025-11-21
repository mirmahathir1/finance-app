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

describe('Phase 2 - Profiles', () => {
  beforeEach(() => {
    loginAsVerifiedUser()
  })

  it('loads the Manage Profiles screen', () => {
    cy.visit('/profiles')
    cy.contains('Manage Profiles').should('be.visible')
  })
})



export {}
