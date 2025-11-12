[← Back to README](README.md)

# Brevo (Sendinblue) Credentials Setup

Brevo is used for sending email verification links during user signup.

## Steps to Get Brevo Credentials

### 1. Create a Brevo Account
1. Go to [https://www.brevo.com](https://www.brevo.com)
2. Click **"Sign up free"** or **"Get started"**
3. Complete the registration process with your email address
4. Verify your email address if required

### 2. Verify Your Sender Domain (Recommended for Production)
1. Log in to your Brevo account
2. Navigate to **Settings** → **Senders** → **Domains**
3. Add your domain (e.g., `yourdomain.com`)
4. Follow the DNS verification steps:
   - Add the provided SPF record to your domain's DNS
   - Add the provided DKIM record to your domain's DNS
   - Add the provided DMARC record (optional but recommended)
5. Wait for verification (usually takes a few minutes to a few hours)

**Note:** For development/testing, you can use the default sender email provided by Brevo, but domain verification is required for production.

### 3. Get Your API Key
1. In your Brevo dashboard, go to **Settings** → **SMTP & API**
2. Click on the **"API Keys"** tab
3. Click **"Generate a new API key"**
4. Give it a name (e.g., "Finance App Production" or "Finance App Development")
5. Select the appropriate permissions:
   - **Send emails** (required)
   - **Manage account** (optional, for advanced features)
6. Click **"Generate"**
7. **Copy the API key immediately** - it will only be shown once!

### 4. Configure Sender Information
1. Go to **Settings** → **Senders**
2. If using a verified domain:
   - Click **"Add a sender"**
   - Enter your email address (e.g., `no-reply@yourdomain.com`)
   - Verify the email address if required
3. If using Brevo's default sender:
   - Note the default sender email provided by Brevo
   - This is typically in the format: `your-username@sendinblue.com`

### 5. Set Up Environment Variables
Add the following to your `.env.local` file:

```env
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=no-reply@yourdomain.com
BREVO_SENDER_NAME=Your App Name
```

**Replace:**
- `your_brevo_api_key_here` with the API key you generated in step 3
- `no-reply@yourdomain.com` with your verified sender email
- `Your App Name` with your application name (e.g., "Finance App")

### 6. Test Your Setup
1. Send a test email using the Brevo API or dashboard
2. Verify that emails are being delivered correctly
3. Check spam folders if emails don't arrive

## Free Tier Limits
- Brevo free tier includes:
  - 300 emails per day
  - Unlimited contacts
  - Basic email templates
- For production, consider upgrading to a paid plan for higher limits

## Security Best Practices
- **Never commit API keys to version control**
- Store credentials in `.env.local` (which should be in `.gitignore`)
- Use different API keys for development and production
- Rotate API keys periodically
- Monitor API usage in the Brevo dashboard

## Troubleshooting
- **Emails not sending**: Check API key permissions and sender verification status
- **Emails going to spam**: Ensure SPF, DKIM, and DMARC records are properly configured
- **Rate limiting**: Check your daily email limit in the Brevo dashboard
- **API errors**: Verify the API key is correct and has the necessary permissions

## Additional Resources
- [Brevo API Documentation](https://developers.brevo.com/)
- [Brevo SMTP Documentation](https://help.brevo.com/hc/en-us/articles/209467485)
- [Brevo Support](https://help.brevo.com/)

