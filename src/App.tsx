import { useState, useEffect, useCallback } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SendOptions,
} from "@solana/web3.js";
import "./styles.css";

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signAndSendTransaction: (
    transaction: Transaction,
    opts?: SendOptions
  ) => Promise<{ signature: string; publicKey: PublicKey }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const anyWindow: any = window;
    const provider = anyWindow.solana;
    if (provider.isPhantom) {
      return provider;
    }
  }
  window.open("https://phantom.app/", "_blank");
};

// alternatively, use clusterApiUrl("mainnet-beta");
const NETWORK = "https://solana-api.projectserum.com";

export default function App() {
  const [, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback(
    (log: string) => setLogs((logs) => [...logs, "> " + log]),
    []
  );

  const provider = getProvider();
  const connection = new Connection(NETWORK);

  useEffect(() => {
    if (!provider) return;

    // try to eagerly connect
    provider.connect({ onlyIfTrusted: true }).catch((err) => {
      // fail silently
    });

    provider.on("connect", (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      setConnected(true);
      addLog("[connect] " + publicKey?.toBase58());
    });

    provider.on("disconnect", () => {
      setPublicKey(null);
      setConnected(false);
      addLog("[disconnect] 👋");
    });

    provider.on("accountChanged", (publicKey: PublicKey | null) => {
      setPublicKey(publicKey);
      if (publicKey) {
        addLog("[accountChanged] Switched account to " + publicKey?.toBase58());
      } else {
        addLog("[accountChanged] Switched unknown account");
        // In this case, dapps could not to anything, or,
        // Only re-connecting to the new account if it is trusted
        // provider.connect({ onlyIfTrusted: true }).catch((err) => {
        //   // fail silently
        // });
        // Or, always trying to reconnect
        provider
          .connect()
          .then(() => addLog("[accountChanged] Reconnected successfully"))
          .catch((err) => {
            addLog("[accountChanged] Failed to re-connect: " + err.message);
          });
      }
    });

    return () => {
      provider.disconnect();
    };
  }, [provider, addLog]);

  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const createTransferTransaction = async () => {
    if (!provider.publicKey) return;
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: provider.publicKey,
        lamports: 100,
      })
    );
    transaction.feePayer = provider.publicKey;
    addLog("Getting recent blockhash");
    const anyTransaction: any = transaction;
    anyTransaction.recentBlockhash = (
      await connection.getRecentBlockhash()
    ).blockhash;
    return transaction;
  };

  const signAndSendTransaction = async () => {
    try {
      const transaction = await createTransferTransaction();
      if (!transaction) return;
      addLog("Requesting signature for: " + JSON.stringify(transaction));
      const { signature } = await provider.signAndSendTransaction(transaction);
      addLog(
        "Signed and submitted transaction " +
          signature +
          ", awaiting confirmation..."
      );
      await connection.confirmTransaction(signature);
      addLog("Transaction " + signature + " confirmed");
    } catch (err) {
      console.warn(err);
      addLog("[error] signAndSendTransaction: " + JSON.stringify(err));
    }
  };

  const signTransaction = async () => {
    try {
      const transaction = await createTransferTransaction();
      if (!transaction) return;
      addLog("Requesting signature for: " + JSON.stringify(transaction));
      const signedTransaction = await provider.signTransaction(transaction);
      addLog("Transaction signed: " + JSON.stringify(signedTransaction));
    } catch (err) {
      console.warn(err);
      addLog("[error] signTransaction: " + JSON.stringify(err));
    }
  };

  const signAllTransactions = async () => {
    try {
      const [transaction1, transaction2] = await Promise.all([
        createTransferTransaction(),
        createTransferTransaction(),
      ]);
      if (transaction1 && transaction2) {
        addLog(
          "Requesting signature for: " +
            JSON.stringify([transaction1, transaction2])
        );
        const transactions = await provider.signAllTransactions([
          transaction1,
          transaction2,
        ]);
        addLog("Transactions signed: " + JSON.stringify(transactions));
      }
    } catch (err) {
      console.warn(err);
      addLog("[error] signAllTransactions: " + JSON.stringify(err));
    }
  };

  const signMessage = async (message: string) => {
    try {
      const data = new TextEncoder().encode(message);
      const res = await provider.signMessage(data);
      addLog("Message signed: " + JSON.stringify(res));
    } catch (err) {
      console.warn(err);
      addLog("[error] signMessage: " + JSON.stringify(err));
    }
  };

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
            <button onClick={signAndSendTransaction}>
              Sign and Send Transaction
            </button>
            <button onClick={signTransaction}>Sign Transaction</button>
            <button onClick={signAllTransactions}>Sign All Transactions</button>
            <button
              onClick={() =>
                signMessage(
                  "To avoid digital dognappers, sign below to authenticate with CryptoCorgis."
                )
              }
            >
              Sign Message
            </button>
            <button
              onClick={async () => {
                try {
                  await provider.disconnect();
                } catch (err) {
                  console.warn(err);
                  addLog("[error] disconnect: " + JSON.stringify(err));
                }
              }}
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <button
              onClick={async () => {
                try {
                  await provider.connect();
                } catch (err) {
                  console.warn(err);
                  addLog("[error] connect: " + JSON.stringify(err));
                }
              }}
            >
              Connect to Phantom
            </button>
          </>
        )}
      </main>
      <footer className="logs">
        {logs.map((log, i) => (
          <div className="log" key={i}>
            {log}
          </div>
        ))}
      </footer>
    </div>
  );
}
