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

describe('Phase 4 - Backup & Restore', () => {
  beforeEach(() => {
    loginAsVerifiedUser()
  })

  it('exports CSV backup and restores custom data set', () => {
    cy.request({
      method: 'GET',
      url: '/api/backup',
      headers: {
        Accept: 'text/csv',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.headers['content-type']).to.include('text/csv')
      expect(response.body).to.include('profile,occurred_at,amount_minor,currency,type,tags,note')
    })

    const csv = [
      'profile,occurred_at,amount_minor,currency,type,tags,note,created_at,updated_at',
      'BackupProfile,2025-01-01,10500,USD,expense,"Supplies","Backup-expense","2025-01-01T00:00:00.000Z","2025-01-01T00:00:00.000Z"',
      'BackupProfile,2025-01-02,25000,USD,income,"Consulting","Backup-income","2025-01-02T00:00:00.000Z","2025-01-02T00:00:00.000Z"',
    ].join('\n')

    cy.request({
      method: 'POST',
      url: '/api/restore',
      body: csv,
      headers: {
        'Content-Type': 'text/csv',
        'X-Restore-Confirm': 'finance-app',
      },
    })
      .its('body.data.restored.transactionCount')
      .should('eq', 2)

    cy.request('/api/transactions?profile=BackupProfile')
      .its('body.data.transactions')
      .should((transactions) => {
        expect(transactions).to.have.length(2)
        expect(transactions.map((t: any) => t.note)).to.include.members([
          'Backup-expense',
          'Backup-income',
        ])
      })
  })
})



export {}
