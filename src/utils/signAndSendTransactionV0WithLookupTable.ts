import {
  AddressLookupTableProgram,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { PhantomProvider } from '../types';
import { signAndSendTransaction } from '.';

/**
 * 1. Creates an Address Lookup Table Instruction
 * 2. Signs and sends it in a transactionV0
 * 3. Extends (add addresses) the table
 * 4. Signs and sends the extension instruction
 * 5. Creates an arbitrary transfer transactionV0 (Versioned Transaction),
 *    uses the Address Lookup Table to fetch the accounts,
 *    signs this transaction and sends it.
 * @param   {String}      publicKey  a public key
 * @param   {Connection}  connection an RPC connection
 * @returns {VersionedTransaction}            a transactionV0
 */
const signAndSendTransactionV0WithLookupTable = async (
  provider: PhantomProvider,
  publicKey: PublicKey,
  connection: Connection
): Promise<string> => {
  // connect to the cluster and get the minimum rent for rent exempt status
  // perform this step to get an "arbitrary" amount to transfer
  let minRent = await connection.getMinimumBalanceForRentExemption(0);

  // get latest `blockhash`
  let blockhash = await connection.getLatestBlockhash().then((res) => res.blockhash);

  // get current `slot`
  let slot = await connection.getSlot();

  // create an Address Lookup Table
  const [lookupTableInst, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
    authority: publicKey,
    payer: publicKey,
    recentSlot: slot,
  });

  console.log('lookup table address:', lookupTableAddress.toBase58());

  // To create the Address Lookup Table on chain:
  // send the `lookupTableInst` instruction in a transaction
  const lookupMessageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash,
    instructions: [lookupTableInst],
  }).compileToV0Message();

  const lookupTransactionV0 = new VersionedTransaction(lookupMessageV0);
  const lookupSignature = await signAndSendTransaction(provider, lookupTransactionV0);
  console.log('Sent transaction for lookup table:', lookupSignature);

  // add addresses to the `lookupTableAddress` table via an `extend` instruction
  const extendInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: publicKey,
    authority: publicKey,
    lookupTable: lookupTableAddress,
    addresses: [
      publicKey,
      SystemProgram.programId,
      // more `publicKey` addresses can be listed here
    ],
  });

  // Send this `extendInstruction` in a transaction to the cluster
  // to insert the listing of `addresses` into your lookup table with address `lookupTableAddress`
  const extensionMessageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash,
    instructions: [extendInstruction],
  }).compileToV0Message();

  const extensionTransactionV0 = new VersionedTransaction(extensionMessageV0);
  const extensionSignature = await signAndSendTransaction(provider, extensionTransactionV0);

  // Confirm transaction: we will have to wait for the transaction to fetch the
  // lookup table account before proceeding: takes around 3-5 seconds to fetch.
  const status = (await connection.confirmTransaction(extensionSignature)).value;
  if (status.err) {
    throw new Error(`Transaction ${extensionSignature} failed (${JSON.stringify(status)})`);
  }
  console.log('Sent transaction for lookup table extension:', extensionSignature);

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
