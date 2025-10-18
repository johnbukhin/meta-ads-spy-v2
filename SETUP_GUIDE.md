# Meta API Credentials Setup Guide

This guide will walk you through obtaining the necessary Meta API credentials for your Meta Ads Spy service.

## Overview

To use the Meta Ads Library API, you need:
1. **Meta Developer Account** (free)
2. **Meta App** (free)
3. **Access Token** with `ads_read` permission
4. **Identity Verification** (required for full access)

## Step 1: Create Meta Developer Account

### 1.1 Visit Meta for Developers
Go to: https://developers.facebook.com

### 1.2 Sign Up/Login
- Click **"Get Started"** in the top right
- Use your existing Facebook account or create a new one
- **Important**: Use a real Facebook account that you can verify

### 1.3 Accept Developer Terms
- Read and accept the **Platform Policy** and **Terms of Service**
- Complete any required phone number verification

## Step 2: Create a Meta App

### 2.1 Create New App
1. From the Meta for Developers dashboard, click **"Create App"**
2. Choose **"Other"** as the use case
3. Click **"Next"**

### 2.2 App Details
1. **App Name**: Enter a name (e.g., "Meta Ads Spy Tool")
2. **App Contact Email**: Your email address
3. **Business Account**: Select your personal account or create a business account
4. Click **"Create App"**

### 2.3 Get App Credentials
Once created, you'll see your app dashboard:
- **App ID**: Copy this (you'll need it for `.env`)
- **App Secret**: Go to Settings > Basic, click "Show" next to App Secret

⚠️ **Security Note**: Never share your App Secret publicly or commit it to version control.

## Step 3: Generate Access Token

### 3.1 Access Graph API Explorer
1. From your app dashboard, go to **Tools > Graph API Explorer**
2. Or visit: https://developers.facebook.com/tools/explorer/

### 3.2 Configure Token Settings
1. **Application**: Select your newly created app
2. **User or Page**: Select "User Token"
3. **Permissions**: Click "Add a Permission"
4. Search for and add: `ads_read`
5. **Optional**: Also add `pages_read_engagement` for page info

### 3.3 Generate Token
1. Click **"Generate Access Token"**
2. Facebook will ask you to login and grant permissions
3. **Grant all requested permissions**
4. Copy the generated token - this is your `META_ACCESS_TOKEN`

### 3.4 Extend Token (Optional but Recommended)
Short-lived tokens expire in 1-2 hours. To get a longer-lived token:

1. Go to **Graph API Explorer**
2. Make a GET request to:
   ```
   /oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN
   ```
3. Replace `YOUR_APP_ID`, `YOUR_APP_SECRET`, and `YOUR_SHORT_TOKEN` with your values
4. Click **Submit** - you'll get a longer-lived token (60 days)

## Step 4: Identity Verification (REQUIRED)

### 4.1 Why Verification is Needed
- Meta requires identity verification to access political and social issue ads
- Without verification, you can only access a limited subset of ads
- The verification process ensures transparency in political advertising

### 4.2 Start Verification Process
1. Go to: https://www.facebook.com/ID
2. Click **"Confirm Your Identity"**
3. You may need to scroll down to find political advertising options

### 4.3 Verification Requirements
You'll need to provide:
- **Government-issued ID** (passport, driver's license, etc.)
- **Residential address**
- **Last 4 digits of SSN** (US residents)
- **Phone number verification**

### 4.4 Complete the Process
1. Upload clear photos of your ID
2. Verify your address (may require utility bill or bank statement)
3. Complete phone verification
4. Submit application

### 4.5 Wait for Approval
- **Processing time**: 24-48 hours typically
- **Status check**: Visit facebook.com/ID to check status
- **Email notification**: You'll receive confirmation when approved

## Step 5: Configure Your Application

### 5.1 Update .env File
Create/update your `.env` file with the credentials:

```env
META_ACCESS_TOKEN=your_access_token_here
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
PORT=3000
```

### 5.2 Test Your Setup
1. Start your application: `npm start`
2. Try a basic search to test connectivity
3. Check the console for any error messages

## Troubleshooting Common Issues

### Issue: "Invalid Access Token"
**Solutions:**
- Regenerate your access token
- Ensure you've added the `ads_read` permission
- Check if your token has expired

### Issue: "No Ads Found" for Basic Searches
**Possible Causes:**
- Identity verification not completed
- Searching for ads outside EU/Brazil without political tag
- API limitations on ad availability

**Solutions:**
- Complete identity verification process
- Try searching for political or social issue ads
- Test with keywords related to political campaigns

### Issue: "Rate Limit Exceeded"
**Solutions:**
- Wait for rate limit to reset (1 hour)
- Implement proper caching (already included in the app)
- Reduce search frequency

### Issue: "App Not Approved for Business Use"
**Solutions:**
- For personal use, current setup should work
- For business use, you may need App Review process
- Ensure your app complies with Meta's policies

## Advanced Configuration

### App Review (If Needed)
For production use or accessing additional data:
1. Go to your app dashboard
2. Navigate to **App Review**
3. Submit your app for review with detailed use case
4. Wait for Meta's approval (can take several weeks)

### Webhook Setup (Optional)
For real-time updates:
1. Set up a webhook endpoint in your app
2. Subscribe to relevant ad events
3. Configure in **Products > Webhooks**

### Business Account Benefits
Consider upgrading to a Business Manager account:
- Better API limits
- Advanced features
- Team collaboration tools
- Visit: https://business.facebook.com

## Security Best Practices

### 1. Protect Your Credentials
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate access tokens regularly

### 2. API Usage
- Respect rate limits (200 calls/hour)
- Implement proper error handling
- Cache responses to reduce API calls

### 3. Compliance
- Follow Meta's Platform Policy
- Respect data usage guidelines
- Implement proper data retention policies

## Quick Start Checklist

- [ ] Created Meta Developer account
- [ ] Created Meta App and got App ID/Secret
- [ ] Generated access token with `ads_read` permission
- [ ] Started identity verification process
- [ ] Updated `.env` file with credentials
- [ ] Tested basic API connectivity
- [ ] Waiting for identity verification approval

## Getting Help

### Meta Documentation
- **Ads Library API**: https://developers.facebook.com/docs/marketing-api/ad-library-api/
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Platform Policy**: https://developers.facebook.com/policy/

### Support Channels
- **Meta Developer Community**: https://developers.facebook.com/community/
- **Stack Overflow**: Tag questions with `facebook-graph-api`
- **Meta Business Help Center**: https://www.facebook.com/business/help

### Common Questions
**Q: How long does identity verification take?**
A: Usually 24-48 hours, but can take up to 5 business days.

**Q: Can I use this for commercial purposes?**
A: Yes, but ensure compliance with Meta's terms and consider app review for production use.

**Q: What if my verification is rejected?**
A: Review the rejection reason, fix any issues, and resubmit. Ensure all documents are clear and valid.

**Q: Do tokens expire?**
A: Yes, user tokens typically expire in 1-2 hours unless extended. App tokens don't expire but have other limitations.

## Next Steps

Once you have your credentials:
1. Test the Meta Ads Spy application
2. Explore different search parameters
3. Analyze competitor data
4. Consider implementing additional features like data export or alerts

Remember: The Meta Ads Library API has limitations on which ads are available. Political and social issue ads are available globally, while regular commercial ads are only available for EU and Brazil.