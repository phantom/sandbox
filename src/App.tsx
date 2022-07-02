import { useState, useEffect, useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

import './styles.css';

import {
  getProvider,
  signAllTransactions,
  signAndSendTransaction,
  signMessage,
  signTransaction,
  createTransferTransaction,
  pollSignatureStatus,
} from './utils';

// =============================================================================
// Constants
// =============================================================================

// alternatively, use clusterApiUrl("mainnet-beta");
export const NETWORK = 'https://solana-api.projectserum.com';
const provider = getProvider();
const connection = new Connection(NETWORK);
const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const [, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback(
    (log: string) => {
      return setLogs((logs) => [...logs, '> ' + log]);
    },
    [logs]
  );

  useEffect(() => {
    if (!provider) return;

    // try to eagerly connect
    provider.connect({ onlyIfTrusted: true }).catch((error) => {
      // fail silently
    });

    provider.on('connect', (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      setConnected(true);
      addLog(`[connect] ${publicKey?.toBase58()}`);
    });

    provider.on('disconnect', () => {
      setPublicKey(null);
      setConnected(false);
      addLog('[disconnect] 👋');
    });

    provider.on('accountChanged', (publicKey: PublicKey | null) => {
      setPublicKey(publicKey);
      if (publicKey) {
        addLog(`[accountChanged] Switched account to ${publicKey?.toBase58()}`);
      } else {
        addLog('[accountChanged] Switched unknown account');
        // In this case, dapps could not to anything, or,
        // Only re-connecting to the new account if it is trusted
        // provider.connect({ onlyIfTrusted: true }).catch((err) => {
        //   // fail silently
        // });
        // Or, always trying to reconnect
        provider
          .connect()
          .then(() => addLog('[accountChanged] Reconnected successfully'))
          .catch((error) => {
            addLog(`[accountChanged] Failed to re-connect: ${error.message}`);
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
      const transaction = await createTransferTransaction(provider, connection);
      addLog(`Requesting signature for: ${JSON.stringify(transaction)}`);
      const signature = await signAndSendTransaction(provider, transaction);
      addLog(`Signed and submitted transaction ${signature}, awaiting confirmation...`);
      pollSignatureStatus(signature, connection, addLog);
    } catch (error) {
      console.warn(error);
      addLog(`[error] signAndSendTransaction: ${JSON.stringify(error)}`);
    }
  }, [provider, connection, addLog]);

  /** SignTransaction */
  const handleSignTransaction = useCallback(async () => {
    try {
      const transaction = await createTransferTransaction(provider, connection);
      addLog(`Requesting signature for: ${JSON.stringify(transaction)}`);
      const signedTransaction = await signTransaction(provider, transaction);
      addLog(`Transaction signed: ${JSON.stringify(signedTransaction)}`);
    } catch (error) {
      console.warn(error);
      addLog(`[error] signTransaction: ${JSON.stringify(error)}`);
    }
  }, [provider, connection, addLog]);

  /** SignAllTransactions */
  const handleSignAllTransactions = useCallback(async () => {
    try {
      const transactions = [
        await createTransferTransaction(provider, connection),
        await createTransferTransaction(provider, connection),
      ];
      addLog(`Requesting signature for: ${JSON.stringify(transactions)}`);
      const signedTransactions = await signAllTransactions(provider, transactions[0], transactions[1]);
      addLog(`Transactions signed: ${JSON.stringify(signedTransactions)}`);
    } catch (error) {
      addLog(`[error] signAllTransactions: ${JSON.stringify(error)}`);
    }
  }, [provider, connection, addLog]);

  /** SignMessage */
  const handleSignMessage = useCallback(async () => {
    try {
      const signedMessage = await signMessage(provider, message);
      addLog(`Message signed: ${JSON.stringify(signedMessage)}`);
      return signedMessage;
    } catch (error) {
      console.warn(error);
      addLog(`[error] signMessage: ${JSON.stringify(error)}`);
    }
  }, [provider, message, addLog]);

  /** Connect */
  const handleConnect = useCallback(async () => {
    try {
      await provider.connect();
    } catch (error) {
      console.warn(error);
      addLog(`[error] connect: ${JSON.stringify(error)}`);
    }
  }, [provider]);

  /** Disconnect */
  const handleDisconnect = useCallback(async () => {
    try {
      await provider.disconnect();
    } catch (error) {
      console.warn(error);
      addLog(`[error] disconnect: ${JSON.stringify(error)}`);
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
    <div className="App">
      <main>
        <h1>Phantom Sandbox</h1>
        {provider && publicKey ? (
          <>
            <div>
              <pre>Connected as</pre>
              <br />
              <pre>{publicKey.toBase58()}</pre>
              <br />
            </div>
            {methods.map((method, i) => (
              <button key={i} onClick={method.onClick}>
                {method.name}
              </button>
            ))}
          </>
        ) : (
          <button onClick={handleConnect}>Connect to Phantom</button>
        )}
      </main>
      <footer className="logs">
        {logs.map((log, i) => (
          <div key={i} className="log">
            {log}
          </div>
        ))}
      </footer>
    </div>
  );
};

export default App;
