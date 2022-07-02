import { PhantomProvider } from "../types";

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

export default getProvider;
