// "use client"
import { useWallet as solUseWallet } from "@solana/wallet-adapter-react";
import Cookies from "js-cookie";
import axios from "axios";
import { useEffect, useState } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export const useSolWallet = (
  setshowsignbutton: ((arg0: boolean) => void) | undefined
) => {
  const { connected: solconnected, publicKey } = solUseWallet();
  const [sendableSol, setSendableSol] = useState(false);
  const mynetwork = "devnet";
  //   const mynetwork = process.env.NEXT_PUBLIC_NETWORK_SOL;
  const network = WalletAdapterNetwork.Devnet;
  const solPublicKey = publicKey;

  useEffect(() => {
    if (typeof window !== "undefined") {
      isSendableNetwork(solconnected).then((result) => {
        setSendableSol(result);
      });
    }
  }, [solconnected]);

  const getchainsym = () => {
    return Cookies.get("Chain_symbol");
  };

  const isSendableNetwork = async (connected: boolean): Promise<boolean> => {
    if (!connected) return false;

    try {
      const wallet = getPhantomWallet();
      if (!wallet) return false;

      // Get the current network from the wallet
      const currentNetwork = network; // Use the predefined network constant

      // Check if network matches devnet (for Solana, this might be different)
      // You'll need to determine what value represents devnet for your wallet
      return currentNetwork === network;
    } catch (error) {
      console.error("Network check error:", error);
      return false;
    }
  };

  // Use state to track network compatibility instead of Promise
  const [isNetworkCompatible, setIsNetworkCompatible] =
    useState<boolean>(false);

  useEffect(() => {
    const checkNetworkCompatibility = async () => {
      const compatible = await isSendableNetwork(solconnected);
      setIsNetworkCompatible(compatible);
    };

    checkNetworkCompatibility();
  }, [solconnected, network]);

  // const address = Cookies.get("erebrus_wallet");
  // 👇 Add this before using window.phantom

  const getPhantomWallet = () => {
    if (typeof window !== "undefined" && "phantom" in window) {
      const provider = window.phantom?.solana;

      if (provider?.signMessage) {
        return provider;
      }
    } else {
      window.open("https://phantom.app/", "_blank");
    }
  };

  const OnSignMessageSol = async () => {
    if (isNetworkCompatible) {
      try {
        const checktoken = Cookies.get("erebrus_token");
        const checkwallet = Cookies.get("erebrus_wallet");
        const checkuserId = Cookies.get("erebrus_userid");

        if (checktoken && checkwallet && checkuserId) {
          // All cookies are set, no need to sign message
          return;
        }
        const wallet = getPhantomWallet();
        const REACT_APP_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

        const { data } = await axios.get(
          `${REACT_APP_GATEWAY_URL}api/v1.0/flowid?walletAddress=${publicKey}&chain=sol`
        );

        const message = data.payload.eula;
        const nonce = data.payload.flowId;

        const encodedMessage = new TextEncoder().encode(message);
        if (!wallet) {
          throw new Error(
            "Wallet is not available. Please ensure Phantom Wallet is connected."
          );
        }
        const response = await wallet.signMessage(encodedMessage);

        let signaturewallet = response.signature;
        const signatureHex = Array.from(Array.from(signaturewallet))
          .map((byte) => ("0" + byte?.toString()).slice(-2))
          .join("");

        const authenticationData = {
          flowId: nonce,
          signature: `${signatureHex}`,
          pubKey: publicKey,
          walletAddress: publicKey,
          message: message,
          chainName: "solana",
        };

        const authenticateApiUrl = `${REACT_APP_GATEWAY_URL}api/v1.0/authenticate?walletAddress=${publicKey}&chain=sol`;

        const config = {
          url: authenticateApiUrl,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          data: authenticationData,
        };

        const authResponse = await axios(config);

        const token = await authResponse?.data?.payload?.token;
        const userId = await authResponse?.data?.payload?.userId;
        Cookies.set("erebrus_token", token, { expires: 7 });
        Cookies.set("erebrus_wallet", publicKey?.toString() ?? "", {
          expires: 7,
        });
        Cookies.set("erebrus_userid", userId, { expires: 7 });

        window.location.reload();
      } catch (error) {
        if (setshowsignbutton) {
          setshowsignbutton(true);
        }
      }
    } else {
      alert(`Switch to ${mynetwork} in your wallet`);
    }
  };

  return { solconnected, solPublicKey, OnSignMessageSol };
};
