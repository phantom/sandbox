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
  hexToRGB,
} from './utils';

import { TLog } from './types';

import { GREEN, WHITE, GRAY, LIGHT_GRAY, DARK_GRAY } from './constants';

import Logs from './components/Logs';

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
    return <h2>Could not find a provider</h2>;
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

  const methods = useMemo(
    () => [
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
    ],
    [
      handleSignAndSendTransaction,
      handleSignTransaction,
      handleSignAllTransactions,
      handleSignMessage,
      handleDisconnect,
    ]
  );

  return (
    <Grid>
      <Main>
        <Brand>
          <img src="https://phantom.app/img/phantom-logo.svg" alt="Phantom" width="200" />
          <Subtitle>CodeSandbox</Subtitle>
        </Brand>
        {provider && publicKey ? (
          <>
            <div>
              <Pre>Connected as</Pre>
              <Badge>{publicKey.toBase58()}</Badge>
            </div>
            {methods.map((method, i) => (
              <Button key={i} onClick={method.onClick}>
                {method.name}
              </Button>
            ))}
          </>
        ) : (
          <Button onClick={handleConnect}>Connect to Phantom</Button>
        )}
      </Main>
      <Logs logs={logs} />
      <ClearLogsButton onClick={clearLogs}>Clear Logs</ClearLogsButton>
    </Grid>
  );
};

export default App;

// =============================================================================
// Constants
// =============================================================================

// alternatively, use clusterApiUrl("mainnet-beta");
export const NETWORK = 'https://solana-api.projectserum.com';
const provider = getProvider();
const connection = new Connection(NETWORK);
const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

// =============================================================================
// Styled Components
// =============================================================================

const Grid = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 540px 1fr;
  height: 100vh;
  font-family: sans-serif;
  background-color: #222;
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  align-items: center;
  overflow: auto;
  > * {
    margin-bottom: 10px;
  }
`;

const Brand = styled.a.attrs({
  href: 'https://phantom.app/',
  target: '_blank',
  rel: 'noopener noreferrer',
})`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-decoration: none;
  margin-bottom: 30px;
  padding: 5px;
  &:focus-visible {
    outline: 2px solid ${hexToRGB(GRAY, 0.5)};
    border-radius: 6px;
  }
`;

const Subtitle = styled.h5`
  color: ${GRAY};
  font-weight: 400;
`;

const Pre = styled.pre`
  margin-bottom: 5px;
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 10px;
  color: ${GREEN};
  background-color: ${hexToRGB(GREEN, 0.2)};
  font-size: 14px;
  border-radius: 6px;
  width: 400px;
  ::selection {
    color: ${WHITE};
    background-color: ${hexToRGB(GREEN, 0.5)};
  }
  ::-moz-selection {
    color: ${WHITE};
    background-color: ${hexToRGB(GREEN, 0.5)};
  }
`;

const Button = styled.button`
  cursor: pointer;
  color: ${WHITE};
  user-select: none;
  font-weight: 600;
  outline: 0;
  width: 400px;
  padding: 15px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  background-color: ${DARK_GRAY};
  &:hover {
    background-color: ${hexToRGB(LIGHT_GRAY, 0.8)};
  }
  &:focus-visible {
    background-color: ${hexToRGB(LIGHT_GRAY, 0.8)};
  }
  &:active {
    background-color: ${LIGHT_GRAY};
  }
`;

const ClearLogsButton = styled(Button)`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 100px;
`;
