const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const RPC_URL = env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
const RELAY_API = "http://localhost:3000/api/relay";
const FORWARDER_ADDRESS = env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS;
const DAO_ADDRESS = env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;

// Anvil Account #1 (User)
const USER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

async function testRelayer() {
  console.log("🚀 Starting Dynamic Gasless Relayer Test...");
  console.log(`DAO: ${DAO_ADDRESS}`);
  console.log(`Forwarder: ${FORWARDER_ADDRESS}`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const user = new ethers.Wallet(USER_PRIVATE_KEY, provider);
  
  console.log(`User address: ${user.address}`);

  // 0. Ensure user has some deposits
  const dao = new ethers.Contract(DAO_ADDRESS, ["function deposit() public payable"], user);
  console.log("Depositing 1 ETH...");
  const depTx = await dao.deposit({ value: ethers.parseEther("1.0") });
  await depTx.wait();

  // 1. Get Forwarder Nonce
  const forwarder = new ethers.Contract(
    FORWARDER_ADDRESS, 
    ["function getNonce(address from) public view returns (uint256)"], 
    provider
  );
  const nonce = await forwarder.getNonce(user.address);
  console.log(`Current Nonce: ${nonce.toString()}`);

  // 2. Encode Action: createProposal
  const daoInterface = new ethers.Interface([
    "function createProposal(address target, uint256 reqAmount, string descriptionURI)"
  ]);
  const data = daoInterface.encodeFunctionData("createProposal", [
    user.address, 
    ethers.parseEther("0.01"), 
    "ipfs://test-gasless-v2"
  ]); 

  // 3. Construct ForwardRequest
  const request = {
    from: user.address,
    to: DAO_ADDRESS,
    value: 0n,
    gas: 500000n,
    nonce: nonce,
    data: data
  };

  // 4. Sign EIP-712
  const domain = {
    name: "MinimalForwarder",
    version: "1",
    chainId: parseInt(env.NEXT_PUBLIC_CHAIN_ID || "31337"),
    verifyingContract: FORWARDER_ADDRESS
  };

  const types = {
    ForwardRequest: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "gas", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "data", type: "bytes" },
    ]
  };

  console.log("Signing EIP-712 request...");
  const signature = await user.signTypedData(domain, types, request);

  // 5. Send to Relayer
  const payload = {
    request: {
      from: request.from,
      to: request.to,
      value: request.value.toString(),
      gas: request.gas.toString(),
      nonce: request.nonce.toString(),
      data: request.data
    },
    signature
  };

  try {
    const response = await fetch(RELAY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("Relayer Response:", result);

    if (result.success) {
      console.log("✅ Test Passed: Relayer successfully processed the transaction!");
    } else {
      console.log("❌ Test Failed:", result.error);
    }
  } catch (err) {
    console.error("☠️ Error sending request:", err.message);
  }
}

testRelayer();
