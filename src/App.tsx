import { useState, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
  SystemProgram,
  TransactionInstruction,
  SendOptions,
} from "@solana/web3.js";
import { Token } from "@solana/spl-token";
import "./styles.css";

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signAndSendTransaction"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signAndSendTransaction: (
    transaction: Transaction,
    options?: SendOptions
  ) => Promise<{ signature: string }>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<{ signature: string; publicKey: PublicKey }>;
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

const NETWORK = clusterApiUrl("mainnet-beta");
const CONNECTION = new Connection(NETWORK);
const EXTERNAL_ADDRESS = new PublicKey(
  "J2XCpwkuvv9XWkPdR7NZyBhajaXA3nt5RGtCnG3JtYiz"
);
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
const USDC_MINT_ADDRESS = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
) {
  return (
    await PublicKey.findProgramAddress(
      [
        walletAddress.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        tokenMintAddress.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
}

export default function App() {
  const provider = getProvider();
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (log: string) => setLogs([...logs, log]);
  const [, setConnected] = useState<boolean>(false);
  useEffect(() => {
    if (provider) {
      provider.on("connect", () => {
        setConnected(true);
        addLog("Connected to wallet " + provider.publicKey?.toBase58());
      });
      provider.on("disconnect", () => {
        setConnected(false);
        addLog("Disconnected from wallet");
      });
      // try to eagerly connect
      provider.connect({ onlyIfTrusted: true });
      return () => {
        provider.disconnect();
      };
    }
  }, [provider]);
  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const createTransaction = async (instructions: TransactionInstruction[]) => {
    if (!provider.publicKey) {
      return;
    }
    let transaction = new Transaction().add(...instructions);
    transaction.feePayer = provider.publicKey;
    addLog("Getting recent blockhash");
    const anyTransaction: any = transaction;
    anyTransaction.recentBlockhash = (
      await CONNECTION.getRecentBlockhash()
    ).blockhash;
    return transaction;
  };

  const createTransferTransaction = async () =>
    createTransaction([
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: provider.publicKey,
        lamports: 100,
      }),
    ]);

  const sendTransaction = async (transaction: Transaction) => {
    if (transaction) {
      try {
        let { signature } = await provider.signAndSendTransaction(transaction);
        addLog(
          "Submitted transaction " + signature + ", awaiting confirmation"
        );
        await CONNECTION.confirmTransaction(signature);
        addLog("Transaction " + signature + " confirmed");
      } catch (err) {
        console.warn(err);
        addLog("Error: " + JSON.stringify(err));
      }
    }
  };
  const sendTransferInstruction = async () => {
    const transaction = await createTransferTransaction();
    sendTransaction(transaction);
  };

  const signTransferTransaction = async () => {
    const transaction = await createTransferTransaction();
    if (transaction) {
      try {
        await provider.signTransaction(transaction);
        addLog(`Successfully signed transaction.`);
      } catch (err) {
        console.warn(err);
        addLog("Error: " + JSON.stringify(err));
      }
    }
  };
  const signMultipleTransactions = async (onlyFirst: boolean = false) => {
    const [transaction1, transaction2] = await Promise.all([
      createTransferTransaction(),
      createTransferTransaction(),
    ]);
    if (transaction1 && transaction2) {
      let signature;
      try {
        if (onlyFirst) {
          signature = await provider.signAllTransactions([transaction1]);
        } else {
          signature = await provider.signAllTransactions([
            transaction1,
            transaction2,
          ]);
        }
      } catch (err) {
        console.warn(err);
        addLog("Error: " + JSON.stringify(err));
      }
      addLog("Signature " + signature);
    }
  };

  const setApproval = async () => {
    const approveInstruction = Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      await findAssociatedTokenAddress(provider.publicKey, USDC_MINT_ADDRESS),
      EXTERNAL_ADDRESS,
      provider.publicKey,
      [],
      1
    );
    const transaction = await createTransaction([approveInstruction]);
    sendTransaction(transaction);
  };

  const revokeApproval = async () => {
    const revokeInstruction = Token.createRevokeInstruction(
      TOKEN_PROGRAM_ID,
      await findAssociatedTokenAddress(provider.publicKey, USDC_MINT_ADDRESS),
      provider.publicKey,
      []
    );
    const transaction = await createTransaction([revokeInstruction]);
    sendTransaction(transaction);
  };

  const transferUSDC = async () => {
    const transferInstruction = Token.createTransferCheckedInstruction(
      TOKEN_PROGRAM_ID,
      await findAssociatedTokenAddress(provider.publicKey, USDC_MINT_ADDRESS),
      USDC_MINT_ADDRESS,
      await findAssociatedTokenAddress(EXTERNAL_ADDRESS, USDC_MINT_ADDRESS),
      provider.publicKey,
      [],
      100000,
      6
    );
    const transaction = await createTransaction([transferInstruction]);
    sendTransaction(transaction);
  };

  const signMessage = async (message: string) => {
    const data = new TextEncoder().encode(message);
    try {
      await provider.signMessage(data);
    } catch (err) {
      console.warn(err);
      addLog("Error: " + JSON.stringify(err));
    }
    addLog("Message signed");
  };
  return (
    <div className="App">
      <h1>Phantom Sandbox</h1>
      <main>
        {provider && provider.publicKey ? (
          <>
            <div>Wallet address: {provider.publicKey?.toBase58()}.</div>
            <div>isConnected: {provider.isConnected ? "true" : "false"}.</div>
            <button onClick={sendTransferInstruction}>Send Transaction</button>
            <button onClick={signTransferTransaction}>Sign Transaction</button>
            <button onClick={transferUSDC}>Send USDC</button>
            <button onClick={() => signMultipleTransactions(false)}>
              Sign All Transactions (multiple){" "}
            </button>
            <button onClick={() => signMultipleTransactions(true)}>
              Sign All Transactions (single){" "}
            </button>
            <button onClick={setApproval}>Set Approval</button>
            <button onClick={revokeApproval}>Revoke Approval</button>
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
                  const res = await provider.disconnect();
                  addLog(JSON.stringify(res));
                } catch (err) {
                  console.warn(err);
                  addLog("Error: " + JSON.stringify(err));
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
                  const res = await provider.connect();
                  addLog(JSON.stringify(res));
                } catch (err) {
                  console.warn(err);
                  addLog("Error: " + JSON.stringify(err));
                }
              }}
            >
              Connect to Phantom
            </button>
          </>
        )}
        <hr />
        <div className="logs">
          {logs.map((log, i) => (
            <div className="log" key={i}>
              {log}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
