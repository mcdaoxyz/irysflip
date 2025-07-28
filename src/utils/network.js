// src/utils/network.js
export const IRYS_PARAMS = {
  chainId: "0x4FE", // 1270 dalam hex
  chainName: "Irys Testnet",
  nativeCurrency: {
    name: "IRYS",
    symbol: "IRYS",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.irys.xyz/v1/execution-rpc"],
  blockExplorerUrls: ["https://testnet-explorer.irys.xyz"],
};

export async function switchToIrys() {
  if (!window.ethereum) {
    throw new Error("MetaMask tidak terdeteksi");
  }
  try {
    // Coba switch ke Irys
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: IRYS_PARAMS.chainId }],
    });
  } catch (err) {
    // Jika chain belum ada di MetaMask (error code 4902), tambahkan dulu
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [IRYS_PARAMS],
      });
    } else {
      throw err;
    }
  }
}
