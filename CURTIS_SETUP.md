# CURTIS Testnet Setup Guide

## Environment Variables to Set in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

```
VITE_TOKEN_ADDRESS=0x[YOUR_CURTIS_CONTRACT_ADDRESS]
VITE_TOKEN_SYMBOL=CURTIS
VITE_TOKEN_DECIMALS=18
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
```

## What Changed

✅ **Balance Display**: Now shows CURTIS balance instead of ApeCoin
✅ **Payment Validation**: Checks CURTIS balance for paid games
✅ **Price Labels**: Shows "0.10 CURTIS" instead of "0.10 APE"
✅ **Dynamic Token**: Easy to switch between CURTIS testnet and APE mainnet

## Current Status

- 🚀 **Deployed**: Latest changes are live on `ape-in-game.vercel.app`
- ⚙️ **Pending**: Environment variables need to be set in Vercel
- 🔄 **After Setup**: Redeploy to activate CURTIS integration

## Next Steps

1. Get your CURTIS token contract address on CURTIS testnet
2. Add the environment variables to Vercel
3. Redeploy the project
4. Test with your CURTIS wallet

## Testing

Once configured, you should see:
- Your CURTIS balance in the wallet dropdown
- "0.10 CURTIS" pricing for paid games
- Balance validation before game creation
- Daily free games still work (no payment required)
