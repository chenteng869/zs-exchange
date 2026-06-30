import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58';

const privateKey = process.env.SOLANA_TOKEN_AUTHORITY_PRIVATE_KEY;
if (!privateKey) {
  throw new Error('SOLANA_TOKEN_AUTHORITY_PRIVATE_KEY is required');
}
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
const mintAddress = new PublicKey('HVndD9wqkE7KXk4cN93K4nRNbUoXQK44UtwbKhtqmv5V');

async function main() {
  console.log('=== CONNECTING TO SOLANA DEVNET ===');
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const balance = await connection.getBalance(keypair.publicKey);
  console.log('Wallet Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
  
  console.log('\n=== MINT ADDRESS ===');
  console.log('Mint:', mintAddress.toBase58());
  
  console.log('\n=== CHECKING TOKEN ACCOUNT ===');
  let tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    mintAddress,
    keypair.publicKey
  );
  
  console.log('Token Account:', tokenAccount.address.toBase58());
  
  console.log('\n=== MINTING TOKENS ===');
  const amount = 1000000;
  await mintTo(
    connection,
    keypair,
    mintAddress,
    tokenAccount.address,
    keypair.publicKey,
    amount * 1000000
  );
  
  console.log(`✅ Minted ${amount} tokens!`);
  
  console.log('\n=== ADDING TOKEN METADATA ===');
  const metadataPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(), mintAddress.toBuffer()],
    new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
  )[0];
  
  const metadataInstruction = createCreateMetadataAccountV3Instruction({
    metadata: metadataPDA,
    mint: mintAddress,
    mintAuthority: keypair.publicKey,
    payer: keypair.publicKey,
    updateAuthority: keypair.publicKey,
  }, {
    createMetadataAccountArgsV3: {
      data: {
        name: '福建老酒',
        symbol: 'FJW',
        uri: 'https://raw.githubusercontent.com/your-project/token-metadata/main/fujian-wine.json',
        sellerFeeBasisPoints: 500,
        creators: [
          {
            address: keypair.publicKey,
            verified: true,
            share: 100,
          },
        ],
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    },
  });
  
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  const transaction = new (require('@solana/web3.js').Transaction)({
    recentBlockhash: blockhash,
    feePayer: keypair.publicKey,
  });
  
  transaction.add(metadataInstruction);
  transaction.sign(keypair);
  
  const txHash = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction({
    signature: txHash,
    blockhash,
    lastValidBlockHeight,
  });
  
  console.log('✅ Token Metadata Added!');
  console.log('Metadata Address:', metadataPDA.toBase58());
  console.log('Transaction:', txHash);
  
  console.log('\n=== TOKEN INFORMATION ===');
  console.log('────────────────────────────────');
  console.log('Token Name:     福建老酒 (Fujian Aged Wine)');
  console.log('Token Symbol:   FJW');
  console.log('Decimals:       6');
  console.log('Total Supply:   1,000,000 FJW');
  console.log('────────────────────────────────');
  console.log('Mint Address:   ', mintAddress.toBase58());
  console.log('Token Account:  ', tokenAccount.address.toBase58());
  console.log('Metadata:       ', metadataPDA.toBase58());
  console.log('────────────────────────────────');
  console.log('Explorer URL:   https://explorer.solana.com/address/' + mintAddress.toBase58() + '?cluster=devnet');
  console.log('────────────────────────────────');
}

main().catch(e => console.error('Error:', e));
