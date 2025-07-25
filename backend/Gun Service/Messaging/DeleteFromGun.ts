import { gun } from "../GunState"; // adjust to your actual Gun instance path
import AsyncStorage from "@react-native-async-storage/async-storage";

export const deleteConversationFromMyNode = async (
  otherWalletAddress: string
) => {
  const myWallet = await AsyncStorage.getItem("walletAddress");
  if (!myWallet) {
    console.warn("No wallet address found in storage.");
    return;
  }

  const convoId = `convo_${otherWalletAddress}`;
  const path = `nodelink/${convoId}`;
  const ref = gun.get(path);

  console.log(`Deleting conversation at ${path}`);

  ref.map().once((data: any, key: any) => {
    if (data) {
      ref.get(key).put(null); // Delete message by setting it to null
      console.log(`Deleted message ${key}`);
    }
  });
};
