import { Connection, TransactionConfirmationStatus } from '@solana/web3.js';

import { TLog } from '../types';

import { pause } from '.';

const MAX_POLLS = 10;

/**
 * Polls for transaction signature statuses
 * @param   {String}     signature  a transaction signature
 * @param   {Connection} connection an RPC connection
 * @param   {Function}   createLog  a function to create log
 * @returns
 */
const pollSignatureStatus = async (
  signature: string,
  connection: Connection,
  createLog: (log: TLog) => void
): Promise<void> => {
  for (let pollCount = 0; pollCount < MAX_POLLS; pollCount++) {
    const { value } = await connection.getSignatureStatus(signature);
    const confirmationStatus = value?.confirmationStatus;

    if (confirmationStatus) {
      const hasReachedSufficientCommitment = confirmationStatus === 'confirmed' || confirmationStatus === 'finalized';

      createLog({
        status: hasReachedSufficientCommitment ? 'success' : 'info',
        method: 'signAndSendTransaction',
        message: `Transaction: ${signature}`,
        messageTwo: `Status: ${confirmationStatus}`,
      });

      if (hasReachedSufficientCommitment) return;
    }

    await pause(1000);
  }

  // Failed to confirm transaction in time
  createLog({
    status: 'error',
    method: 'signAndSendTransaction',
    message: `Transaction: ${signature}`,
    messageTwo: 'Failed to confirm transaction in time. The transaction may or may not have succeeded.',
  });
};

export default pollSignatureStatus;
