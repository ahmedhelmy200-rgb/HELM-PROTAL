# 🔧 Troubleshooting Guide

## Problem: npm install fails
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Problem: Port 3000 is in use
**Solution:**
```bash
npm run dev -- -p 3001
```

## Problem: Build fails
**Solution:**
```bash
npm run build
# Check error messages
# Fix issues
npm run build
```

## Problem: Stripe keys not working
**Solution:**
1. Verify keys start with pk_test_ and sk_test_
2. No extra spaces
3. Reload browser
4. Check .env.local file

## Problem: Vercel deployment fails
**Solution:**
1. Check that npm run build works locally
2. Verify environment variables in Vercel
3. Check .env.local is in .gitignore
4. Review Vercel logs

## Still stuck?
Contact: support@primetrading.com
