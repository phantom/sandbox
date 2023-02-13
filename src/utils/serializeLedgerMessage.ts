/**
 * Inspired from:
 * https://github.com/LedgerHQ/app-solana/blob/bc5e53581de651b33d2ec437dfa468048c27c4b5/examples/example-sign.js
 */

// Currently only on version 0 for Ledger off chain message signing as of Solana app version 1.3.1
const OFF_CHAIN_MESSAGE_VERSION = 0;

// Max off-chain message length supported by Ledger
const OFFCM_MAX_LEDGER_LEN = 1212;
// Max length of version 0 off-chain message
const OFFCM_MAX_V0_LEN = 65515;

const isPrintableASCII = (message: Buffer): boolean => message.every((el) => el >= 0x20 && el <= 0x7e);

const parseMessageFormat = (message: Buffer): number | undefined => {
  if (message.length <= OFFCM_MAX_LEDGER_LEN) {
    if (isPrintableASCII(message)) {
      return 0;
    } else {
      return 1;
    }
  } else if (message.length <= OFFCM_MAX_V0_LEN) {
    return 2;
  }
  return undefined;
};

type SerializeLedgerOffChainMessageResponse =
  | {
      status: 'success';
      data: Buffer;
    }
  | {
      status: 'error';
      errorType: 'message-too-long';
      errorMessage: string;
    };

export const serializeLedgerOffChainMessage = (message: Buffer): SerializeLedgerOffChainMessageResponse => {
  const messageFormat = parseMessageFormat(message);

  if (messageFormat === undefined) {
    return {
      status: 'error',
      errorType: 'message-too-long',
      errorMessage: `off-chain message too long. Max length: ${OFFCM_MAX_V0_LEN}, but got ${message.length}`,
    };
  }

  const buffer = Buffer.alloc(4);
  let offset = buffer.writeUInt8(OFF_CHAIN_MESSAGE_VERSION);
  offset = buffer.writeUInt8(messageFormat, offset);
  buffer.writeUInt16LE(message.length, offset);
  const data = Buffer.concat([Buffer.from([255]), Buffer.from('solana offchain'), buffer, message]);

  return {
    status: 'success',
    data,
  };
};
