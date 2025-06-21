// InsertAttachment.ts
import * as ImagePicker from 'expo-image-picker';

export type Message = {
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  videoUrl?: string;
  audioUrl?: string;
};

const handleAttachment = async (): Promise<Omit<Message, 'id'> | undefined> => {
  console.log('attachment pressed');
  
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    console.log('Permission to access media library is required!');
    return undefined;
  }
  
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 1,
  });
  console.log('launchImageLibrary result:', result);

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const asset = result.assets[0];
    let newMsg: Omit<Message, 'id'> = {
      sender: 'Me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    if (asset.type?.startsWith('image')) {
      newMsg = { ...newMsg, imageUrl: asset.uri, fileName: asset.fileName ?? 'Selected Media' };
    } else if (asset.type?.startsWith('video')) {
      newMsg = { ...newMsg, videoUrl: asset.uri, fileName: asset.fileName ?? 'Selected Video' };
    } else if (asset.type?.startsWith('audio')) {
      newMsg = { ...newMsg, audioUrl: asset.uri, fileName: asset.fileName ?? 'Selected Audio' };
    }
    
    return newMsg;
  }
  
  return undefined;
};

export default handleAttachment;
