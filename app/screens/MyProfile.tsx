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

export default function MyProfile() {
  const navigation = useNavigation();
  const { currentTheme } = useThemeToggle();
  const isDarkMode = currentTheme === 'dark';
  const styles = getStyles(isDarkMode);

  const [copyWalletText, setCopyWalletText] = useState('');
  const [copyUsernameText, setCopyUsernameText] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isNameValid, setIsNameValid] = useState(true);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isBioValid, setIsBioValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);

  useEffect(() => { loadUserData(); }, []);

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
    setIsEditing(false);
    setUsernameTaken(false);
  };

  const handleNameChange = (text: string) => {
    const valid = validateName(text);
    setIsNameValid(valid);
    setEditedName(text);
  };

  const handleUsernameChange = async (text: string) => {
    const valid = validateUsername(text);
    setIsUsernameValid(valid);
    setEditedUsername(text);

    if (valid && text.trim() !== userData?.username) {
      const exists = await checkUsernameExists(text.trim(), userData?.walletAddress || '');

      setUsernameTaken(exists);
    } else {
      setUsernameTaken(false);
    }
  };

  const handleBioChange = (text: string) => {
    const valid = validateBio(text);
    setIsBioValid(valid);
    setEditedBio(text);
  };

  const handleSaveProfile = async () => {
    if (!userData?.walletAddress) {
      Alert.alert("Error", "Cannot save profile: Wallet address not found.");
      return;
    }

    const isFinalNameValid = validateName(editedName.trim());
    const isFinalUsernameValid = validateUsername(editedUsername.trim());
    const isFinalBioValid = validateBio(editedBio);

    if (!isFinalNameValid || !isFinalUsernameValid || !isFinalBioValid) {
      setIsNameValid(isFinalNameValid);
      setIsUsernameValid(isFinalUsernameValid);
      setIsBioValid(isFinalBioValid);
      Alert.alert("Invalid Input", "Please correct the highlighted fields.");
      return;
    }

    if (
      editedUsername.trim() !== userData.username &&
       (await checkUsernameExists(editedUsername.trim(), userData.walletAddress))
    ) {
      setUsernameTaken(true);
      Alert.alert("Username Taken", "Please choose a different username.");
      return;
    }

    const hasChanges =
      editedName !== (userData.name || '') ||
      editedUsername !== (userData.username || '') ||
      editedBio !== (userData.bio || '');

    if (!hasChanges) {
      Alert.alert("No Changes", "You haven't made any changes.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    const updates: { name?: string; username?: string; bio?: string } = {};
    if (editedName !== userData.name) updates.name = editedName.trim();
    if (editedUsername !== userData.username) updates.username = editedUsername.trim();
    if (editedBio !== userData.bio) updates.bio = editedBio;

    const { error: supabaseError } = await updateSupabaseUser(userData.walletAddress, updates);

    if (supabaseError) {
      Alert.alert("Error", `Failed to update: ${supabaseError.message}`);
      setIsSaving(false);
      return;
    }

    const updatedUserData = { ...userData, ...updates };

    try {
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
      setIsEditing(false);
      setUsernameTaken(false);
      Alert.alert("Success", "Profile updated.");
    } catch (err) {
      console.error("AsyncStorage error:", err);
      Alert.alert("Error", "Failed to save locally.");
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

        {/* Avatar + Name */}
        <Image
          source={userData?.avatar === 'default'
            ? require('../../assets/images/default-user-avatar.jpg')
            : { uri: userData?.avatar }}
          style={styles.avatar}
        />
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

        {/* Profile Info */}
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
                ? format(new Date(userData.created_at), 'MMMM d, yyyy')
                : "N/A"}
            </Text>
          </View>
        </View>

        <StatusBar style="auto" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
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
    avatar: {
      top: 10,
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    name: {
      top: 10,
      fontSize: 22,
      fontFamily: 'SF-Pro-Text-Medium',
      marginTop: 10,
      color: isDarkMode ? '#fff' : '#333333',
      textAlign: 'center',
    },
    infoBox: {
      top: 10,
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
