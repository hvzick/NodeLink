// InsertAttachment.ts
import * as ImagePicker from 'expo-image-picker';
import React from 'react';

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

  // Request permission to access the media library
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    console.log('Permission to access media library is required!');
    return undefined;
  }

  // Options for the picker (casting mediaTypes to any if necessary)
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'All' as any, // Use 'All' as a literal cast to any
    quality: 1,
  };

  // Declare the result variable inside the function
  const result = await ImagePicker.launchImageLibraryAsync(options);
  console.log('launchImageLibrary result:', result);

  // Check if the user didn't cancel and at least one asset was returned
  if (!result.canceled && result.assets && result.assets.length > 0) {
    const asset = result.assets[0];
    const newMsg: Omit<Message, 'id'> = {
      sender: 'Me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: asset.uri,
      fileName: asset.fileName ?? 'Selected Media',
    };
    return newMsg;
  }
  
  return undefined;
};

export default handleAttachment;
