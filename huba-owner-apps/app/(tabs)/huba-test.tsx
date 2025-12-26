import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sdk } from '../../lib/sdk-config';
import { showError, showSuccess } from '../../lib/test-utils';
import { TestButton, TestCard, TestResult } from '../../components/test-components';

export default function HubaApiTestScreen() {
  // Profile states
  const [profileLicense, setProfileLicense] = useState('');
  const [profileResult, setProfileResult] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [updatePhone, setUpdatePhone] = useState('');
  const [updateAddress, setUpdateAddress] = useState('');
  const [updateCity, setUpdateCity] = useState('');
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Items states
  const [itemsLicense, setItemsLicense] = useState('');
  const [itemsCategory, setItemsCategory] = useState('');
  const [itemsSearch, setItemsSearch] = useState('');
  const [itemsResult, setItemsResult] = useState<any>(null);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Cart states
  const [cartLicense, setCartLicense] = useState('');
  const [cartResult, setCartResult] = useState<any>(null);
  const [cartLoading, setCartLoading] = useState(false);
  
  const [addItemId, setAddItemId] = useState('');
  const [addQuantity, setAddQuantity] = useState('');
  const [addQuantityPcs, setAddQuantityPcs] = useState('');
  const [addResult, setAddResult] = useState<any>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Checkout states
  const [checkoutLicense, setCheckoutLicense] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Transaction states
  const [transLicense, setTransLicense] = useState('');
  const [transResult, setTransResult] = useState<any>(null);
  const [transLoading, setTransLoading] = useState(false);

  // Handlers
  const handleGetProfile = async () => {
    setProfileLoading(true);
    try {
      const result = await sdk.huba.getProfile();
      setProfileResult(result);
      showSuccess('Profile retrieved!');
    } catch (error) {
      showError(error);
      setProfileResult({ error: String(error) });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdateLoading(true);
    try {
      const result = await sdk.huba.updateProfile({
        phoneNumber: updatePhone,
        address: updateAddress,
        city: updateCity,
      });
      setUpdateResult(result);
      showSuccess('Profile updated!');
    } catch (error) {
      showError(error);
      setUpdateResult({ error: String(error) });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleGetItems = async () => {
    setItemsLoading(true);
    try {
      const result = await sdk.huba.getItems({
        licenseKey: itemsLicense,
        category: itemsCategory || undefined,
        search: itemsSearch || undefined,
        page: 1,
        limit: 20,
      });
      setItemsResult(result);
      showSuccess(`Found ${result.length} item(s)`);
    } catch (error) {
      showError(error);
      setItemsResult({ error: String(error) });
    } finally {
      setItemsLoading(false);
    }
  };

  const handleGetCart = async () => {
    setCartLoading(true);
    try {
      const result = await sdk.huba.getCart(cartLicense);
      setCartResult(result);
      showSuccess(`Cart has ${result.length} item(s)`);
    } catch (error) {
      showError(error);
      setCartResult({ error: String(error) });
    } finally {
      setCartLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAddLoading(true);
    try {
      const result = await sdk.huba.addToCart({
        licenseKey: cartLicense,
        itemId: addItemId,
        quantity: parseFloat(addQuantity),
        quantityPcs: addQuantityPcs ? parseInt(addQuantityPcs) : undefined,
      });
      setAddResult(result);
      showSuccess('Item added to cart!');
    } catch (error) {
      showError(error);
      setAddResult({ error: String(error) });
    } finally {
      setAddLoading(false);
    }
  };

  const handleClearCart = async () => {
    try {
      await sdk.huba.clearCart(cartLicense);
      showSuccess('Cart cleared!');
      setCartResult(null);
    } catch (error) {
      showError(error);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const result = await sdk.huba.checkout({
        licenseKey: checkoutLicense,
      });
      setCheckoutResult(result);
      showSuccess(`Checkout successful! Transaction: ${result.id}`);
    } catch (error) {
      showError(error);
      setCheckoutResult({ error: String(error) });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleGetTransactions = async () => {
    setTransLoading(true);
    try {
      const result = await sdk.huba.getTransactions({
        licenseKey: transLicense,
        page: 1,
        limit: 20,
      });
      setTransResult(result);
      showSuccess(`Found ${result.length} transaction(s)`);
    } catch (error) {
      showError(error);
      setTransResult({ error: String(error) });
    } finally {
      setTransLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
        <Text className="text-2xl font-bold mb-5 text-gray-800">🛒 Huba API Tests</Text>

        {/* Extended Profile */}
        <TestCard title="1. Extended Profile">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="License Key"
            value={profileLicense}
            onChangeText={setProfileLicense}
          />
          <TestButton
            title="Get Profile"
            onPress={handleGetProfile}
            loading={profileLoading}
          />
          <TestResult result={profileResult} />
          
          <View className="h-px bg-gray-200 my-4" />
          
          <Text className="text-base font-semibold mt-3 mb-2 text-gray-600">Update Profile:</Text>
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Phone Number"
            value={updatePhone}
            onChangeText={setUpdatePhone}
          />
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Address"
            value={updateAddress}
            onChangeText={setUpdateAddress}
          />
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="City"
            value={updateCity}
            onChangeText={setUpdateCity}
          />
          <TestButton
            title="Update Profile"
            onPress={handleUpdateProfile}
            loading={updateLoading}
            variant="secondary"
          />
          <TestResult result={updateResult} />
        </TestCard>

        {/* Items */}
        <TestCard title="2. Browse Items">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="License Key"
            value={itemsLicense}
            onChangeText={setItemsLicense}
          />
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Category (optional)"
            value={itemsCategory}
            onChangeText={setItemsCategory}
          />
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Search (optional)"
            value={itemsSearch}
            onChangeText={setItemsSearch}
          />
          <TestButton
            title="Get Items"
            onPress={handleGetItems}
            loading={itemsLoading}
          />
          <TestResult result={itemsResult} />
        </TestCard>

        {/* Cart */}
        <TestCard title="3. Shopping Cart">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="License Key"
            value={cartLicense}
            onChangeText={setCartLicense}
          />
          <TestButton
            title="Get Cart"
            onPress={handleGetCart}
            loading={cartLoading}
          />
          <TestResult result={cartResult} />
          
          <View className="h-px bg-gray-200 my-4" />
          
          <Text className="text-base font-semibold mt-3 mb-2 text-gray-600">Add to Cart:</Text>
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Item ID"
            value={addItemId}
            onChangeText={setAddItemId}
          />
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Quantity (kg)"
            value={addQuantity}
            onChangeText={setAddQuantity}
            keyboardType="decimal-pad"
          />
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Quantity (pieces, optional)"
            value={addQuantityPcs}
            onChangeText={setAddQuantityPcs}
            keyboardType="number-pad"
          />
          <TestButton
            title="Add to Cart"
            onPress={handleAddToCart}
            loading={addLoading}
            variant="secondary"
          />
          <TestButton
            title="Clear Cart"
            onPress={handleClearCart}
            variant="danger"
          />
          <TestResult result={addResult} />
        </TestCard>

        {/* Checkout */}
        <TestCard title="4. Checkout">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="License Key"
            value={checkoutLicense}
            onChangeText={setCheckoutLicense}
          />
          <TestButton
            title="Checkout"
            onPress={handleCheckout}
            loading={checkoutLoading}
          />
          <TestResult result={checkoutResult} />
        </TestCard>

        {/* Transactions */}
        <TestCard title="5. Transaction History">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="License Key"
            value={transLicense}
            onChangeText={setTransLicense}
          />
          <TestButton
            title="Get Transactions"
            onPress={handleGetTransactions}
            loading={transLoading}
          />
          <TestResult result={transResult} />
        </TestCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
