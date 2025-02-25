import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

// Import separate SVGs for light and dark themes
import SvgLogoDark from '../../assets/images/logo-white.svg';
import SvgLogoLight from '../../assets/images/logo-black.svg';

type NavigationProp = StackNavigationProp<RootStackParamList, 'LoadingScreen'>;

export default function LoadingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    Animated.timing(logoScaleAnim, {
      toValue: 1.5,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      navigation.replace('Auth'); // Navigate to Auth screen after animation
    });
  }, []);

  const LogoComponent = colorScheme === 'dark' ? SvgLogoDark : SvgLogoLight;

  return (
    <View style={[styles.container, colorScheme === 'dark' ? darkStyles.container : lightStyles.container]}>
      <Animated.View style={{ transform: [{ scale: logoScaleAnim }] }}>
        <LogoComponent width={200} height={200} />
      </Animated.View>

      <Text style={[styles.staticText, colorScheme === 'dark' ? darkStyles.text : lightStyles.text]}>
        Node Link
      </Text>
    </View>
  );
}

// Common Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticText: {
    position: 'absolute',
    bottom: 70,
    fontSize: 25,
    fontWeight: 'bold',
    fontFamily: 'MontserratAlternates-Regular',
  },
});

// Light Theme Styles
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  text: {
    color: 'black',
  },
});

// Dark Theme Styles
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
  },
  text: {
    color: 'white',
  },
});
