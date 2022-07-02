import { Transaction, SystemProgram, Connection } from '@solana/web3.js';
import { PhantomProvider } from '../types';

/**
 * Creates an arbitrary transfer transaction
 * @param   {PhantomProvider} provider   a Phantom provider
 * @param   {Connection}      connection an RPC connection
 * @returns {Transaction}                a transaction
 */
const createTransferTransaction = async (provider: PhantomProvider, connection: Connection): Promise<Transaction> => {
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
