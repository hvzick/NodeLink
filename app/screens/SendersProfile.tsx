import React, { useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen: React.FC = () => {
  // Create an animated value for scaling the button on press.
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSendMessage = () => {
    // Animate button press by scaling down then back up.
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Your send message logic goes here.
      console.log('Send Message tapped');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back & Title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { /* Handle back action */ }}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Profile Image */}
        <Image
          source={require('./assets/img.png')}
          style={styles.profileImage}
        />

        {/* Name & Username */}
        <Text style={styles.name}>Sheikh Hazik</Text>
        <Text style={styles.username}>@hvzick</Text>

        {/* Wallet Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Address:</Text>
          <Text style={styles.walletAddress}>
            0xe65EAC370D1079688f8e1e4B9a35A841aac2bac
          </Text>
        </View>

        {/* About Me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me:</Text>
          <Text style={styles.sectionContent}>Hi im using nodelink</Text>
        </View>

        {/* Minimal Send Message Button with Animation */}
        <TouchableOpacity onPress={handleSendMessage} activeOpacity={0.85}>
          <Animated.View style={[styles.gradientButton, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#FFFFFF', '#FFFFFF']} // Solid white background
              style={styles.gradientBackground}
            >
              <Icon name="send" size={20} color="#000" style={styles.buttonIcon} />
              <Text style={styles.gradientButtonText}>Send message</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: {
    color: 'blue',
    fontSize: 16,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
    alignSelf: 'center', // Centers the avatar
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center', // Centers the name text
  },
  username: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 16,
    textAlign: 'center', // Centers the username text
  },
  section: {
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  walletAddress: {
    color: '#037EE5',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 17
  },
  sectionContent: {
    color: '#555',
  },
  // Outer container for the button with shadow/elevation.
  gradientButton: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
    marginTop: 32,
    alignSelf: 'center', // Centers the button
  },
  // Actual background and content layout.
  gradientBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 15,
  },
  buttonIcon: {
    marginRight: 8,
  },
  gradientButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
