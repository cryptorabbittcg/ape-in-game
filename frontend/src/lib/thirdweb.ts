import { createThirdwebClient } from "thirdweb";
import { createWallet } from "thirdweb/wallets";

// Create the ThirdWeb client
// Get your client ID from: https://thirdweb.com/dashboard/settings/api-keys
// Using a placeholder ID for development - replace with your actual client ID
export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "placeholder-client-id-replace-me",
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
