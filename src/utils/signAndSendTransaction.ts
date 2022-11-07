import { Transaction, VersionedTransaction } from '@solana/web3.js';

import { PhantomProvider } from '../types';

/**
 * Signs and sends transaction
 * @param   {PhantomProvider} provider    a Phantom Provider
 * @param   {Transaction}     transaction a transaction to sign
 * @returns {Transaction}                 a signed transaction
 */
const signAndSendTransaction = async (
  provider: PhantomProvider,
  transaction: Transaction | VersionedTransaction
): Promise<string> => {
  try {
    const { signature } = await provider.signAndSendTransaction(transaction);
    return signature;
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signAndSendTransaction;
