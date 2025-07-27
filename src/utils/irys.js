import Irys from "@irys/sdk";
import { Query } from "@irys/query";

// Setting
const IRYS_NETWORK = "testnet";
const IRYS_NODE = "https://node1.testnet.irys.xyz";

// SAVE
export async function saveCoinflipResult({ result, timestamp, address, signer }) {
  if (!address || !result) throw new Error("address & result wajib");
  const irys = new Irys({
    url: IRYS_NODE,
    network: IRYS_NETWORK,
    token: "ethereum",
    wallet: signer
  });
  await irys.ready();

  const data = { result, timestamp, address };
  const tx = await irys.upload(JSON.stringify(data), {
    tags: [
      { name: "App", value: "IrysFlip" },
      { name: "Address", value: address }
    ]
  });

  const refKey = `coinflip-last-${address}`;
  await irys.mutable.set(refKey, JSON.stringify({ ...data, id: tx.id }));
  return tx.id;
}

/**
 * Ambil riwayat hasil coinflip (semua transaksi)
 * @param {string} address
 * @returns {Array}
 */
export async function fetchCoinflipHistory(address) {
  if (!address) return [];
  const query = new Query({ network: "devnet" }); // "devnet" jika testnet
  const params = {
    tags: [
      { name: "App", values: ["irysflip"] },
      { name: "User", values: [address] }
    ],
    limit: 20,
    order: "desc"
  };
  const results = await query.search(params);
  return results.map(item => {
    try {
      const data = JSON.parse(item.data);
      return { ...data, id: item.id };
    } catch {
      return { id: item.id, error: "Data parse error" };
    }
  });
}

// FETCH
export async function fetchCoinflipLatest(address) {
  if (!address) return null;
  const irys = new Irys({
    url: IRYS_NODE,
    network: IRYS_NETWORK
  });
  await irys.ready();
  const refKey = `coinflip-last-${address}`;
  try {
    const latest = await irys.mutable.get(refKey);
    if (!latest) return null;
    return JSON.parse(latest);
  } catch {
    return null;
  }
}
