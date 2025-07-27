import { ethers } from "ethers";

// Data jaringan Irys Testnet
const IRYS_CHAIN_ID = '0x4f6'; // 1270 hex
const IRYS_PARAMS = {
  chainId: IRYS_CHAIN_ID,
  chainName: 'Irys Testnet',
  rpcUrls: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'],
  nativeCurrency: { name: 'IRYS', symbol: 'IRYS', decimals: 18 },
  blockExplorerUrls: ['https://explorer.irys.xyz'],
};

// Fungsi cek & auto switch/add jaringan
async function ensureIrysNetwork(providerObj) {
  const chainId = await providerObj.request({ method: 'eth_chainId' });
  if (chainId !== IRYS_CHAIN_ID) {
    try {
      // Coba switch jaringan dulu
      await providerObj.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: IRYS_CHAIN_ID }],
      });
    } catch (switchError) {
      // Jika gagal (chain belum ada), maka add chain
      if (switchError.code === 4902) {
        await providerObj.request({
          method: 'wallet_addEthereumChain',
          params: [IRYS_PARAMS],
        });
      } else {
        throw switchError;
      }
    }
  }
}

// Fungsi utama untuk connect wallet
export async function connectOKXWallet() {
  const providerObj = window.okxwallet || window.ethereum;
  if (!providerObj) {
    alert("OKX Wallet extension belum terinstall!");
    return null;
  }
  // Pastikan user di jaringan Irys Testnet
  await ensureIrysNetwork(providerObj);

  await providerObj.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(providerObj);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}
