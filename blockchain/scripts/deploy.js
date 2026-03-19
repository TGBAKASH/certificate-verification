const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying CertificateRegistry...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();
  
  console.log("CertificateRegistry deployed to:", address);

  // Save the contract address and ABI to frontend and backend for easy access
  const artifact = await hre.artifacts.readArtifact("CertificateRegistry");
  const contractData = {
    address: address,
    abi: artifact.abi
  };

  const frontendPath = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendPath)) fs.mkdirSync(frontendPath, { recursive: true });
  fs.writeFileSync(path.join(frontendPath, "CertificateRegistry.json"), JSON.stringify(contractData, null, 2));
  
  const backendPath = path.join(__dirname, "../../backend/contracts");
  if (!fs.existsSync(backendPath)) fs.mkdirSync(backendPath, { recursive: true });
  fs.writeFileSync(path.join(backendPath, "CertificateRegistry.json"), JSON.stringify(contractData, null, 2));

  console.log("Contract artifact saved to frontend and backend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
