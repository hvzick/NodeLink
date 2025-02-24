import 'react-native-get-random-values';
import { Alert, Linking } from "react-native";
import { Core } from "@walletconnect/core";
import SignClient from "@walletconnect/sign-client";

type SignClientType = InstanceType<typeof SignClient>;

console.log("🔹 WalletConnect v2 script loaded");

const projectId = "0b183fc0707f5795787aefe996f3df28"; // Replace with your WalletConnect Project ID

const core = new Core({ projectId });
let signClient: SignClientType | null = null;

export const initializeWalletConnect = async (
    setWalletAddress: (address: string | null) => void,
    setConnector: (connector: SignClientType | null) => void,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    navigation: any
) => {
    setLoading(true);
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
            setWalletAddress(null);
        });

        setConnector(signClient);
    } catch (error) {
        console.warn("⚠️ WalletConnect initialization error (ignored):", error);
    }
    setLoading(false);
};

export const connectWallet = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    navigation: any
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
            
            // dont pass any message here itll throw decoding error which is negligible
            Linking.openURL(deepLink).catch(err => console.warn("", err));

            await approval();
            console.log("✅ Wallet connected");
            navigation.replace("Home");
        }
    } catch (error) {
        console.warn("⚠️ Wallet connection error (ignored):", error);
    }

    try {
        const session = signClient.session.getAll()[0];
        if (session) {
            console.log("🔹 Connected Wallet Address:", session.namespaces.eip155.accounts[0]);
            console.log("🔹 Connected Chain ID:", session.namespaces.eip155.chains[0]);
        }
    } catch (error) {
        console.warn("⚠️ Error retrieving session data (ignored):", error);
    }

    setLoading(false);
};
