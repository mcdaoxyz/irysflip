// di utils/network.js
export const IRYS_CHAIN_ID = "0x4FE"; // 1270 hex

export async function switchToIrysOnly() {
  if (!window.ethereum) {
    throw new Error("MetaMask tidak terdeteksi");
  }
  try {
    // Cukup switch jaringan
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: IRYS_CHAIN_ID }],
    });
  } catch (err) {
    // 4902: chain belum dikenal oleh MetaMask
    if (err.code === 4902) {
      alert("Jaringan Irys Testnet belum ditambahkan di MetaMask.\n" +
            "Silakan tambahkan secara manual dulu sebelum lanjut.");
    } else {
      console.error("Gagal switch jaringan:", err);
      alert("Error saat switch jaringan: " + err.message || err.code);
    }
    throw err;
  }
}
