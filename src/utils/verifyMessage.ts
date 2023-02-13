import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { serializeLedgerOffChainMessage } from './serializeLedgerMessage';

/**
 * Verifies off-chain message signature from Phantom.
 *
 * tweetnacl can be used to do signature verification.
 */
export const verifyMessage = (message: string, signature: string, publicKey: PublicKey): boolean => {
  const messageBuffer = Buffer.from(message, 'utf-8');
  return nacl.sign.detached.verify(messageBuffer, bs58.decode(signature), Buffer.from(publicKey.toBytes()));
};

/**
 * Verifies off-chain message signature from Ledger.
 *
 * Ledger prepends some extra data to the start of the raw message bytes, so we have to re-serialize
 * the original message in the same way that it's sent to Ledger.
 */
export const verifyOffChainLedgerMessage = (message: string, signature: string, publicKey: PublicKey): boolean => {
  const messageBuffer = Buffer.from(message, 'utf-8');
  const serialized = serializeLedgerOffChainMessage(messageBuffer);
  if (serialized.status === 'error') {
    throw new Error(`unable to serialize off chain ledger message: ${message}`);
  }
  return nacl.sign.detached.verify(serialized.data, bs58.decode(signature), Buffer.from(publicKey.toBytes()));
};
