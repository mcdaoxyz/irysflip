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

// Fungsi untuk mendeteksi wallet yang tersedia
export function detectAvailableWallets() {
  const wallets = [];
  
  // Deteksi MetaMask
  if (window.ethereum && window.ethereum.isMetaMask) {
    wallets.push({
      name: 'MetaMask',
      provider: window.ethereum,
      icon: '🦊'
    });
  }
  
  // Deteksi OKX Wallet
  if (window.okxwallet) {
    wallets.push({
      name: 'OKX Wallet',
      provider: window.okxwallet,
      icon: '🟢'
    });
  }
  
  // Deteksi Coinbase Wallet
  if (window.ethereum && window.ethereum.isCoinbaseWallet) {
    wallets.push({
      name: 'Coinbase Wallet',
      provider: window.ethereum,
      icon: '🔵'
    });
  }
  
  // Deteksi Trust Wallet
  if (window.ethereum && window.ethereum.isTrust) {
    wallets.push({
      name: 'Trust Wallet',
      provider: window.ethereum,
      icon: '🟡'
    });
  }
  
  // Deteksi Binance Wallet
  if (window.ethereum && window.ethereum.isBinanceWallet) {
    wallets.push({
      name: 'Binance Wallet',
      provider: window.ethereum,
      icon: '🟠'
    });
  }
  
  // Deteksi Phantom Wallet (jika mendukung EVM)
  if (window.phantom && window.phantom.ethereum) {
    wallets.push({
      name: 'Phantom',
      provider: window.phantom.ethereum,
      icon: '👻'
    });
  }
  
  // Deteksi Brave Wallet
  if (window.ethereum && window.ethereum.isBraveWallet) {
    wallets.push({
      name: 'Brave Wallet',
      provider: window.ethereum,
      icon: '🦁'
    });
  }
  
  // Deteksi WalletConnect (jika sudah terinstall)
  if (window.WalletConnect) {
    wallets.push({
      name: 'WalletConnect',
      provider: window.WalletConnect,
      icon: '🔗'
    });
  }
  
  // Deteksi wallet lain yang mungkin ada
  if (window.ethereum && !wallets.some(w => w.provider === window.ethereum)) {
    wallets.push({
      name: 'Ethereum Wallet',
      provider: window.ethereum,
      icon: '💎'
    });
  }
  
  // Deteksi wallet lain yang mungkin menggunakan nama berbeda
  if (window.ethereum && window.ethereum.providers) {
    // Beberapa wallet menggunakan ethereum.providers array
    window.ethereum.providers.forEach((provider, index) => {
      if (!wallets.some(w => w.provider === provider)) {
        let walletName = 'Unknown Wallet';
        let icon = '🔗';
        
        if (provider.isMetaMask) {
          walletName = 'MetaMask';
          icon = '🦊';
        } else if (provider.isCoinbaseWallet) {
          walletName = 'Coinbase Wallet';
          icon = '🔵';
        } else if (provider.isTrust) {
          walletName = 'Trust Wallet';
          icon = '🟡';
        } else if (provider.isBinanceWallet) {
          walletName = 'Binance Wallet';
          icon = '🟠';
        } else if (provider.isBraveWallet) {
          walletName = 'Brave Wallet';
          icon = '🦁';
        }
        
        wallets.push({
          name: walletName,
          provider: provider,
          icon: icon
        });
      }
    });
  }
  
  return wallets;
}

// Fungsi untuk memastikan jaringan Irys Testnet
async function ensureIrysNetwork(providerObj) {
  try {
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
  } catch (error) {
    console.error('Error switching network:', error);
    throw new Error('Failed to switch to Irys Testnet network');
  }
}

// Fungsi utama untuk connect wallet
export async function connectWallet(walletProvider = null) {
  let providerObj = walletProvider;
  
  // Jika tidak ada provider yang diberikan, coba deteksi otomatis
  if (!providerObj) {
    const availableWallets = detectAvailableWallets();
    
    if (availableWallets.length === 0) {
      throw new Error("Tidak ada wallet yang terdeteksi. Pastikan Anda telah menginstall MetaMask, OKX Wallet, atau wallet EVM lainnya.");
    }
    
    // Gunakan wallet pertama yang tersedia (biasanya MetaMask)
    providerObj = availableWallets[0].provider;
    console.log(`Menggunakan wallet: ${availableWallets[0].name}`);
  }
  
  try {
    // Pastikan user di jaringan Irys Testnet
    await ensureIrysNetwork(providerObj);
    
    // Request koneksi wallet
    await providerObj.request({ method: 'eth_requestAccounts' });
    
    // Buat provider dan signer
    const provider = new ethers.BrowserProvider(providerObj);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return { 
      provider, 
      signer, 
      address,
      providerObj 
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error(`Gagal menghubungkan wallet: ${error.message}`);
  }
}

// Fungsi untuk mendapatkan daftar wallet yang tersedia
export function getAvailableWallets() {
  return detectAvailableWallets();
}

// Fungsi untuk connect ke wallet tertentu
export async function connectToSpecificWallet(walletName) {
  const availableWallets = detectAvailableWallets();
  const targetWallet = availableWallets.find(w => w.name === walletName);
  
  if (!targetWallet) {
    throw new Error(`Wallet ${walletName} tidak ditemukan atau tidak terinstall`);
  }
  
  return await connectWallet(targetWallet.provider);
} 