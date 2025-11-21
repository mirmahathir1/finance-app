describe('Phase 0 - Health Checks', () => {
  it('verifies the health endpoint responds with ok:true', () => {
    cy.request('/api/health')
      .its('body')
      .should('include', { ok: true, database: 'connected' })
  })

  it('confirms seeded transactions exist after reset', () => {
    cy.task<number>('db:countTransactions').then((count) => {
      expect(count).to.be.greaterThan(0)
    })
  })
})


export {}
