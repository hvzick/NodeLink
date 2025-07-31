import * as ImagePicker from "expo-image-picker";
import { supabase } from "./Supabase";
import { Alert } from "react-native";

export const pickAndUploadAvatar = async (
  walletAddress: string
): Promise<string | null> => {
  // 1. Request media library permissions
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Permission Denied",
      "You need to allow access to your photos to update your avatar."
    );
    return null;
  }

  // 2. Launch the image picker to select an image
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality: 0.8, // Use slightly lower quality for faster uploads
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  // 3. Handle cases where the user cancels the selection
  if (result.canceled || !result.assets || result.assets.length === 0) {
    console.log("Image selection cancelled by user.");
    return null;
  }

  // 4. Get the URI of the selected image
  const image = result.assets[0];
  const uri = image.uri;

  try {
    // 5. Prepare the file for upload using FormData
    const fileExtension = uri.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = `image/${fileExtension}`;
    const fileName = `avatar.${fileExtension}`;
    const filePath = `${walletAddress}/${fileName}`;

    const formData = new FormData();
    // The 'as any' is a common workaround as React Native's file object structure
    // differs slightly from the web standard expected by some libraries.
    formData.append("file", {
      uri: uri,
      name: fileName,
      type: contentType,
    } as any);

    // 6. Upload the image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, formData, {
        upsert: true, // This will overwrite the file if it already exists
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      Alert.alert(
        "Upload Error",
        `Failed to upload image: ${uploadError.message}`
      );
      return null;
    }

    // 7. Get the public URL of the newly uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Could not get public URL for the uploaded avatar.");
    }

    // 8. Add a timestamp to the URL to bypass image caching issues
    const finalUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

    console.log("Avatar uploaded successfully:", finalUrl);
    return finalUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    Alert.alert("Error", `Failed to upload avatar: ${errorMessage}`);
    return null;
  }
};
