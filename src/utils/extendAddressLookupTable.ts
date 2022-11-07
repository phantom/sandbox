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
 * 1. Extends (add addresses) the table
 * 2. Signs and sends the extension instruction
 * 
 * @param   {String}      publicKey  a public key
 * @param   {Connection}  connection an RPC connection
 * @param   {String}  publicKey recent blockhash
 * @param   {String} publicKey  address of the lookup table
 * @returns {String} signature of confirmed transaction
 */
const extendAddressLookupTable = async (
  provider: PhantomProvider,
  publicKey: PublicKey,
  connection: Connection,
  blockhash: string,
  lookupTableAddress: PublicKey
): Promise<string> => {

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

  return extensionSignature
};

export default extendAddressLookupTable;
