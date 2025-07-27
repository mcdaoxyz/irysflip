export const COINFLIP_ABI = [
  {
    "inputs": [
      { "internalType": "bool", "name": "guess", "type": "bool" }
    ],
    "name": "flip",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "guess", "type": "bool" },
      { "indexed": false, "internalType": "bool", "name": "win", "type": "bool" }
    ],
    "name": "BetPlaced",
    "type": "event"
  }
];
