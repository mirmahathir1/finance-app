[← Back to README](README.md)

# Mock Email - Verification Link

<pre>
┌─────────────────────────────────────────────────────────┐
│  Email Client (Mock)                                    │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ From: no-reply@your.app                           │ │
│  │ To: user@example.com                              │ │
│  │ Subject: Verify Your Email Address                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Hello,                                           │ │
│  │                                                    │ │
│  │  Thank you for signing up for Finance App!       │ │
│  │                                                    │ │
│  │  Please verify your email address by clicking    │ │
│  │  the link below:                                   │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │                                              │ │ │
│  │  │  <a href="./verify.md">Verify Email Address</a>              │ │ │
│  │  │                                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Or copy and paste this link into your browser:  │ │
│  │  https://your.app/verify?token=mock_verification_token │ │
│  │                                                    │ │
│  │  This link will expire in 15 minutes.            │ │
│  │                                                    │ │
│  │  If you didn't create an account, you can safely │ │
│  │  ignore this email.                               │ │
│  │                                                    │ │
│  │  Best regards,                                    │ │
│  │  Finance App Team                                 │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ [Back to Sign Up] <a href="./signup.md">Sign Up</a>                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Purpose

This is a mock email page for demonstration purposes. In the actual application, users would receive this email via Brevo (Sendinblue) email service.

## Features

- **Realistic email format**: Shows how the verification email appears to users
- **Clickable verification link**: Links to the verify page with a mock token
- **Alternative link**: Shows the full URL for users who prefer to copy/paste
- **Expiration notice**: Reminds users the link expires in 15 minutes
- **Security note**: Includes message for users who didn't request the email

## User Flow

1. User clicks "Send Verification Link" on signup page
2. User is shown this mock email page
3. User clicks "Verify Email Address" link
4. User is redirected to verify page with token
5. Verification process continues as normal

