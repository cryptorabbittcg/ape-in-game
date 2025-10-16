import { createThirdwebClient } from "thirdweb";
import { createWallet } from "thirdweb/wallets";
import { defineChain } from "thirdweb/chains";

// Create the ThirdWeb client
// Get your client ID from: https://thirdweb.com/dashboard/settings/api-keys
// Using a placeholder ID for development - replace with your actual client ID
export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "placeholder-client-id-replace-me",
});

// Define CURTIS testnet chain (you'll need to update these values)
export const curtisChain = defineChain({
  id: parseInt(import.meta.env.VITE_CHAIN_ID || "1"), // Default to Ethereum mainnet
  rpc: import.meta.env.VITE_RPC_URL || "https://mainnet.infura.io/v3/your-project-id",
  name: import.meta.env.VITE_CHAIN_NAME || "CURTIS Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
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
