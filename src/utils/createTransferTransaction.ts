import { Transaction, SystemProgram, Connection } from '@solana/web3.js';
import { PhantomProvider } from '../types';

const createTransferTransaction = async (provider: PhantomProvider, connection: Connection) => {
  if (!provider.publicKey) return;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: provider.publicKey,
      lamports: 100,
    })
  );
  transaction.feePayer = provider.publicKey;

  const anyTransaction: any = transaction;
  anyTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return transaction;
};

export default createTransferTransaction;
