import { ethers } from "ethers";

// Connect OKX Wallet (must be installed in browser)
export async function connectOKXWallet() {
  if (!window.okxwallet) {
    alert("OKX Wallet extension belum terinstall!");
    return null;
  }
  await window.okxwallet.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.okxwallet);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}
