import { Irys } from "@irys/sdk";

export function createIrys(signer) {
  return new Irys({
    url: "https://testnet-rpc.irys.xyz/v1/execution-rpc", // Testnet node
    network: "irys-testnet",
    token: "irys",   // Ganti sesuai chain/token (Polygon/Mumbai)
    wallet: signer,
  });
}
