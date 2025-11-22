type MailhogMessage = {
  Content: {
    Headers: Record<string, string[]>
    Body: string
  }
  MIME?: {
    Parts?: Array<{
      Headers?: Record<string, string[]>
      Body: string
    }>
  }
}

const MAIL_POLL_ATTEMPTS = 20
const MAIL_POLL_DELAY_MS = 500

function waitForEmail(
  to: string,
  subjectRegex: RegExp,
  attempt = 0
): Cypress.Chainable<MailhogMessage> {
  return cy
    .task<MailhogMessage[]>('mailhog:getMessages', { to })
    .then((messages) => {
      const match = messages.find((message) => {
        const subject = message.Content?.Headers?.Subject?.[0] || ''
        return subjectRegex.test(subject)
      })

      if (match) {
        return cy.wrap(match)
      }

      if (attempt >= MAIL_POLL_ATTEMPTS) {
        throw new Error(
          `Expected email with subject matching ${subjectRegex} for ${to}, but none arrived.`
        )
      }

      return cy.wait(MAIL_POLL_DELAY_MS).then(() =>
        waitForEmail(to, subjectRegex, attempt + 1)
      )
    })
}

function decodeEmailBody(message: MailhogMessage): string {
  const parts = message.MIME?.Parts || []
  const preferredPart =
    parts.find((part) =>
      /text\/plain/i.test(part.Headers?.['Content-Type']?.[0] || '')
    ) ||
    parts.find((part) =>
      /text\/html/i.test(part.Headers?.['Content-Type']?.[0] || '')
    )

  const rawBody = preferredPart?.Body || message.Content?.Body || ''

  return rawBody
    .replace(/=\r?\n/g, '')
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    )
}

function extractTokenFromMessage(message: MailhogMessage): string {
  const body = decodeEmailBody(message)
  const match = body.match(/token=([A-Za-z0-9_-]+)/)
  if (!match) {
    throw new Error('Token not found in email body')
  }
  return match[1]
}

describe('Phase 1 - Auth Routes', () => {
  beforeEach(() => {
    cy.task('mailhog:clear')
  })

  it('covers signup, verification, login, forgot password, and reset flows via APIs', () => {
    const uniqueEmail = `phase1+${Date.now()}@example.com`
    const initialPassword = 'Password123!'
    const updatedPassword = 'Password456!'

    cy.request('POST', '/api/auth/signup-request', { email: uniqueEmail })
      .its('body.success')
      .should('eq', true)

    waitForEmail(uniqueEmail, /verify your email/i).then((message) => {
      const verificationToken = extractTokenFromMessage(message)
      cy.request('GET', `/api/auth/verify?token=${verificationToken}`)
        .its('body.data.verified')
        .should('eq', true)

      cy.request('POST', '/api/auth/set-password', {
        token: verificationToken,
        password: initialPassword,
      })
        .its('body.success')
        .should('eq', true)
    })

    cy.then(() => {
      cy.request('POST', '/api/auth/login', {
        email: uniqueEmail,
        password: initialPassword,
      })
        .its('status')
        .should('eq', 200)

      cy.request('/api/auth/session')
        .its('body.data.user.email')
        .should('eq', uniqueEmail)

      cy.request('POST', '/api/auth/logout')
        .its('status')
        .should('eq', 200)

      cy.request({
        url: '/api/auth/session',
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 401)
    })

    cy.task('mailhog:clear')

    cy.request('POST', '/api/auth/forgot-password-request', {
      email: uniqueEmail,
    })
      .its('body.success')
      .should('eq', true)

    waitForEmail(uniqueEmail, /reset your password/i).then((message) => {
      const resetToken = extractTokenFromMessage(message)
      cy.request('GET', `/api/auth/reset-password-verify?token=${resetToken}`)
        .its('body.data.verified')
        .should('eq', true)

      cy.request('POST', '/api/auth/reset-password', {
        token: resetToken,
        password: updatedPassword,
      })
        .its('body.success')
        .should('eq', true)
    })

    cy.then(() => {
      cy.request('POST', '/api/auth/login', {
        email: uniqueEmail,
        password: updatedPassword,
      })
        .its('status')
        .should('eq', 200)

      cy.request('/api/auth/session')
        .its('body.data.user.email')
        .should('eq', uniqueEmail)

      cy.request('POST', '/api/auth/logout')
        .its('status')
        .should('eq', 200)
    })
  })

  it('allows a verified user to delete their account and invalidates the session', () => {
    const uniqueEmail = `phase1-delete-${Date.now()}@example.com`
    const password = 'Password123!'

    cy.request('POST', '/api/auth/signup-request', { email: uniqueEmail })
      .its('body.success')
      .should('eq', true)

    waitForEmail(uniqueEmail, /verify your email/i).then((message) => {
      const verificationToken = extractTokenFromMessage(message)

      cy.request('GET', `/api/auth/verify?token=${verificationToken}`)
        .its('body.data.verified')
        .should('eq', true)

      cy.request('POST', '/api/auth/set-password', {
        token: verificationToken,
        password,
      })
        .its('body.success')
        .should('eq', true)
    })

    cy.then(() => {
      cy.request('POST', '/api/auth/login', {
        email: uniqueEmail,
        password,
      })
        .its('status')
        .should('eq', 200)

      cy.request('DELETE', '/api/account')
        .its('body.message')
        .should('match', /deleted/i)

      cy.request({
        url: '/api/auth/session',
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 401)

      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        failOnStatusCode: false,
        body: {
          email: uniqueEmail,
          password,
        },
      })
        .its('status')
        .should('eq', 401)
    })
  })
})


export {}
