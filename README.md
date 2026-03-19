# Blockchain Certificate Verification System

A full-stack DApp for issuing and verifying cryptographic certificates using the Ethereum Blockchain, Node/Express, and Next.js.

## Directory Structure
- `blockchain/`: Hardhat workspace containing the Solidity Smart Contract `CertificateRegistry.sol`.
- `backend/`: Node.js Express server to handle API requests and MongoDB storage.
- `frontend/`: Next.js React application with MetaMask integration and Tailwind CSS.

---

## 🚀 Local Testing & Running
### 1. Smart Contract
1. Open a terminal to `blockchain/`.
2. Start the local Hardhat node:
   ```bash
   npx hardhat node
   ```
3. Open a second terminal to `blockchain/` and deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
*(Note: It will automatically copy the ABI and address to the frontend and backend).*

### 2. Backend
1. Open a terminal to `backend/`.
2. Ensure you have MongoDB running locally, or create a `.env` file with `MONGODB_URI`.
3. Start the server:
   ```bash
   node src/index.js
   ```

### 3. Frontend
1. Open a terminal to `frontend/`.
2. Create `.env.local` and add: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
3. Start the UI:
   ```bash
   npm run dev
   ```
4. Access the portal at [http://localhost:3000](http://localhost:3000). To issue certificates, ensure your MetaMask is connected to `localhost:8545`.

---

## 🌍 Production Deployment (Render + ETH Mainnet)

### Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get the connection string.

### Smart Contract (Mainnet or Sepolia)
1. In `blockchain/hardhat.config.js`, uncomment the networks and configure URL/Private Keys.
2. Run deployment:
   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```
3. Update the `CertificateRegistry.json` artifacts in the backend and frontend folders with the live contract address.

### Backend Deployment (Render)
1. Create a **Web Service** on Render pointing to your GitHub repo, root directory `backend/`.
2. Build Command: `npm install`
3. Start Command: `node src/index.js`
4. Add Environment Variables:
   - `MONGODB_URI`: your Atlas string
   - `RPC_URL`: Infura or Alchemy URL for Ethereum Mainnet
   - `PORT`: 5000

### Frontend Deployment (Render)
1. Create a **Web Service** on Render, root directory `frontend/`.
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL (e.g., https://cert-backend.onrender.com/api)
