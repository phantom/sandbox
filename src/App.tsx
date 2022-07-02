import { useState, useEffect, useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import styled from 'styled-components';

import {
  getProvider,
  signAllTransactions,
  signAndSendTransaction,
  signMessage,
  signTransaction,
  createTransferTransaction,
  pollSignatureStatus,
} from './utils';

import { TLog } from './types';

import { Logs, Button, Sidebar, NoProvider } from './components';

// =============================================================================
// Constants
// =============================================================================

// alternatively, use clusterApiUrl("mainnet-beta");
const NETWORK = 'https://solana-api.projectserum.com';
const provider = getProvider();
const connection = new Connection(NETWORK);
const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const [, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [logs, setLogs] = useState<TLog[]>([]);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [logs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  useEffect(() => {
    if (!provider) return;

    // try to eagerly connect
    provider.connect({ onlyIfTrusted: true }).catch((error) => {
      // fail silently
    });

    provider.on('connect', (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      setConnected(true);
      createLog({
        status: 'success',
        method: 'connect',
        message: `Connected to account ${publicKey.toBase58()}`,
      });
    });

    provider.on('disconnect', () => {
      setPublicKey(null);
      setConnected(false);
      createLog({
        status: 'warning',
        method: 'disconnect',
        message: '👋',
      });
    });

    provider.on('accountChanged', (publicKey: PublicKey | null) => {
      setPublicKey(publicKey);

      if (publicKey) {
        createLog({
          status: 'info',
          method: 'accountChanged',
          message: `Switched to account ${publicKey.toBase58()}`,
        });
      } else {
        /**
         * In this case dApps could...
         *
         * 1. Not do anything
         * 2. Only re-connect to the new account if it is trusted
         *
         * ```
         * provider.connect({ onlyIfTrusted: true }).catch((err) => {
         *  // fail silently
         * });
         * ```
         *
         * 3. Always attempt to reconnect
         */
        createLog({
          status: 'warning',
          method: 'accountChanged',
          message: 'Switched to an unknown account',
        });

        provider
          .connect()
          .then(() => {
            createLog({
              status: 'success',
              method: 'accountChanged',
              message: 'Re-connected successfully',
            });
          })
          .catch((error) => {
            createLog({
              status: 'error',
              method: 'accountChanged',
              message: `Failed to re-connect: ${error.message}`,
            });
          });
      }
    });

    return () => {
      provider.disconnect();
    };
  }, [provider]);

  if (!provider) {
    return <NoProvider />;
  }

  /** SignAndSendTransaction */
  const handleSignAndSendTransaction = useCallback(async () => {
    try {
      const transaction = await createTransferTransaction(provider.publicKey, connection);
      createLog({
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Requesting signature for: ${JSON.stringify(transaction)}`,
      });
      const signature = await signAndSendTransaction(provider, transaction);
      createLog({
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Signed and submitted transaction ${signature}, awaiting confirmation...`,
      });
      pollSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAndSendTransaction',
        message: error.message,
      });
    }
  }, [provider, connection, createLog]);

  /** SignTransaction */
  const handleSignTransaction = useCallback(async () => {
    try {
      const transaction = await createTransferTransaction(provider.publicKey, connection);
      createLog({
        status: 'info',
        method: 'signTransaction',
        message: `Requesting signature for: ${JSON.stringify(transaction)}`,
      });
      const signedTransaction = await signTransaction(provider, transaction);
      createLog({
        status: 'success',
        method: 'signTransaction',
        message: `Transaction signed: ${JSON.stringify(signedTransaction)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signTransaction',
        message: error.message,
      });
    }
  }, [provider, connection, createLog]);

  /** SignAllTransactions */
  const handleSignAllTransactions = useCallback(async () => {
    try {
      const transactions = [
        await createTransferTransaction(provider.publicKey, connection),
        await createTransferTransaction(provider.publicKey, connection),
      ];
      createLog({
        status: 'info',
        method: 'signAllTransactions',
        message: `Requesting signature for: ${JSON.stringify(transactions)}`,
      });
      const signedTransactions = await signAllTransactions(provider, transactions[0], transactions[1]);
      createLog({
        status: 'success',
        method: 'signAllTransactions',
        message: `Transactions signed: ${JSON.stringify(signedTransactions)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAllTransactions',
        message: error.message,
      });
    }
  }, [provider, connection, createLog]);

  /** SignMessage */
  const handleSignMessage = useCallback(async () => {
    try {
      const signedMessage = await signMessage(provider, message);
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${JSON.stringify(signedMessage)}`,
      });
      return signedMessage;
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signMessage',
        message: error.message,
      });
    }
  }, [provider, message, createLog]);

  /** Connect */
  const handleConnect = useCallback(async () => {
    try {
      await provider.connect();
    } catch (error) {
      createLog({
        status: 'error',
        method: 'connect',
        message: error.message,
      });
    }
  }, [provider]);

  /** Disconnect */
  const handleDisconnect = useCallback(async () => {
    try {
      await provider.disconnect();
    } catch (error) {
      createLog({
        status: 'error',
        method: 'disconnect',
        message: error.message,
      });
    }
  }, [provider]);

  const connectedMethods = useMemo(() => {
    return [
      {
        name: 'Sign and Send Transaction',
        onClick: handleSignAndSendTransaction,
      },
      {
        name: 'Sign Transaction',
        onClick: handleSignTransaction,
      },
      {
        name: 'Sign All Transactions',
        onClick: handleSignAllTransactions,
      },
      {
        name: 'Sign Message',
        onClick: handleSignMessage,
      },
      {
        name: 'Disconnect',
        onClick: handleDisconnect,
      },
    ];
  }, [
    handleSignAndSendTransaction,
    handleSignTransaction,
    handleSignAllTransactions,
    handleSignMessage,
    handleDisconnect,
  ]);

  return (
    <StyledApp>
      <Sidebar publicKey={publicKey} connectedMethods={connectedMethods} connect={handleConnect} />
      <Logs logs={logs} clearLogs={clearLogs} />
    </StyledApp>
  );
};

export default App;

// =============================================================================
// Styled Components
// =============================================================================

const StyledApp = styled.div`
  font-family: sans-serif;
  display: flex;
  flex-direction: row;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;
