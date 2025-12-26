import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { TestCard } from '../components/test-components';

export default function Index() {
  const navigateToAuth = () => router.push('/(tabs)/auth-test');
  const navigateToCore = () => router.push('/(tabs)/core-test');
  const navigateToHuba = () => router.push('/(tabs)/huba-test');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 pb-10">
        <View className="items-center py-6">
          <Text className="text-3xl font-bold text-gray-800 mb-2">🧪 React KGiTON SDK</Text>
          <Text className="text-lg text-gray-600">End-to-End Testing App</Text>
        </View>

        <TestCard title="📚 About">
          <Text className="text-base leading-6 text-gray-700">
            This app is designed to test all features of the react-kgiton-sdk library.
            It covers authentication, user management, license keys, topup, and Huba API integration.
          </Text>
        </TestCard>

        <TestCard title="⚙️ Configuration">
          <Text className="text-sm leading-5 text-gray-800 mb-3">
            <Text className="font-semibold">Core API URL:</Text> {'\n'}
            http://10.0.2.2:3000
          </Text>
          <Text className="text-sm leading-5 text-gray-800 mb-3">
            <Text className="font-semibold">Huba API URL:</Text> {'\n'}
            http://10.0.2.2:3001
          </Text>
          <Text className="text-xs text-orange-500 italic mt-2">
            💡 Update URLs in lib/sdk-config.ts for your environment
          </Text>
        </TestCard>

        <TestCard title="🧭 Test Sections">
          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200" onPress={navigateToAuth}>
            <Text className="text-3xl mr-3">🔐</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800 mb-1">Authentication Tests</Text>
              <Text className="text-xs text-gray-600">
                Register, Login, Email Verification, Password Reset
              </Text>
            </View>
            <Text className="text-2xl text-gray-300 font-light">›</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-200" onPress={navigateToCore}>
            <Text className="text-3xl mr-3">💳</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800 mb-1">Core API Tests</Text>
              <Text className="text-xs text-gray-600">
                User Info, License Keys, Token Balance, Transactions, Topup
              </Text>
            </View>
            <Text className="text-2xl text-gray-300 font-light">›</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-3" onPress={navigateToHuba}>
            <Text className="text-3xl mr-3">🛒</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800 mb-1">Huba API Tests</Text>
              <Text className="text-xs text-gray-600">
                Extended Profile, Items, Cart, Checkout, Transactions
              </Text>
            </View>
            <Text className="text-2xl text-gray-300 font-light">›</Text>
          </TouchableOpacity>
        </TestCard>

        <TestCard title="📖 Testing Flow">
          <View className="flex-row mb-4">
            <Text className="w-7 h-7 rounded-full bg-blue-500 text-white text-center leading-7 font-bold text-sm mr-3">1</Text>
            <Text className="flex-1 text-sm leading-5 text-gray-700 pt-1">
              Start backend servers (Core API on port 3000, Huba API on port 3001)
            </Text>
          </View>
          <View className="flex-row mb-4">
            <Text className="w-7 h-7 rounded-full bg-blue-500 text-white text-center leading-7 font-bold text-sm mr-3">2</Text>
            <Text className="flex-1 text-sm leading-5 text-gray-700 pt-1">
              Test Authentication: Register a new user with a valid license key
            </Text>
          </View>
          <View className="flex-row mb-4">
            <Text className="w-7 h-7 rounded-full bg-blue-500 text-white text-center leading-7 font-bold text-sm mr-3">3</Text>
            <Text className="flex-1 text-sm leading-5 text-gray-700 pt-1">
              Verify email and login to get access token
            </Text>
          </View>
          <View className="flex-row mb-4">
            <Text className="w-7 h-7 rounded-full bg-blue-500 text-white text-center leading-7 font-bold text-sm mr-3">4</Text>
            <Text className="flex-1 text-sm leading-5 text-gray-700 pt-1">
              Test Core API: Get user info, license keys, and token balance
            </Text>
          </View>
          <View className="flex-row mb-4">
            <Text className="w-7 h-7 rounded-full bg-blue-500 text-white text-center leading-7 font-bold text-sm mr-3">5</Text>
            <Text className="flex-1 text-sm leading-5 text-gray-700 pt-1">
              Test Huba API: Browse items, add to cart, and checkout
            </Text>
          </View>
        </TestCard>

        <View className="items-center mt-6 pt-4 border-t border-gray-200">
          <Text className="text-xs text-gray-400 mb-1">Version 1.0.0</Text>
          <Text className="text-xs text-gray-400">© 2024 KGiTON</Text>
        </View>
      </View>
    </ScrollView>
  );
}

