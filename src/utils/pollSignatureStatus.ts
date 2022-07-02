import { Connection } from '@solana/web3.js';

import { pause } from '.';

const MAX_POLLS = 10;

/**
 * Polls for transaction signature statuses
 * @param   {String}     signature  a transaction signature
 * @param   {Connection} connection an RPC connection
 * @param   {Function}   addLog     a function to add logging
 * @returns
 */
const pollSignatureStatus = async (
  signature: string,
  connection: Connection,
  addLog: (log: string) => void
): Promise<void> => {
  for (let pollCount = 0; pollCount < MAX_POLLS; pollCount++) {
    const { value } = await connection.getSignatureStatus(signature);

    if (value?.confirmationStatus) {
      addLog(`Transaction ${signature} ${value.confirmationStatus}`);
      if (value.confirmationStatus === 'confirmed' || value.confirmationStatus === 'finalized') return;
    }

    await pause(1000);
  }
};

export default pollSignatureStatus;
