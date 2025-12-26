import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { TestCard } from '../components/test-components';

export default function Index() {
  const navigateToAuth = () => router.push('/(tabs)/auth-test');
  const navigateToCore = () => router.push('/(tabs)/core-test');
  const navigateToHuba = () => router.push('/(tabs)/huba-test');
  const navigateToScale = () => router.push('/(tabs)/scale-test');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white shadow-sm mb-2">
        <View className="items-center py-8 px-4">
          <Text className="text-3xl font-bold text-gray-900 mb-2">🧪 React KGiTON SDK</Text>
          <Text className="text-base text-gray-500">End-to-End Testing App</Text>
        </View>
      </View>
      
      <View className="px-4 pb-10">
        <TestCard title="📚 About">
          <Text className="text-sm leading-6 text-gray-600">
            This app is designed to test all features of the react-kgiton-sdk library.
            It covers authentication, user management, license keys, topup, Huba API integration, and Bluetooth scale connection.
          </Text>
        </TestCard>

        <TestCard title="⚙️ Configuration">
          <View>
            <View className="mb-3">
              <Text className="text-xs text-gray-500 font-semibold mb-1">Core API URL:</Text>
              <Text className="text-sm text-gray-800 font-mono">http://10.0.2.2:3000</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500 font-semibold mb-1">Huba API URL:</Text>
              <Text className="text-sm text-gray-800 font-mono">http://10.0.2.2:3001</Text>
            </View>
          </View>
          <View className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
            <Text className="text-xs text-orange-700">
              💡 Update URLs in lib/sdk-config.ts for your environment
            </Text>
          </View>
        </TestCard>

        <TestCard title="🧭 Test Sections">
          <TouchableOpacity 
            className="flex-row items-center py-4 px-3 bg-blue-50 border border-blue-100 rounded-lg mb-2 active:bg-blue-100" 
            onPress={navigateToAuth}
          >
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
              <Text className="text-2xl">🔐</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">Authentication Tests</Text>
              <Text className="text-xs text-gray-500">
                Register, Login, Email Verification, Password Reset
              </Text>
            </View>
            <Text className="text-xl text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-4 px-3 bg-purple-50 border border-purple-100 rounded-lg mb-2 active:bg-purple-100" 
            onPress={navigateToCore}
          >
            <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center mr-3">
              <Text className="text-2xl">💳</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">Core API Tests</Text>
              <Text className="text-xs text-gray-500">
                User Info, License Keys, Token Balance, Transactions, Topup
              </Text>
            </View>
            <Text className="text-xl text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-4 px-3 bg-green-50 border border-green-100 rounded-lg mb-2 active:bg-green-100" 
            onPress={navigateToHuba}
          >
            <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mr-3">
              <Text className="text-2xl">🛒</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">Huba API Tests</Text>
              <Text className="text-xs text-gray-500">
                Extended Profile, Items, Cart, Checkout, Transactions
              </Text>
            </View>
            <Text className="text-xl text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center py-4 px-3 bg-orange-50 border border-orange-100 rounded-lg active:bg-orange-100" 
            onPress={navigateToScale}
          >
            <View className="w-12 h-12 bg-orange-500 rounded-full items-center justify-center mr-3">
              <Text className="text-2xl">📊</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">Bluetooth Scale Tests</Text>
              <Text className="text-xs text-gray-500">
                Scan, Connect, Read Weight from Timbangan by License Key
              </Text>
            </View>
            <Text className="text-xl text-gray-400">›</Text>
          </TouchableOpacity>
        </TestCard>

        <TestCard title="📖 Testing Flow">
          <View className="flex-row mb-3">
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">1</Text>
            </View>
            <Text className="flex-1 text-sm leading-5 text-gray-600">
              Start backend servers (Core API on port 3000, Huba API on port 3001)
            </Text>
          </View>
          <View className="flex-row mb-3">
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">2</Text>
            </View>
            <Text className="flex-1 text-sm leading-5 text-gray-600">
              Test Authentication: Register a new user with a valid license key
            </Text>
          </View>
          <View className="flex-row mb-3">
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">3</Text>
            </View>
            <Text className="flex-1 text-sm leading-5 text-gray-600">
              Verify email and login to get access token
            </Text>
          </View>
          <View className="flex-row mb-3">
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">4</Text>
            </View>
            <Text className="flex-1 text-sm leading-5 text-gray-600">
              Test Core API: Get user info, license keys, and token balance
            </Text>
          </View>
          <View className="flex-row">
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">5</Text>
            </View>
            <Text className="flex-1 text-sm leading-5 text-gray-600">
              Test Huba API: Browse items, add to cart, and checkout
            </Text>
          </View>
        </TestCard>

        <View className="items-center mt-8 pt-6 border-t border-gray-200">
          <Text className="text-xs text-gray-400 mb-1">Version 1.0.0</Text>
          <Text className="text-xs text-gray-400">© 2024 KGiTON</Text>
        </View>
      </View>
    </ScrollView>
  );
}

