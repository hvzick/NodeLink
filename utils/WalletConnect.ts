import 'react-native-get-random-values';
import { Alert, Linking, AppState } from "react-native";
import { Core } from "@walletconnect/core";
import SignClient from "@walletconnect/sign-client";

type SignClientType = InstanceType<typeof SignClient>;

const projectId = "0b183fc0707f5795787aefe996f3df28"; // Replace with your WalletConnect Project ID

const core = new Core({ projectId });
let signClient: SignClientType | null = null;

// Global flag to prevent multiple navigations to the target screen.
let navigationHandled = false;

// In-memory session store (to store session and wallet address)
let sessionStore: { walletAddress: string | null } = { walletAddress: null };

/**
 * Returns a promise that resolves when the app state becomes active.
 * Includes a fallback timeout (default 20 seconds) in case the app does not regain focus.
 */
const waitForActive = (timeoutMs = 20000) => {
  return new Promise<void>(resolve => {
    if (AppState.currentState === 'active') {
      resolve();
    } else {
      let didResolve = false;
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active' && !didResolve) {
          didResolve = true;
          subscription.remove();
          resolve();
        }
      });
      // Fallback timeout: if the app does not return to active within timeoutMs, then resolve.
      setTimeout(() => {
        if (!didResolve) {
          didResolve = true;
          subscription.remove();
          console.warn("⚠️ App did not return to active state within timeout, proceeding anyway.");
          resolve();
        }
      }, timeoutMs);
    }
  });
};

/**
 * Waits for an additional delay (in milliseconds). Useful for delaying the deep link prompt.
 */
const extraDelay = (delayMs: number) => {
  return new Promise<void>(resolve => setTimeout(resolve, delayMs));
};

export const initializeWalletConnect = async (
  setWalletAddress: (address: string | null) => void,
  setConnector: (connector: SignClientType | null) => void,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  navigation: any
) => {
  setLoading(true);
  console.log("Attempting to initialize WalletConnect...");

  try {
    signClient = await SignClient.init({
      projectId,
      relayUrl: "wss://relay.walletconnect.com",
      metadata: {
        name: "Node Link",
        description: "Web3 powered Communi",
        url: "https://nodelink.com",
        icons: ["https://example.com/icon.png"],
      },
    });

    console.log("✅ WalletConnect instance created");

    signClient.on("session_delete", () => {
      console.log("🔹 Session deleted");
      setWalletAddress(null); // Clear wallet address when session is deleted
      sessionStore.walletAddress = null; // Clear session from memory
    });

    setConnector(signClient);
  } catch (error) {
    console.error("⚠️ Error initializing WalletConnect:", error);
    Alert.alert("Error", `WalletConnect initialization failed: ${error}`);
  }

  setLoading(false);
};

export const connectWallet = async (
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  navigation: any,
  setWalletAddress: (address: string | null) => void
) => {
  if (!signClient) {
    console.warn("⚠️ WalletConnect is not initialized (ignored)");
    return;
  }

  setLoading(true);

  try {
    console.log("🔹 Creating WalletConnect session...");
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction", "personal_sign"],
          chains: ["eip155:1"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    });

    if (uri) {
      // Add a delay before prompting MetaMask. This delay happens while still in Expo.
      await extraDelay(2000); // Adjust this delay (in ms) as needed

      const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
      console.log("🔹 Opening MetaMask with deep link:", deepLink);

      // Open MetaMask using the deep link
      Linking.openURL(deepLink).catch(err =>
        console.warn("Error opening MetaMask deep link", err)
      );

      // Await user approval in MetaMask
      await approval();
      console.log("✅ Wallet connected");

      // Wait until the app returns to the foreground (Expo active)
      await waitForActive();

      // Retrieve and store wallet address
      const session = signClient.session.getAll()[0];
      if (session) {
        const walletAddress = session.namespaces.eip155.accounts[0].replace('eip155:1:', '');
        console.log("🔹 Connected Wallet Address:", walletAddress);
        setWalletAddress(walletAddress);
      }

      // Navigate only if not already handled
      if (!navigationHandled) {
        navigationHandled = true;
        navigation.replace("ChatScreen");
      }
    }
  } catch (error) {
    console.warn("⚠️ Wallet connection error:", (error as any).message);
    Alert.alert("Connection Error", (error as any).message);
  } finally {
    setLoading(false);
  }
};

export const handleConnectPress = async (
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setWalletAddress: (address: string | null) => void,
  setConnector: (connector: SignClientType | null) => void,
  navigation: any
) => {
  // Reset the navigation flag for each new connection attempt.
  navigationHandled = false;
  setLoading(true);

  if (!signClient) {
    console.log("Initializing WalletConnect...");
    await initializeWalletConnect(setWalletAddress, setConnector, setLoading, navigation);
  }

  if (signClient) {
    console.log("WalletConnect initialized, proceeding to connect...");
    await connectWallet(setLoading, navigation, setWalletAddress);
  } else {
    console.log("WalletConnect initialization failed");
    setLoading(false);
    Alert.alert("Error", "WalletConnect initialization failed. Please try again.");
  }
};
