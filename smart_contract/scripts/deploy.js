// smart_contract/scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const Factory = await hre.ethers.getContractFactory("ProfileImageNfts");
  const contract = await Factory.deploy();            // no constructor args
  await contract.waitForDeployment();                 // ethers v6 style
  const address = await contract.getAddress();
  console.log("ProfileImageNfts deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
