import { Connection } from '@solana/web3.js';

import { pause } from '.';

const MAX_POLLS = 10;

const pollSignatureStatus = async (signature: string, connection: Connection, addLog: (log: string) => void) => {
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
