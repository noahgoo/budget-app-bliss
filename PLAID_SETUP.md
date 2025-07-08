# Plaid Integration Setup Guide

## Issue Diagnosis

The error "both fields are missing" occurs because the Plaid credentials are not properly configured in Firebase Functions.

## Step 1: Get Plaid Credentials

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/)
2. Navigate to Team Settings > Keys
3. Copy your **Client ID** and **Sandbox Secret**

## Step 2: Configure Firebase Functions

Run these commands in your terminal:

```bash
# Set Plaid Client ID
firebase functions:config:set plaid.client_id="YOUR_PLAID_CLIENT_ID"

# Set Plaid Secret (Sandbox)
firebase functions:config:set plaid.secret="YOUR_PLAID_SANDBOX_SECRET"
```

## Step 3: Verify Configuration

Check your configuration:

```bash
firebase functions:config:get
```

You should see:

```json
{
  "plaid": {
    "client_id": "your_client_id_here",
    "secret": "your_secret_here"
  }
}
```

## Step 4: Deploy Functions

```bash
firebase deploy --only functions
```

## Step 5: Test the Integration

1. Start your app: `npm start`
2. Go to the bank connection page
3. Click "Connect Bank Account"
4. You should see the Plaid Link interface

## Troubleshooting

### If you still get "missing fields" error:

1. **Check Firebase Functions Logs**:

   ```bash
   firebase functions:log
   ```

2. **Verify Configuration in Code**:
   The logs should show:

   ```
   Client ID: PRESENT
   Secret: PRESENT
   ```

3. **Common Issues**:
   - Make sure you're using the **Sandbox** secret, not Production
   - Ensure the configuration is set for the correct Firebase project
   - Check that you've deployed the functions after setting the config

### Local Development

For local testing, create a `.runtimeconfig.json` file in the `functions/` directory:

```json
{
  "plaid": {
    "client_id": "your_client_id_here",
    "secret": "your_sandbox_secret_here"
  }
}
```

Then run:

```bash
firebase emulators:start --only functions
```

## Environment Variables vs Firebase Config

- **Firebase Functions**: Use `functions.config()` (recommended for production)
- **Local Development**: Use `.runtimeconfig.json` file
- **Frontend**: Never expose Plaid credentials in frontend code

## Security Notes

- Never commit your Plaid credentials to version control
- Use different credentials for development and production
- The sandbox environment is safe for testing
