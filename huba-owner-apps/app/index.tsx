import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { TestCard } from '../components/test-components';

export default function Index() {
  const navigateToAuth = () => router.push('/(tabs)/auth-test');
  const navigateToCore = () => router.push('/(tabs)/core-test');
  const navigateToHuba = () => router.push('/(tabs)/huba-test');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 React KGiTON SDK</Text>
        <Text style={styles.subtitle}>End-to-End Testing App</Text>
      </View>

      <TestCard title="📚 About">
        <Text style={styles.description}>
          This app is designed to test all features of the react-kgiton-sdk library.
          It covers authentication, user management, license keys, topup, and Huba API integration.
        </Text>
      </TestCard>

      <TestCard title="⚙️ Configuration">
        <Text style={styles.configText}>
          <Text style={styles.bold}>Core API URL:</Text> {'\n'}
          http://10.0.2.2:3000
        </Text>
        <Text style={styles.configText}>
          <Text style={styles.bold}>Huba API URL:</Text> {'\n'}
          http://10.0.2.2:3001
        </Text>
        <Text style={styles.note}>
          💡 Update URLs in lib/sdk-config.ts for your environment
        </Text>
      </TestCard>

      <TestCard title="🧭 Test Sections">
        <TouchableOpacity style={styles.menuItem} onPress={navigateToAuth}>
          <Text style={styles.menuIcon}>🔐</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Authentication Tests</Text>
            <Text style={styles.menuDescription}>
              Register, Login, Email Verification, Password Reset
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={navigateToCore}>
          <Text style={styles.menuIcon}>💳</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Core API Tests</Text>
            <Text style={styles.menuDescription}>
              User Info, License Keys, Token Balance, Transactions, Topup
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={navigateToHuba}>
          <Text style={styles.menuIcon}>🛒</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Huba API Tests</Text>
            <Text style={styles.menuDescription}>
              Extended Profile, Items, Cart, Checkout, Transactions
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </TestCard>

      <TestCard title="📖 Testing Flow">
        <View style={styles.flowItem}>
          <Text style={styles.flowNumber}>1</Text>
          <Text style={styles.flowText}>
            Start backend servers (Core API on port 3000, Huba API on port 3001)
          </Text>
        </View>
        <View style={styles.flowItem}>
          <Text style={styles.flowNumber}>2</Text>
          <Text style={styles.flowText}>
            Test Authentication: Register a new user with a valid license key
          </Text>
        </View>
        <View style={styles.flowItem}>
          <Text style={styles.flowNumber}>3</Text>
          <Text style={styles.flowText}>
            Verify email and login to get access token
          </Text>
        </View>
        <View style={styles.flowItem}>
          <Text style={styles.flowNumber}>4</Text>
          <Text style={styles.flowText}>
            Test Core API: Get user info, license keys, and token balance
          </Text>
        </View>
        <View style={styles.flowItem}>
          <Text style={styles.flowNumber}>5</Text>
          <Text style={styles.flowText}>
            Test Huba API: Browse items, add to cart, and checkout
          </Text>
        </View>
      </TestCard>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>© 2024 KGiTON</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  configText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    color: '#FF9500',
    fontStyle: 'italic',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#C7C7CC',
    fontWeight: '300',
  },
  flowItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  flowNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: 12,
    fontSize: 14,
  },
  flowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    paddingTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
});

