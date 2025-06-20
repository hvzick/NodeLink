import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, Image, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeToggle } from '../../utils/GlobalUtils/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '../../backend/Supabase/RegisterUser';
import { updateSupabaseUser } from '../../backend/Supabase/UpdateUserData';
import { checkUsernameExists } from '../../backend/Supabase/CheckUsername';
import {
  validateName, validateUsername, validateBio
} from '../../utils/MyProfileUtils/Validators';
import { handleOpenEtherscan } from '../../utils/MyProfileUtils/OpenEtherscan';
import { handleCopyAddress } from '../../utils/MyProfileUtils/CopyAddress';
import { handleCopyUsername } from '../../utils/MyProfileUtils/CopyUsername';
import { format } from 'date-fns';
// --- Add required imports ---
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../backend/Supabase/Supabase'; // Ensure you have this export
import 'react-native-url-polyfill/auto';

export default function MyProfile() {
  const navigation = useNavigation();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const styles = getStyles(isDarkMode);

  const [copyWalletText, setCopyWalletText] = useState('');
  const [copyUsernameText, setCopyUsernameText] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);

  // --- EDITING STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedBio, setEditedBio] = useState('');
  // NEW STATE: Holds the local URI of a newly picked avatar
  const [editedAvatarUri, setEditedAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- VALIDATION STATE ---
  const [isNameValid, setIsNameValid] = useState(true);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isBioValid, setIsBioValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);

  useEffect(() => { loadUserData(); }, []);

  useEffect(() => {
    // This effect now correctly populates the edit fields from the main userData state
    if (userData) {
      setEditedName(userData.name || '');
      setEditedUsername(userData.username || '');
      setEditedBio(userData.bio || '');
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) setUserData(JSON.parse(storedData));
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    // Reset validation states
    setIsNameValid(true);
    setIsUsernameValid(true);
    setIsBioValid(true);
  };

  const handleCancelEdit = () => {
    if (userData) {
      setEditedName(userData.name || '');
      setEditedUsername(userData.username || '');
      setEditedBio(userData.bio || '');
    }
    // Reset all temporary edits, including the new avatar
    setEditedAvatarUri(null);
    setIsEditing(false);
    setUsernameTaken(false);
  };

  const handleNameChange = (text: string) => {
    setEditedName(text);
    setIsNameValid(validateName(text));
  };

  const handleUsernameChange = async (text: string) => {
    setEditedUsername(text);
    const valid = validateUsername(text);
    setIsUsernameValid(valid);
    if (valid && text.trim() !== userData?.username) {
      const exists = await checkUsernameExists(text.trim(), userData?.walletAddress || '');
      setUsernameTaken(exists);
    } else {
      setUsernameTaken(false);
    }
  };

  const handleBioChange = (text: string) => {
    setEditedBio(text);
    setIsBioValid(validateBio(text));
  };
  
  // MODIFIED: This function now only PICKS an image. The upload happens on save.
  const handleAvatarPress = async () => {
    if (!isEditing) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "You need to allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return; // User cancelled the action
    }
    // Save the local URI to state to show a preview and flag the change
    setEditedAvatarUri(result.assets[0].uri);
  };

  // REWRITTEN: This function handles all saves (text and avatar) together.
 const handleSaveProfile = async () => {
    if (!userData?.walletAddress) {
      Alert.alert("Error", "Wallet address not found.");
      return;
    }

    if (!isNameValid || !isUsernameValid || !isBioValid || usernameTaken) {
      Alert.alert("Invalid Input", "Please correct the highlighted fields before saving.");
      return;
    }

    const avatarDidChange = editedAvatarUri !== null;
    const textDidChange =
      editedName.trim() !== (userData.name || '') ||
      editedUsername.trim() !== (userData.username || '') ||
      editedBio.trim() !== (userData.bio || '');

    if (!avatarDidChange && !textDidChange) {
      Alert.alert("No Changes", "You haven't made any changes to your profile.");
      return setIsEditing(false);
    }

    setIsSaving(true);
    const updates: { name?: string; username?: string; bio?: string; avatar?: string } = {};

    // --- Avatar Update Logic ---
    let newAvatarUrl: string | null = null;
    if (avatarDidChange && editedAvatarUri) {
      try {
        // Delete the old avatar if it's not the default one
        if (userData?.avatar && userData.avatar !== 'default' && !userData.avatar?.startsWith('require')) {
          const oldAvatarPathParts = userData.avatar.split('/');
          // Assuming the path in storage is like walletAddress/avatar.ext
          const oldAvatarPath = `${userData.walletAddress}/${oldAvatarPathParts.pop()}`;
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([oldAvatarPath]);

          if (deleteError) {
            console.error("Error deleting old avatar:", deleteError);
            Alert.alert("Error", "Failed to delete the previous avatar. Please try again.");
            setIsSaving(false);
            return;
          }
          console.log("✅ Old avatar deleted:", oldAvatarPath);
        }

        // Upload the new avatar
        const fileExtension = editedAvatarUri.split('.').pop()?.toLowerCase() || 'jpg';
        const contentType = `image/${fileExtension}`;
        const fileName = `avatar.${fileExtension}`;
        const filePath = `${userData.walletAddress}/${fileName}`;

        const formData = new FormData();
        formData.append('file', { uri: editedAvatarUri, name: fileName, type: contentType } as any);

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, formData, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
        updates.avatar = newAvatarUrl;
      } catch (error) {
        Alert.alert("Error", "Failed to upload new avatar. Please try again.");
        setIsSaving(false);
        return;
      }
    }

    // --- Text Updates ---
    if (textDidChange) {
      if (editedName.trim() !== (userData.name || '')) updates.name = editedName.trim();
      if (editedUsername.trim() !== (userData.username || '')) updates.username = editedUsername.trim();
      if (editedBio.trim() !== (userData.bio || '')) updates.bio = editedBio.trim();
    }

    // --- Perform Database Update ---
    if (Object.keys(updates).length > 0) {
      const { error: supabaseError } = await updateSupabaseUser(userData.walletAddress, updates);
      if (supabaseError) {
        Alert.alert("Error", `Failed to update profile: ${supabaseError.message}`);
        setIsSaving(false);
        return;
      }
    }

    // --- Update Local State and Storage ---
    const finalUserData = { ...userData, ...updates };
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(finalUserData));
      setUserData(finalUserData);
      setIsEditing(false);
      setEditedAvatarUri(null);
      setUsernameTaken(false);
      Alert.alert("Success", "Your profile has been updated.");
    } catch (err) {
      console.error("AsyncStorage error:", err);
      Alert.alert("Error", "Failed to save profile locally.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%', alignItems: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          {isEditing ? (
            <TouchableOpacity style={styles.backButton} onPress={handleCancelEdit} disabled={isSaving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" style={{ marginRight: 4 }} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleContainer} pointerEvents="none">
            <Text style={styles.headerTitleText}>My Profile</Text>
          </View>

          {isEditing ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleAvatarPress} disabled={!isEditing}>
            <Image
              source={
                // If a new avatar has been picked, show its local URI for an instant preview.
                // Otherwise, show the one from the saved userData.
                editedAvatarUri
                  ? { uri: editedAvatarUri }
                  : (userData?.avatar === 'default' || !userData?.avatar
                    ? require('../../assets/images/default-user-avatar.jpg')
                    : { uri: userData.avatar })
              }
              style={styles.avatar}
            />
            {isEditing && (
              <View style={styles.avatarEditOverlay}>
                <Ionicons name="camera-outline" size={32} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name Section */}
        {isEditing ? (
          <TextInput
            style={[styles.name, styles.editableText, !isNameValid && styles.invalidText]}
            value={editedName}
            onChangeText={handleNameChange}
            placeholder="Your Name"
            maxLength={30}
          />
        ) : (
          <Text style={styles.name}>{userData?.name || "NodeLink User"}</Text>
        )}

        {/* Profile Info Box */}
        <View style={styles.infoBox}>
          {/* Wallet */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Wallet Address</Text>
            <TouchableOpacity
              onPress={() => handleCopyAddress(userData, setCopyWalletText)}
              onLongPress={() => handleOpenEtherscan(userData)}>
              <Text style={styles.wallet}>{userData?.walletAddress || "Loading..."}</Text>
            </TouchableOpacity>
            {copyWalletText ? <Text style={styles.waCopyMessage}>{copyWalletText}</Text> : null}
          </View>

          <View style={styles.separator} />

          {/* Username */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Username</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.username, styles.editableText, (!isUsernameValid || usernameTaken) && styles.invalidText]}
                  value={editedUsername}
                  onChangeText={handleUsernameChange}
                  placeholder="Your Username"
                  maxLength={20}
                  autoCapitalize="none"
                />
                {usernameTaken && (
                  <Text style={[styles.uCopyMessage, { color: '#EB5545' }]}>This username is already taken.</Text>
                )}
              </>
            ) : (
              <TouchableOpacity onPress={() => handleCopyUsername(userData, setCopyUsernameText)}
                                onLongPress={() => handleOpenEtherscan(userData)}>
                <Text style={styles.username}>@{userData?.username || "loading..."}</Text>
              </TouchableOpacity>
            )}
            {copyUsernameText ? <Text style={styles.uCopyMessage}>{copyUsernameText}</Text> : null}
          </View>

          <View style={styles.separator} />

          {/* Bio */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.infoText, styles.editableText, styles.bioInput, !isBioValid && styles.invalidText]}
                value={editedBio}
                onChangeText={handleBioChange}
                placeholder="Tell us about yourself"
                multiline
                maxLength={150}
              />
            ) : (
              <Text style={styles.infoText}>{userData?.bio || "I'm not being spied on!"}</Text>
            )}
          </View>

          <View style={styles.separator} />

          {/* Join Date */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Joined</Text>
            <Text style={styles.infoText}>
              {userData?.created_at
                ? format(new Date(userData.created_at), 'MMMM d, yy')
                : "N/A"}
            </Text>
          </View>
        </View>

        <StatusBar style="auto" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Your styles remain the same
const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1C1C1D' : '#F2F2F2',
      alignItems: 'center',
    },
    headerContainer: {
      height: 40,
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#1C1C1D' : '#F2F2F2',
      width: '100%',
    },
    backButton: {
      position: 'absolute',
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    backButtonText: {
      fontSize: 18,
      color: '#007AFF',
    },
    cancelButtonText: {
      fontSize: 18,
      left: 10,
      color: '#EB5545',
    },
    headerTitleContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 0,
    },
    headerTitleText: {
      fontSize: 20,
      fontWeight: '600',
      fontFamily: 'SF-Pro-Text-Medium',
      color: isDarkMode ? '#fff' : '#333333',
    },
    avatarContainer: {
      marginTop: 10,
      position: 'relative',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarEditOverlay: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    name: {
      marginTop: 20,
      fontSize: 22,
      fontFamily: 'SF-Pro-Text-Medium',
      color: isDarkMode ? '#fff' : '#333333',
      textAlign: 'center',
    },
    infoBox: {
      marginTop: 20,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      width: '90%',
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginVertical: 20,
    },
    infoRow: {
      paddingVertical: 10,
    },
    label: {
      fontSize: 12,
      color: 'gray',
      marginBottom: 4,
    },
    wallet: {
      fontSize: 16,
      color: '#00A86B',
      flexWrap: 'wrap',
    },
    username: {
      fontSize: 16,
      color: '#007AFF',
      textAlign: 'left',
    },
    infoText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333333',
    },
    separator: {
      height: 1,
      backgroundColor: isDarkMode ? '#333' : '#EFEFEF',
      marginVertical: 0,
    },
    waCopyMessage: {
      fontSize: 14,
      color: '#00A86B',
      marginTop: 5,
      fontWeight: '400',
    },
    uCopyMessage: {
      fontSize: 14,
      color: '#007AFF',
      marginTop: 5,
      fontWeight: '400',
    },
    editButton: {
      position: 'absolute',
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    editButtonText: {
      fontSize: 18,
      color: '#007AFF',
    },
    editButtonsContainer: {
      position: 'absolute',
      right: 10,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    saveButton: {
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    saveButtonText: {
      fontSize: 18,
      color: '#007AFF',
      fontWeight: '600',
    },
    editableText: {
      borderBottomWidth: 1,
      borderBottomColor: 'gray',
      paddingBottom: 2,
    },
    bioInput: {
      minHeight: 40,
      textAlignVertical: 'top',
    },
    invalidText: {
      color: '#EB5545',
      borderBottomColor: '#EB5545',
    },
  });