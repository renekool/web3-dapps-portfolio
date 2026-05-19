import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

// Constants from OpenSpec
const MAX_RELAYER_GAS = 1000000;
const GAS_MULTIPLIER = 1.2;

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;
const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS;

const FORWARDER_ABI = [
  "function verify((address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) public view returns (bool)",
  "function execute((address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) external payable",
  "function getNonce(address from) public view returns (uint256)"
];

const WHITELISTED_SELECTORS = [
  "0x943e8216", // vote(uint256,uint8)
  "0xcca5a8b2", // createProposal(address,uint256,string)
  "0xd0e30db0", // deposit()
  "0x0d61b519"  // executeProposal(uint256)
];

export async function POST(req: Request) {
  try {
    const { request, signature } = await req.json();

    if (!RELAYER_PRIVATE_KEY || !DAO_ADDRESS || !FORWARDER_ADDRESS) {
      return NextResponse.json({ error: 'Relayer not configured' }, { status: 500 });
    }

    // 1. Basic Validations
    if (!request || !signature) {
      return NextResponse.json({ error: 'Missing request or signature' }, { status: 400 });
    }

    if (request.from === ethers.ZeroAddress) {
      return NextResponse.json({ error: 'Invalid from address' }, { status: 400 });
    }

    // 2. Destination Validation
    if (request.to.toLowerCase() !== DAO_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid destination' }, { status: 403 });
    }

    // 3. Whitelist Validation (Function Selector)
    const selector = request.data.slice(0, 10);
    if (!WHITELISTED_SELECTORS.includes(selector)) {
      return NextResponse.json({ error: 'Function not whitelisted' }, { status: 403 });
    }

    // 4. Gas Validation
    if (BigInt(request.gas) > BigInt(MAX_RELAYER_GAS)) {
      return NextResponse.json({ error: 'Gas limit exceeds maximum allowed' }, { status: 403 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const forwarder = new ethers.Contract(FORWARDER_ADDRESS, FORWARDER_ABI, wallet);

    // 5. On-chain Nonce Validation
    const currentNonce = await forwarder.getNonce(request.from);
    console.log(`[Relayer] DEBUG: From ${request.from}, ReqNonce: ${request.nonce}, OnChainNonce: ${currentNonce}`);
    if (BigInt(request.nonce) !== currentNonce) {
      console.warn(`[Relayer] WARN: Invalid nonce for ${request.from}. Expected ${currentNonce}, got ${request.nonce}.`);
      return NextResponse.json({
        success: false,
        error: 'INVALID_NONCE',
        details: `Expected ${currentNonce}, got ${request.nonce}`
      }, { status: 400 });
    }

    // 6. Forwarder Verification (Pre-check)
    const isValid = await forwarder.verify(request, signature);
    if (!isValid) {
      console.error(`[Relayer] ERROR: Signature verification failed for ${request.from}`);
      return NextResponse.json({
        success: false,
        error: 'INVALID_SIGNATURE'
      }, { status: 400 });
    }

    // 7. Relayer Balance Check
    const relayerBalance = await provider.getBalance(wallet.address);
    const minBalance = ethers.parseEther('0.01'); // Standard minimum
    if (relayerBalance < minBalance) {
      console.error(`[Relayer] CRITICAL: Insufficient funds for relayer (${ethers.formatEther(relayerBalance)} ETH).`);
      return NextResponse.json({
        success: false,
        error: 'RELAYER_INSUFFICIENT_FUNDS',
        details: `Relayer balance ${ethers.formatEther(relayerBalance)} ETH is below minimum ${ethers.formatEther(minBalance)} ETH.`
      }, { status: 503 });
    }

    // 8. Execution with Gas Multiplier
    console.log(`[Relayer] Executing meta-tx for ${request.from}...`);
    const gasLimit = BigInt(Math.floor(Number(request.gas) * GAS_MULTIPLIER));

    try {
      console.log(`[Relayer] Calling forwarder.execute with gas ${gasLimit}...`);
      const tx = await forwarder.execute(request, signature, {
        gasLimit: gasLimit,
        value: BigInt(request.value)
      });

      console.log(`[Relayer] Tx submitted: ${tx.hash}`);

      return NextResponse.json({
        success: true,
        txHash: tx.hash,
        status: 'submitted',
        relayerAddress: wallet.address
      });
    } catch (err: any) {
      console.error(`[Relayer] EXECUTION_FAILED for ${request.from}:`, err.message);
      return NextResponse.json({
        success: false,
        error: 'EXECUTION_FAILED',
        details: err.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Relayer Error]:', error);
    return NextResponse.json({ 
      error: error.message || 'Relay execution failed' 
    }, { status: 500 });
  }
}
