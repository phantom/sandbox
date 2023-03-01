import { PhantomProvider } from '../types';
import bs58 from 'bs58';

/**
 * Signs a message
 * @param   {PhantomProvider} provider a Phantom Provider
 * @param   {String}          message  a message to sign
 * @returns {Any}                      TODO(get type)
 */
const signMessage = async (provider: PhantomProvider, message: string): Promise<string> => {
  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await provider.signMessage(encodedMessage);
    if ('signature' in signedMessage) {
      return bs58.encode(signedMessage.signature);
    }
    throw new Error(`invalid signature object: ${JSON.stringify(signedMessage)}`);
  } catch (error) {
    console.warn(error);
    throw new Error(error.message);
  }
};

export default signMessage;
