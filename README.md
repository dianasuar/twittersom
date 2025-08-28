ठीक है. नीचे पूरा **README.md** टेक्स्ट ब्लॉक दे रहा हूँ—जैसा-का-तैसा कॉपी-पेस्ट कर दो।

```markdown
# TWITTERSOM2

Web3 Twitter-style app with NFT profile pictures.  
**Stack:** Next.js (client) • Hardhat + Ethers (smart contracts) • Sanity (content) • IPFS/Pinata (storage)  
**Primary Network:** Somnia Testnet (optional Sepolia)

---

## TL;DR (quick deploy checklist)

1. Install deps  
   `cd client && npm i && cd ../smart_contract && npm i && cd ../studio && npm i`
2. Set env files  
   - `smart_contract/.env` → wallet key + RPC URLs  
   - `client/.env.local` → Sanity & Pinata keys
3. Compile + Deploy (Somnia)  
```

cd smart\_contract
npx hardhat compile
npx hardhat run scripts/deploy.js --network somniaTestnet

```
→ Console se **contract address** copy karo.
4. Frontend wire  
`client/lib/constants.js` me `contractAddress` set karo (minimal ABI niche diya hai)
5. Run  
- `cd client && npm run dev` (http://localhost:3000)  
- (optional) `cd studio && npm run dev` (http://localhost:3333)
6. Wallet  
MetaMask ko **Somnia Testnet** pe switch karo (guard snippet niche)

---

## Repo layout

```

client/          # Next.js UI
smart\_contract/  # Hardhat + Solidity
studio/          # Sanity Studio

````

---

## Prerequisites

- Node.js 18+  
- MetaMask browser extension  
- Sanity project (for profiles/feed)  
- (Optional) Pinata account (IPFS uploads)

---

## Install

```bash
# from repo root
cd client && npm install
cd ../smart_contract && npm install
cd ../studio && npm install
````

---

## Environment variables

### smart\_contract/.env

```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY                 # never commit this
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY  # optional
```

### client/.env.local

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_TOKEN=your_sanity_write_token
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret
```

> Sanity → API → CORS Origins me `http://localhost:3000` aur `http://127.0.0.1:3000` add karo (Allow credentials: ON).
> Secrets ko kabhi commit mat karo; `.env`, `.env.*` ko `.gitignore` me rakho.

---

## Hardhat config (Somnia + Sepolia)

**smart\_contract/hardhat.config.js**

```js
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const { PRIVATE_KEY, SOMNIA_RPC_URL, SEPOLIA_RPC_URL } = process.env;

module.exports = {
  solidity: '0.8.2',
  defaultNetwork: 'somniaTestnet',
  networks: {
    somniaTestnet: {
      url: SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network',
      chainId: 50312,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
```

**smart\_contract/scripts/deploy.js**

```js
const hre = require('hardhat');

async function main() {
  console.log('Deploying to:', hre.network.name, 'chainId:', hre.network.config.chainId);
  const Factory = await hre.ethers.getContractFactory('ProfileImageNfts');
  const contract = await Factory.deploy();                 // no constructor args
  await contract.deployed?.();                             // ethers v5
  const address = contract.address || (await contract.getAddress?.()); // v5/v6-safe
  console.log('ProfileImageNfts deployed at:', address);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Compile & deploy**

```bash
cd smart_contract
npx hardhat compile
npx hardhat run scripts/deploy.js --network somniaTestnet
# (or) npx hardhat run scripts/deploy.js --network sepolia
```

---

## Frontend wiring

**client/lib/constants.js**

```js
// Deployed address yahan paste karo:
export const contractAddress = '0xYOUR_DEPLOYED_ADDRESS';

// Minimal ABI (UI ko sirf mint chahiye)
export const contractABI = [
  {
    inputs: [
      { internalType: 'address', name: 'recipents', type: 'address' },
      { internalType: 'string',  name: '_uri',      type: 'string'  },
    ],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// Somnia guard ke liye chainId hex (optional)
export const REQUIRED_CHAIN_ID_HEX = '0xc488'; // 50312
```

> Agar Hardhat artifact import karte ho to `artifact.abi` (array) ko hi `new ethers.Contract` me pass karo. Pura artifact object pass mat karo.

---

## Force wallet to Somnia (before mint)

```js
// e.g. call this before sending any tx
export async function ensureSomnia() {
  const { ethereum } = window;
  const REQUIRED = '0xc488'; // 50312
  const current = await ethereum.request({ method: 'eth_chainId' });
  if (current !== REQUIRED) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: REQUIRED }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: REQUIRED,
            chainName: 'Somnia Testnet',
            nativeCurrency: { name: 'Somnia Test Token', symbol: 'STT', decimals: 18 },
            rpcUrls: ['https://dream-rpc.somnia.network/'],
            blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
          }],
        });
      } else { throw err; }
    }
  }
}
```

Mint flow me:

```js
await ensureSomnia();
// phir contract bana ke mint call karo
```

---

## Run apps

```bash
# client (Next.js UI)
cd client
npm run dev    # http://localhost:3000

# sanity studio (optional)
cd ../studio
npm run dev    # http://localhost:3333
```

---

## Mint flow (how it works)

1. Image upload → Pinata (IPFS)
2. Metadata JSON → IPFS
3. `new ethers.Contract(address, ABI, signer).mint(account, "ipfs://<jsonHash>")`
4. `await tx.wait()` → UI/Sanity update

---

## Troubleshooting

* **Invalid ABI / “invalid fragment object”** → ABI array hi pass karo (artifact.abi).
* **Wrong network** → `ensureSomnia()` call karo, MetaMask network check karo.
* **Sanity CORS** → localhost origins add + Allow credentials ON.
* **Tx stuck** → MetaMask nonce reset (Settings → Advanced), phir resend.
* **Hardhat peer-deps** → `hardhat@^2.26` + `@nomicfoundation/hardhat-toolbox@6.x`, ya `--legacy-peer-deps`.

---

## Security

* `.env`, secrets, private keys kabhi commit mat karo.
* `.env`, `.env.*` ko `.gitignore` me rakho.
* Key leak ho jaye to turant rotate karo.

---

## License

MIT (or your choice)

```

::contentReference[oaicite:0]{index=0}
```
