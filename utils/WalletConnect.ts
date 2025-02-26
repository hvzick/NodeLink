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
        description: "Web3 powered Communication",
        url: "https://nodelink.com",
        icons: ["https://example.com/icon.png"],
      },
    });

    console.log("✅ WalletConnect instance created");

    signClient.on("session_delete", () => {
      console.log("🔹 Session deleted");
      setWalletAddress(null);
      sessionStore.walletAddress = null;
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
  setWalletAddress: (address: string | null) => void,
  setIsAuthenticated: (auth: boolean) => void
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
      await extraDelay(2000);
      const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
      console.log("🔹 Opening MetaMask with deep link:", deepLink);
      Linking.openURL(deepLink).catch(err =>
        console.warn("Error opening MetaMask deep link", err)
      );
      await approval();
      console.log("✅ Wallet connected");
      await waitForActive();

      const session = signClient.session.getAll()[0];
      if (session) {
        const walletAddress = session.namespaces.eip155.accounts[0].replace('eip155:1:', '');
        console.log("🔹 Connected Wallet Address:", walletAddress);
        setWalletAddress(walletAddress);
      }

      if (!navigationHandled) {
        navigationHandled = true;
        // Update authentication state
        setIsAuthenticated(true);
        // Reset navigation state to show the Main (BottomTabs) screen.
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });        
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
  navigation: any,
  setIsAuthenticated: (auth: boolean) => void
) => {
  navigationHandled = false;
  setLoading(true);

  if (!signClient) {
    console.log("Initializing WalletConnect...");
    await initializeWalletConnect(setWalletAddress, setConnector, setLoading, navigation);
  }

  if (signClient) {
    console.log("WalletConnect initialized, proceeding to connect...");
    await connectWallet(setLoading, navigation, setWalletAddress, setIsAuthenticated);
  } else {
    console.log("WalletConnect initialization failed");
    setLoading(false);
    Alert.alert("Error", "WalletConnect initialization failed. Please try again.");
  }
};
