import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS;

export async function GET() {
  try {
    if (!RELAYER_ADDRESS) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Relayer address not configured' 
      }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(RELAYER_ADDRESS);
    const balanceInEth = parseFloat(ethers.formatEther(balance));

    // Deshabilitar si fondos < 0.05 ETH segun OpenSpec
    const isAvailable = balanceInEth >= 0.05;

    return NextResponse.json({
      status: isAvailable ? 'available' : 'low_funds',
      balance: balanceInEth,
      address: RELAYER_ADDRESS,
      threshold: 0.05,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Relayer Status Error]:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to fetch relayer status' 
    }, { status: 500 });
  }
}
