import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';
import bs58 from 'bs58';

const RPC_URL = 'https://api.devnet.solana.com';

async function createWallet(): Promise<{ keypair: Keypair; publicKey: string; privateKey: string }> {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKey = bs58.encode(keypair.secretKey);
  
  console.log('=== SOLANA WALLET CREATED ===');
  console.log(`Public Key: ${publicKey}`);
  console.log(`Private Key: ${privateKey}`);
  
  return { keypair, publicKey, privateKey };
}

async function getBalance(connection: Connection, publicKey: string): Promise<number> {
  const key = new PublicKey(publicKey);
  return await connection.getBalance(key);
}

async function requestAirdrop(connection: Connection, publicKey: string): Promise<string | null> {
  try {
    console.log('Trying to request airdrop...');
    const key = new PublicKey(publicKey);
    const signature = await connection.requestAirdrop(
      key,
      2 * LAMPORTS_PER_SOL
    );
    
    await connection.confirmTransaction(signature);
    console.log(`Airdrop successful! Signature: ${signature}`);
    return signature;
  } catch (error) {
    console.log(`Airdrop failed: ${error}`);
    return null;
  }
}

async function createDidDocument(publicKey: string): Promise<any> {
  const did = `did:sol:${publicKey}`;
  
  return {
    id: did,
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/solana/v1'],
    verificationMethod: [{
      id: `${did}#blockchainAccountId`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      blockchainAccountId: `solana:${publicKey}`,
      publicKeyBase58: publicKey,
    }],
    authentication: [`${did}#blockchainAccountId`],
    assertionMethod: [`${did}#blockchainAccountId`],
    keyAgreement: [],
    capabilityInvocation: [],
    capabilityDelegation: [],
    service: [],
    alsoKnownAs: [`https://explorer.solana.com/address/${publicKey}`],
  };
}

async function anchorDidOnChain(
  connection: Connection,
  keypair: Keypair,
  document: any
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  const documentJson = JSON.stringify(document);
  const memoText = `DID::${documentJson.slice(0, 500)}`;
  
  const memoInstruction = createMemoInstruction(memoText);
  
  const transaction = new (require('@solana/web3.js').Transaction)({
    recentBlockhash: blockhash,
    feePayer: keypair.publicKey,
  });
  
  transaction.add(memoInstruction);
  transaction.sign(keypair);
  
  const txHash = await connection.sendRawTransaction(transaction.serialize());
  
  const confirmation = await connection.confirmTransaction({
    signature: txHash,
    blockhash,
    lastValidBlockHeight,
  });
  
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${confirmation.value.err}`);
  }
  
  return txHash;
}

async function main() {
  console.log('\n🚀 Starting Solana DID On-Chain Process...\n');
  
  const { keypair, publicKey, privateKey } = await createWallet();
  
  const connection = new Connection(RPC_URL, { commitment: 'confirmed' });
  
  console.log('\n=== CHECKING BALANCE ===');
  let balance = await getBalance(connection, publicKey);
  console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.001 * LAMPORTS_PER_SOL) {
    console.log('\n=== REQUESTING AIRDROP ===');
    const airdropSig = await requestAirdrop(connection, publicKey);
    
    if (airdropSig) {
      balance = await getBalance(connection, publicKey);
      console.log(`Balance after airdrop: ${balance / LAMPORTS_PER_SOL} SOL`);
    } else {
      console.log('⚠️ Could not get airdrop. Trying faucet manually...');
      console.log(`Please visit: https://faucet.solana.com/ and paste this address: ${publicKey}`);
      console.log('Or visit: https://solana.fm/faucet');
    }
  }
  
  console.log('\n=== CREATING DID DOCUMENT ===');
  const document = await createDidDocument(publicKey);
  console.log(`DID: ${document.id}`);
  
  console.log('\n=== ANCHORING DID TO SOLANA ===');
  try {
    const txHash = await anchorDidOnChain(connection, keypair, document);
    
    console.log('\n🎉 DID ANCHORED SUCCESSFULLY! 🎉');
    console.log(`Transaction Hash: ${txHash}`);
    console.log(`Explorer URL: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    console.log(`Account URL: https://explorer.solana.com/address/${publicKey}?cluster=devnet`);
    console.log(`\nDID: ${document.id}`);
    console.log(`Private Key: ${privateKey}`);
  } catch (error) {
    console.log(`\n⚠️ On-chain anchoring failed: ${error}`);
    console.log('Using simulated anchoring mode...');
    
    const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log('\n✅ SIMULATED ANCHORING COMPLETE!');
    console.log(`Mock Transaction Hash: ${mockTxHash}`);
    console.log(`Account URL: https://explorer.solana.com/address/${publicKey}?cluster=devnet`);
    console.log(`\nDID: ${document.id}`);
    console.log(`Private Key: ${privateKey}`);
  }
}

main().catch(console.error);