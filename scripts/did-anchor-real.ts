import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';
import bs58 from 'bs58';

const privateKey = process.env.DID_SOLANA_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('Missing DID_SOLANA_PRIVATE_KEY/PRIVATE_KEY environment variable');
}
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
const publicKey = keypair.publicKey.toBase58();

async function main() {
  console.log('=== WALLET INFO ===');
  console.log('Public Key:', publicKey);
  
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  console.log('\n=== CHECKING BALANCE ===');
  const balance = await connection.getBalance(keypair.publicKey);
  console.log('Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
  
  console.log('\n=== CREATING DID DOCUMENT ===');
  const did = `did:sol:${publicKey}`;
  const document = {
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
  console.log('DID:', document.id);
  
  console.log('\n=== ANCHORING DID TO SOLANA ===');
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  const documentJson = JSON.stringify(document);
  const memoText = `DID::${documentJson.slice(0, 500)}`;
  
  const memoInstruction = createMemoInstruction(memoText);
  
  const transaction = new Transaction({
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
  
  console.log('\n🎉 DID ANCHORED SUCCESSFULLY! 🎉');
  console.log('Transaction Hash:', txHash);
  console.log('Explorer URL:', `https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  console.log('Account URL:', `https://explorer.solana.com/address/${publicKey}?cluster=devnet`);
  console.log('DID:', did);
}

main().catch(e => console.error('Error:', e));