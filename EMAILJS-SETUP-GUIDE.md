# EmailJS Setup Guide for This or That App

## Overview

The email functionality uses **EmailJS**, a service that provides client-side email sending through their API. This eliminates the need to set up your own SMTP server or backend email handling.

## How EmailJS Works

```
[Your App] → [EmailJS API] → [Email Provider] → [Recipient]
    ↓              ↓              ↓              ↓
Client-side    Cloud Service   Gmail/Outlook   User's Inbox
JavaScript     (SMTP handling)  (Actual sending)
```

## Setup Steps

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (1000 emails/month free)
3. Verify your email address

### 2. Add Email Service

1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail** (recommended for personal use)
   - **Outlook** (for Microsoft accounts)
   - **SendGrid** (for production apps)
   - **Mailgun** (for high volume)
4. Follow the connection wizard
5. Note your **Service ID** (e.g., `service_abc123`)

### 3. Create Email Template

1. Go to "Email Templates" in dashboard
2. Click "Create New Template"
3. Use this template structure:

```html
Subject: Your Design Preference Profile - This or That Results

HTML Content:
{{{message_html}}}

Text Content:
{{{message_text}}}

Template Variables:
- to_email: {{to_email}}
- cc_email: {{cc_email}}
- user_name: {{user_name}}
- total_choices: {{total_choices}}
- completed_date: {{completed_date}}
```

4. Save and note your **Template ID** (e.g., `template_xyz789`)

### 4. Get Public Key

1. Go to "Account" → "General"
2. Copy your **Public Key** (e.g., `user_abc123xyz`)

### 5. Update Configuration

Edit `js/email.js` and update the configuration:

```javascript
const EMAIL_CONFIG = {
    serviceId: 'service_abc123',        // Your Service ID
    templateId: 'template_xyz789',      // Your Template ID
    publicKey: 'user_abc123xyz'         // Your Public Key
};
```

## Testing the Setup

1. Open the test page: `test-email-browser.html`
2. Fill in valid email addresses
3. Click "Send Results"
4. Check your email inbox

## Production Considerations

### Security

- EmailJS public key is safe to expose (it's designed for client-side use)
- Rate limiting is handled by EmailJS (1000 emails/month on free tier)
- No sensitive server credentials needed

### Reliability

- EmailJS has 99.9% uptime SLA
- Automatic retry logic for failed sends
- Delivery status tracking available

### Alternatives

If you prefer other solutions:

1. **Formspree** - Similar service, form-focused
2. **Netlify Forms** - If hosting on Netlify
3. **Backend API** - Build your own email service
4. **mailto: links** - Simple but limited

## Cost Structure

- **Free Tier**: 1,000 emails/month
- **Personal**: $15/month for 10,000 emails
- **Professional**: $50/month for 50,000 emails

## Current Implementation Status

✅ **Implemented**: Client-side code, templates, validation, error handling
⏳ **Needs Setup**: EmailJS account configuration (5-10 minutes)
🚀 **Ready**: Once configured, emails will send immediately

## Why This Approach?

1. **No Backend Required**: Pure client-side solution
2. **Professional Templates**: HTML and text versions
3. **Reliable Delivery**: Uses established email providers
4. **Easy Setup**: No server configuration needed
5. **Scalable**: Handles growth automatically

The implementation is complete - it just needs the EmailJS account setup to start sending real emails!
