import "react-native-get-random-values";
import { Alert, Linking, AppState } from "react-native";
import { SignClient } from "@walletconnect/sign-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SignClientType = InstanceType<typeof SignClient>;

const projectId = "0b183fc0707f5795787aefe996f3df28"; // Replace with your WalletConnect Project ID

let signClient: SignClientType | null = null;
// Prevent multiple navigations
let navigationHandled = false;

const waitForActive = (timeoutMs = 20000) => {
  return new Promise<void>((resolve) => {
    if (AppState.currentState === "active") {
      resolve();
    } else {
      let didResolve = false;
      const subscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (nextAppState === "active" && !didResolve) {
            didResolve = true;
            subscription.remove();
            resolve();
          }
        }
      );
      setTimeout(() => {
        if (!didResolve) {
          didResolve = true;
          subscription.remove();
          console.warn(
            "⚠️ App did not return to active state within timeout, proceeding anyway."
          );
          resolve();
        }
      }, timeoutMs);
    }
  });
};

const extraDelay = (delayMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delayMs));

// Initialize WalletConnect client
export const initializeWalletConnect = async (
  setWalletAddress: (address: string | null) => void,
  setConnector: (connector: SignClientType | null) => void,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoading(true);
  console.log("Attempting to initialize WalletConnect...");

  try {
    signClient = await SignClient.init({
      projectId,
      relayUrl: "wss://relay.walletconnect.com",
      metadata: {
        name: "Node Link",
        description: "Haziks Branch",
        url: "https://nodelink.com",
        icons: ["https://example.com/icon.png"],
      },
    });

    // console.log("WalletConnect instance created");

    signClient.on("session_delete", () => {
      console.log("🔹 Session deleted");
      setWalletAddress(null);
    });

    setConnector(signClient);
  } catch (error) {
    console.error("⚠️ Error initializing WalletConnect:", error);
    Alert.alert("Error", `WalletConnect initialization failed: ${error}`);
  } finally {
    setLoading(false);
  }
};

// Connect to wallet and navigate to Main
export const connectWallet = async (
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  navigation: any,
  setWalletAddress: (address: string | null) => void,
  setIsAuthenticated: (auth: boolean) => void
) => {
  if (!signClient) {
    console.warn("WalletConnect is not initialized (ignored)");
    return;
  }

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
      await extraDelay(0);
      const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
      console.log("🔹 Opening MetaMask with deep link:", deepLink);
      Linking.openURL(deepLink).catch((err) =>
        console.warn("Error opening MetaMask deep link", err)
      );

      await approval();
      console.log("Wallet connected");
      await waitForActive();

      const session = signClient.session.getAll()[0];
      if (session) {
        const walletAddress = session.namespaces.eip155.accounts[0].replace(
          "eip155:1:",
          ""
        );
        console.log("🔹 Connected Wallet Address:", walletAddress);

        // Persist address
        await AsyncStorage.setItem("walletAddress", walletAddress);
        console.log("Wallet address stored in AsyncStorage");
        setWalletAddress(walletAddress);
      }

      if (!navigationHandled) {
        navigationHandled = true;
        setIsAuthenticated(true);

        // Climb up to the root navigator before resetting
        let parentNav = navigation.getParent();
        while (parentNav?.getParent()) {
          parentNav = parentNav.getParent();
        }
        parentNav?.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      }
    }
  } catch (error: any) {
    console.warn("Wallet connection error:", error.message);
    Alert.alert("Connection Error", error.message);
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
    await initializeWalletConnect(setWalletAddress, setConnector, setLoading);
  }

  if (signClient) {
    console.log("WalletConnect initialized, proceeding to connect...");
    await connectWallet(
      setLoading,
      navigation,
      setWalletAddress,
      setIsAuthenticated
    );
  } else {
    console.log("WalletConnect initialization failed");
    setLoading(false);
    Alert.alert(
      "Error",
      "WalletConnect initialization failed. Please try again."
    );
  }
};
