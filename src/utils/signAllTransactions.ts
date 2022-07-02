import { Transaction } from '@solana/web3.js';

import { PhantomProvider } from '../types';

const signAllTransactions = async (provider: PhantomProvider, transaction1: Transaction, transaction2: Transaction) => {
  try {
    const transactions = await provider.signAllTransactions([transaction1, transaction2]);
    return transactions;
  } catch (err) {
    console.warn(err);
  }
};

export default signAllTransactions;
