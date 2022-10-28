import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { PhantomProvider } from '../types';
import {
  createAddressLookupTable,
  extendAddressLookupTable,
  signAndSendTransaction,
} from '.';
import { Logs } from '../components';

/**
 * Creates an arbitrary transfer transactionV0 (Versioned Transaction),
 * uses the Address Lookup Table to fetch the accounts,
 * signs this transaction and sends it.
 * @param   {String}      publicKey  a public key
 * @param   {Connection}  connection an RPC connection
 * @param   {String}  publicKey recent blockhash
 * @param   {String} publicKey  address of the lookup table
 * @returns {VersionedTransaction}   a transactionV0
 */
const signAndSendTransactionV0WithLookupTable = async (
  provider: PhantomProvider,
  publicKey: PublicKey,
  connection: Connection,
  blockhash: string,
  lookupTableAddress: PublicKey
): Promise<string> => {

  // connect to the cluster and get the minimum rent for rent exempt status
  // perform this step to get an "arbitrary" amount to transfer
  let minRent = await connection.getMinimumBalanceForRentExemption(0);

  // similar to requesting another account (or PDA) from the cluster,
  // you can fetch a complete Address Lookup Table with
  // the getAddressLookupTable method

  // get the table from the cluster
  const lookupTableAccount = await connection.getAddressLookupTable(lookupTableAddress).then((res) => res.value);
  // `lookupTableAccount` will now be a `AddressLookupTableAccount` object
  console.log('Table address from cluster:', lookupTableAccount.key.toBase58());

  // Our lookupTableAccount variable will now be a AddressLookupTableAccount
  // object which we can parse to read the listing of all
  // the addresses stored on chain in the lookup table

  // Loop through and parse all the address stored in the table
  for (let i = 0; i < lookupTableAccount.state.addresses.length; i++) {
    const address = lookupTableAccount.state.addresses[i];
    console.log(i, address.toBase58());
  }

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
  }).compileToV0Message([lookupTableAccount]);

  // make a versioned transaction
  const transactionV0 = new VersionedTransaction(messageV0);
  const signature = await signAndSendTransaction(provider, transactionV0);
  return signature;
};

export default signAndSendTransactionV0WithLookupTable;
