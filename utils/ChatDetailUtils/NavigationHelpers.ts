import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../app/App";

export function handleProfilePress(navigation: StackNavigationProp<RootStackParamList, "ChatDetail">, conversationId: string) {
  const walletAddress = conversationId.replace("convo_", "");
  if (walletAddress) {
    navigation.navigate("UserProfile", { walletAddress });
  } else {
    console.warn("Could not determine wallet address from conversationId:", conversationId);
  }
} 