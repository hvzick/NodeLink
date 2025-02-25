import 'react-native-get-random-values';
import { Alert, Linking } from "react-native";
import { Core } from "@walletconnect/core";
import SignClient from "@walletconnect/sign-client";

type SignClientType = InstanceType<typeof SignClient>;

const projectId = "0b183fc0707f5795787aefe996f3df28"; // Replace with your WalletConnect Project ID

const core = new Core({ projectId });
let signClient: SignClientType | null = null;

// In-memory session store (to store session and wallet address)
let sessionStore: { walletAddress: string | null } = { walletAddress: null };

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
        Alert.alert("Error", `WalletConnect initialization failed:`);
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
            const deepLink = `metamask://wc?uri=${encodeURIComponent(uri)}`;
            console.log("🔹 Opening MetaMask with deep link:", deepLink);

            // Open MetaMask with deep link
            Linking.openURL(deepLink).catch(err => console.warn("", err));

            await approval();
            console.log("✅ Wallet connected");

            // Ensure that ChatScreen is part of the stack before navigating
            setTimeout(() => {
                navigation.replace("ChatScreen"); // Now that we're sure ChatScreen is available in the stack
            }, 500); // Add a small delay to allow navigation state to update
        }
    } catch (error) {
        console.warn("⚠️ Wallet connection error (ignored):", (error as any)['message']);
    }

    try {
        const session = signClient.session.getAll()[0];
        if (session) {
            const walletAddress = session.namespaces.eip155.accounts[0].replace('eip155:1:', '');
            console.log("🔹 Connected Wallet Address:", walletAddress);
            sessionStore.walletAddress = walletAddress; // Store in memory
            setWalletAddress(walletAddress); // Store the wallet address in memory
        }
    } catch (error) {
        console.warn("⚠️ Error retrieving session data (ignored):", (error as any)['message']);
    }

    setLoading(false);
};

// Logout function that removes session and wallet address
export const logout = (setWalletAddress: (address: string | null) => void) => {
    console.log("🔹 Logging out...");

    // Clear session data in memory
    sessionStore.walletAddress = null;

    // Remove the wallet address
    setWalletAddress(null);

    // Additional logic can be added to remove the session from WalletConnect if needed.
    if (signClient) {
        signClient.disconnect(); // This will delete the session and close the connection
        console.log("🔹 Session removed from WalletConnect.");
    }
};

export const handleConnectPress = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setWalletAddress: (address: string | null) => void,
    setConnector: (connector: SignClientType | null) => void,
    navigation: any
) => {
    setLoading(true);

    if (!signClient) {
        console.log("Initializing WalletConnect...");
        await initializeWalletConnect(setWalletAddress, setConnector, setLoading, navigation);
    }

    if (signClient) {
        console.log("WalletConnect initialized, proceeding to connect...");
        connectWallet(setLoading, navigation, setWalletAddress);
    } else {
        console.log("WalletConnect initialization failed");
        setLoading(false);
        Alert.alert("Error", "WalletConnect initialization failed. Please try again.");
    }
};
