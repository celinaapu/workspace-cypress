# MongoDB + NextAuth + Stripe + Socket.io Setup Guide

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

### 1. MongoDB Configuration
```bash
# Get this from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/your-database-name?retryWrites=true&w=majority
```

**How to get MongoDB URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and new cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `your-database-name` with your database name

### 2. NextAuth Configuration
```bash
# Generate a random secret for NextAuth
NEXTAUTH_SECRET=your-super-secret-random-string-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**How to generate NEXTAUTH_SECRET:**
```bash
# Run this command in your terminal
openssl rand -base64 32
```

### 3. Stripe Configuration
```bash
# Get these from Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to get Stripe keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up for a free account
3. Go to Developers → API keys
4. Copy the "Publishable key" (starts with pk_)
5. Copy the "Secret key" (starts with sk_)
6. For webhook secret:
   - Go to Developers → Webhooks
   - Add endpoint: `http://localhost:3000/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`
   - Copy the signing secret

## Quick Setup Commands

### 1. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### 2. Install Dependencies (already done)
```bash
npm install @auth/mongodb-adapter bcryptjs
```

### 3. Start MongoDB Atlas
1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Whitelist your IP address (0.0.0.0/0 for development)
3. Create a database user with username and password

### 4. Setup Stripe Products
```bash
# After setting up Stripe, run your app and visit:
# http://localhost:3000/api/stripe/sync-products
# This will sync your Stripe products to MongoDB
```

## Complete .env.local Example

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blog-cypress?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_1234567890
STRIPE_SECRET_KEY=sk_test_1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890
```

## Testing Your Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Visit `http://localhost:3000/signup` to create an account
   - Visit `http://localhost:3000/login` to sign in

3. **Test database connection:**
   - After signing up, check MongoDB Atlas to see the user document

4. **Test Stripe integration:**
   - Try to create a workspace and upgrade to a paid plan

5. **Test Socket.io:**
   - Open two browser tabs with the same document
   - Edit in one tab and see real-time updates in the other

## Common Issues & Solutions

### MongoDB Connection Issues
- Make sure your IP is whitelisted in MongoDB Atlas
- Check that your username/password are correct
- Ensure the database name exists

### NextAuth Issues
- Make sure NEXTAUTH_SECRET is set
- Check that NEXTAUTH_URL matches your current URL
- For production, use HTTPS

### Stripe Issues
- Use test keys for development
- Make sure webhook endpoint is accessible
- Check Stripe logs for any failed events

### Socket.io Issues
- Socket.io works automatically with the current setup
- No additional configuration needed for development

## Production Deployment

When deploying to production:

1. **Update URLs:**
   ```bash
   NEXTAUTH_URL=https://your-domain.com
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

2. **Stripe Webhooks:**
   - Update webhook endpoint to `https://your-domain.com/api/webhooks/stripe`

3. **MongoDB:**
   - Keep the same MongoDB Atlas connection
   - Ensure production IP is whitelisted

4. **Environment Variables:**
   - Set all environment variables in your hosting platform
   - Never commit `.env.local` to git
