import { createThirdwebClient } from "thirdweb";
import { createWallet } from "thirdweb/wallets";
import { defineChain } from "thirdweb/chains";

// Create the ThirdWeb client
// Get your client ID from: https://thirdweb.com/dashboard/settings/api-keys
// Using a placeholder ID for development - replace with your actual client ID
console.log('🔧 Thirdweb Client ID:', import.meta.env.VITE_THIRDWEB_CLIENT_ID)
console.log('🔧 All env vars:', import.meta.env)

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "placeholder-client-id-replace-me",
});

// Define ApeChain Curtis testnet chain (matching Cryptoku working config)
export const curtisChain = defineChain({
  id: parseInt(import.meta.env.VITE_CHAIN_ID || "33111"), // ApeChain Curtis testnet
  rpc: import.meta.env.VITE_RPC_URL || "https://curtis.rpc.caldera.xyz/http",
  name: import.meta.env.VITE_CHAIN_NAME || "ApeChain Curtis Testnet",
  nativeCurrency: {
    name: "APE",
    symbol: "APE", 
    decimals: 18,
  },
});

// Define supported wallets
export const wallet = createWallet("io.metamask");

// Export commonly used wallets
export const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
];
