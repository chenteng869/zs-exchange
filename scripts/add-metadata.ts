import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { tokenMetadataInitialize } from '@solana/spl-token';
import bs58 from 'bs58';

const privateKey = '5GpEzchnfiu1S3SQxGBgxcsWtKaVehEh4KDT4eY7baT214YZebSkr5wPLrubK8PSLTsV2epVAig48DaYTE8BbNys';
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
const mintAddress = new PublicKey('HVndD9wqkE7KXk4cN93K4nRNbUoXQK44UtwbKhtqmv5V');

async function main() {
  console.log('=== CONNECTING TO SOLANA DEVNET ===');
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const balance = await connection.getBalance(keypair.publicKey);
  console.log('Balance:', balance / 1000000000, 'SOL');
  
  console.log('\n=== MINT ADDRESS ===');
  console.log('Mint:', mintAddress.toBase58());
  
  console.log('\n=== ADDING TOKEN METADATA ===');
  const result = await tokenMetadataInitialize(
    connection,
    keypair,
    mintAddress,
    keypair.publicKey,
    keypair.publicKey,
    '福建老酒',
    'FJW',
    'https://raw.githubusercontent.com/your-project/token-metadata/main/fujian-wine.json'
  );
  
  console.log('✅ SUCCESS!');
  console.log('Transaction:', result.signature);
  
  console.log('\n=== TOKEN INFORMATION ===');
  console.log('────────────────────────────────');
  console.log('Token Name:     福建老酒 (Fujian Aged Wine)');
  console.log('Token Symbol:   FJW');
  console.log('Mint Address:   ', mintAddress.toBase58());
  console.log('────────────────────────────────');
  console.log('Explorer URL:   https://explorer.solana.com/address/' + mintAddress.toBase58() + '?cluster=devnet');
  console.log('────────────────────────────────');
}

main().catch(e => console.error('Error:', e));