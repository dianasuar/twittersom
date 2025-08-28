// client/lib/constants.js

// Your deployed Sepolia address
export const contractAddress =
  '0x0F3e057C243a724bC89220141087eb32B4c68fBF'

// Minimal ABI: only the function we call from the UI
export const contractABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipents", "type": "address" },
      { "internalType": "string",  "name": "_uri",      "type": "string" }
    ],
    "name": "mint",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
