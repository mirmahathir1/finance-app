describe('Phase 0 - Health Checks', () => {
  it('verifies the health endpoint responds with ok:true', () => {
    cy.request('/api/health')
      .its('body')
      .should('include', { ok: true, database: 'connected' })
  })
})


export {}
