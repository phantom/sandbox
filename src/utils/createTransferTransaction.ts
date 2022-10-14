import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

/**
 * Creates an arbitrary transfer transaction
 * @param   {String}      publicKey  a public key
 * @param   {Connection}  connection an RPC connection
 * @returns {VersionedTransaction}            a transaction
 */
const createTransferTransaction = async (publicKey: PublicKey, connection: Connection): Promise<VersionedTransaction> => {
  const txMsg = new TransactionMessage({
    instructions: [SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey,
      lamports: 100,
    })],
    payerKey: publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash
  })
  const transaction = new VersionedTransaction(txMsg.compileToV0Message());

  const anyTransaction: any = transaction;
  anyTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return transaction;
};

export default createTransferTransaction;
