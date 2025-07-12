import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, Image, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  LayoutAnimation,
  UIManager,
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
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../backend/Supabase/Supabase';
import 'react-native-url-polyfill/auto';

export default function MyProfile() {
  const navigation = useNavigation();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const styles = getStyles(isDarkMode);

  // --- STATE ---
  const [copyWalletText, setCopyWalletText] = useState('');
  const [copyUsernameText, setCopyUsernameText] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedAvatarUri, setEditedAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isNameValid, setIsNameValid] = useState(true);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isBioValid, setIsBioValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error', duration = 3000) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotification({ message, type });
    
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setNotification(null);
    }, duration);
  };
  
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData?.walletAddress) {
      (async () => {
        // Only load the key pair from local storage, do not generate or upload
        const stored = await AsyncStorage.getItem(`crypto_key_pair_${userData.walletAddress}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPublicKey(parsed.publicKey);
          setPrivateKey(parsed.privateKey);
        } else {
          setPublicKey(null);
          setPrivateKey(null);
        }
      })();
    }
  }, [userData?.walletAddress]);

  useEffect(() => {
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
  
  const handleAvatarPress = async () => {
    if (!isEditing) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "You need to allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    setEditedAvatarUri(result.assets[0].uri);
  };

  const handleSaveProfile = async () => {
    if (!userData?.walletAddress) {
      showNotification("Wallet address not found.", 'error');
      return;
    }
    if (!isNameValid || !isUsernameValid || !isBioValid || usernameTaken) {
      showNotification("Please correct the highlighted fields.", 'error');
      return;
    }
    const avatarDidChange = editedAvatarUri !== null;
    const textDidChange =
      editedName.trim() !== (userData.name || '') ||
      editedUsername.trim() !== (userData.username || '') ||
      editedBio.trim() !== (userData.bio || '');
    if (!avatarDidChange && !textDidChange) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const updates: { name?: string; username?: string; bio?: string; avatar?: string } = {};
    if (avatarDidChange && editedAvatarUri) {
      try {
        if (userData?.avatar && userData.avatar !== 'default' && !userData.avatar?.startsWith('require')) {
          const oldAvatarPathParts = userData.avatar.split('/');
          const oldAvatarPath = `${userData.walletAddress}/${oldAvatarPathParts.pop()?.split('?')[0]}`;
          await supabase.storage.from('avatars').remove([oldAvatarPath]);
        }
        const fileExtension = editedAvatarUri.split('.').pop()?.toLowerCase() || 'jpg';
        const contentType = `image/${fileExtension}`;
        const fileName = `avatar.${fileExtension}`;
        const filePath = `${userData.walletAddress}/${fileName}`;
        const formData = new FormData();
        formData.append('file', { uri: editedAvatarUri, name: fileName, type: contentType } as any);
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, formData, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        updates.avatar = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        showNotification(`Avatar upload failed: ${message}`, 'error');
        setIsSaving(false);
        return;
      }
    }
    if (textDidChange) {
      if (editedName.trim() !== (userData.name || '')) updates.name = editedName.trim();
      if (editedUsername.trim() !== (userData.username || '')) updates.username = editedUsername.trim();
      if (editedBio.trim() !== (userData.bio || '')) updates.bio = editedBio.trim();
    }
    if (Object.keys(updates).length > 0) {
      const { error: supabaseError } = await updateSupabaseUser(userData.walletAddress, updates);
      if (supabaseError) {
        showNotification(`Update failed: ${supabaseError.message}`, 'error');
        setIsSaving(false);
        return;
      }
    }
    const finalUserData = { ...userData, ...updates };
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(finalUserData));
      setUserData(finalUserData);
      setIsEditing(false);
      setEditedAvatarUri(null);
      setUsernameTaken(false);
      showNotification("Profile updated successfully!", 'success');
    } catch (err) {
      showNotification("Failed to save profile locally.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%', alignItems: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
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

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleAvatarPress} disabled={!isEditing}>
            <Image
              source={
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

        <View style={styles.infoBox}>
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

          {/* Public Key Row */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Public Key</Text>
            <Text style={styles.infoText} selectable>
              {publicKey || 'Loading...'}
            </Text>
          </View>

          {/* Private Key Row */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Private Key</Text>
            <TouchableOpacity onPress={() => setShowPrivateKey(v => !v)} activeOpacity={0.7}>
              <Text style={styles.infoText} selectable={showPrivateKey}>
                {privateKey
                  ? showPrivateKey
                    ? privateKey
                    : '•'.repeat(privateKey.length)
                  : 'Loading...'}
              </Text>
              <Text style={{ color: '#007AFF', fontSize: 12, marginTop: 2 }}>
                {showPrivateKey ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Joined</Text>
            <Text style={styles.infoText}>
              {userData?.created_at
                ? format(new Date(userData.created_at), 'MMMM d, yy')
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* --- Notification Area --- */}
        {notification && (
            <View style={[
                styles.notificationContainer,
                // --- THIS LINE IS CHANGED ---
                { backgroundColor: notification.type === 'success' ? '#007AFF' : '#dc3545' }
            ]}>
                <Text style={styles.notificationText}>{notification.message}</Text>
            </View>
        )}

        <StatusBar style="auto" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
      marginBottom: 0, 
    },
    infoRow: {
      paddingVertical: 12,
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
      color: '#dc3545',
      borderBottomColor: '#dc3545',
    },
    notificationContainer: {
      width: '90%',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 15,
      marginTop: 20,
    },
    notificationText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});