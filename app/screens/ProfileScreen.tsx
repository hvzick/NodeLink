import React from "react";
import { View, Text, StyleSheet, Image, Button } from "react-native";

export default function ProfileScreen() {
  // Dummy data
  const username = "@dummyuser";
  const bio = "Hello! This is a placeholder bio.";

  const handleEditProfile = () => {
    // Replace with your edit profile logic
    console.log("Edit Profile button pressed!");
  };

  return (
    <View style={styles.container}>
      {/* Example profile picture */}
      <Image
        style={styles.profileImage}
        source={{
          uri: "https://via.placeholder.com/150/FF0000/FFFFFF?Text=ProfilePic",
        }}
      />

      <Text style={styles.username}>{username}</Text>
      <Text style={styles.bio}>{bio}</Text>

      <Button title="Edit Profile" onPress={handleEditProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    color: "#555",
  },
});
