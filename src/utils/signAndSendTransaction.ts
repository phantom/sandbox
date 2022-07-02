import { Transaction } from '@solana/web3.js';

import { PhantomProvider } from '../types';

/**
 * Signs a transaction
 * @param   {PhantomProvider} provider    a Phantom Provider
 * @param   {Transaction}     transaction a transaction to sign
 * @returns {Transaction}                 a signed transaction
 */
const signAndSendTransaction = async (provider: PhantomProvider, transaction: Transaction): Promise<string> => {
  try {
    const { signature } = await provider.signAndSendTransaction(transaction);
    return signature;
  } catch (err) {
    console.warn(err);
  }
};

export default signAndSendTransaction;
