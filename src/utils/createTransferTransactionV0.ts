import { TransactionMessage, VersionedTransaction, SystemProgram, Connection, PublicKey } from '@solana/web3.js';

/**
 * Creates an arbitrary transfer transactionV0 (Versioned Transaction)
 * @param   {String}      publicKey  a public key
 * @param   {Connection}  connection an RPC connection
 * @returns {VersionedTransaction}            a transactionV0
 */
const createTransferTransactionV0 = async (
  publicKey: PublicKey,
  connection: Connection
): Promise<VersionedTransaction> => {
  // connect to the cluster and get the minimum rent for rent exempt status
  // perform this step to get an "arbitrary" amount to transfer
  let minRent = await connection.getMinimumBalanceForRentExemption(0);

  // get latest `blockhash`
  let blockhash = await connection.getLatestBlockhash().then((res) => res.blockhash);

  // create an array with your desired `instructions`
  // in this case, just a transfer instruction
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey,
      lamports: minRent,
    }),
  ];

  // create v0 compatible message
  const messageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  // make a versioned transaction
  const transactionV0 = new VersionedTransaction(messageV0);

  return transactionV0;
};

export default createTransferTransactionV0;
