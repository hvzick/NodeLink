// utils/ChatDetailUtils/InsertAttachment.ts
import * as ImagePicker from "expo-image-picker";
import { Message } from "../../backend/Local database/SQLite/MessageStructure";

export default async function handleAttachment(): Promise<Partial<Message> | null> {
  try {
    console.log("📎 Attachment pressed");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 30,
    });

    console.log("📁 Attachment result:", result);

    if (result.canceled || !result.assets || result.assets.length === 0)
      return null;

    const asset = result.assets[0];

    if (asset.type === "image") {
      return {
        imageUrl: asset.uri,
      };
    } else if (asset.type === "video") {
      return {
        videoUrl: asset.uri,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Attachment error:", error);
    return null;
  }
}
