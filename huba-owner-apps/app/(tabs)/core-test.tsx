import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sdk } from '../lib/sdk-config';
import { showError, showSuccess } from '../lib/test-utils';
import { TestButton, TestCard, TestResult } from '../components/test-components';

export default function CoreApiTestScreen() {
  // User info states
  const [userResult, setUserResult] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(false);

  // License keys states
  const [licenseKeysResult, setLicenseKeysResult] = useState<any>(null);
  const [licenseKeysLoading, setLicenseKeysLoading] = useState(false);

  // Token balance states
  const [tokenBalanceResult, setTokenBalanceResult] = useState<any>(null);
  const [tokenBalanceLoading, setTokenBalanceLoading] = useState(false);

  // Transaction history states
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionLicense, setTransactionLicense] = useState('');

  // Topup states
  const [topupLicense, setTopupLicense] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupPaymentMethod, setTopupPaymentMethod] = useState('');
  const [topupResult, setTopupResult] = useState<any>(null);
  const [topupLoading, setTopupLoading] = useState(false);

  // Handlers
  const handleGetCurrentUser = async () => {
    setUserLoading(true);
    try {
      const result = await sdk.getCurrentUser();
      setUserResult(result);
      showSuccess('User data retrieved!');
    } catch (error) {
      showError(error);
      setUserResult({ error: String(error) });
    } finally {
      setUserLoading(false);
    }
  };

  const handleGetLicenseKeys = async () => {
    setLicenseKeysLoading(true);
    try {
      const result = await sdk.getUserLicenseKeys();
      setLicenseKeysResult(result);
      showSuccess(`Found ${result.length} license key(s)`);
    } catch (error) {
      showError(error);
      setLicenseKeysResult({ error: String(error) });
    } finally {
      setLicenseKeysLoading(false);
    }
  };

  const handleGetTokenBalance = async () => {
    setTokenBalanceLoading(true);
    try {
      const total = await sdk.getTotalTokenBalance();
      const keys = await sdk.getUserLicenseKeys();
      
      const balances = keys.map(lk => ({
        key: lk.key,
        balance: lk.tokenBalance,
        status: lk.status,
      }));
      
      setTokenBalanceResult({
        total,
        balances,
      });
      showSuccess(`Total balance: ${total} tokens`);
    } catch (error) {
      showError(error);
      setTokenBalanceResult({ error: String(error) });
    } finally {
      setTokenBalanceLoading(false);
    }
  };

  const handleGetTransactions = async () => {
    setTransactionLoading(true);
    try {
      const result = await sdk.getUserTransactions(transactionLicense || undefined);
      setTransactionResult(result);
      showSuccess(`Found ${result.length} transaction(s)`);
    } catch (error) {
      showError(error);
      setTransactionResult({ error: String(error) });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleTopup = async () => {
    setTopupLoading(true);
    try {
      const result = await sdk.topup({
        licenseKey: topupLicense,
        amount: parseFloat(topupAmount),
        paymentMethod: topupPaymentMethod,
      });
      setTopupResult(result);
      showSuccess(`Topup successful! Transaction: ${result.transactionId}`);
    } catch (error) {
      showError(error);
      setTopupResult({ error: String(error) });
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.header}>💳 Core API Tests</Text>

        {/* Get Current User */}
        <TestCard title="1. Get Current User">
          <TestButton
            title="Get Current User"
            onPress={handleGetCurrentUser}
            loading={userLoading}
          />
          <TestResult result={userResult} />
        </TestCard>

        {/* Get License Keys */}
        <TestCard title="2. Get License Keys">
          <TestButton
            title="Get My License Keys"
            onPress={handleGetLicenseKeys}
            loading={licenseKeysLoading}
          />
          <TestResult result={licenseKeysResult} />
        </TestCard>

        {/* Get Token Balance */}
        <TestCard title="3. Get Token Balance">
          <TestButton
            title="Get Token Balance"
            onPress={handleGetTokenBalance}
            loading={tokenBalanceLoading}
          />
          <TestResult result={tokenBalanceResult} />
        </TestCard>

        {/* Transaction History */}
        <TestCard title="4. Transaction History">
          <TextInput
            style={styles.input}
            placeholder="License Key (optional)"
            value={transactionLicense}
            onChangeText={setTransactionLicense}
          />
          <TestButton
            title="Get Transactions"
            onPress={handleGetTransactions}
            loading={transactionLoading}
          />
          <TestResult result={transactionResult} />
        </TestCard>

        {/* Topup */}
        <TestCard title="5. Topup">
          <TextInput
            style={styles.input}
            placeholder="License Key"
            value={topupLicense}
            onChangeText={setTopupLicense}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount (e.g., 100000)"
            value={topupAmount}
            onChangeText={setTopupAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Payment Method (e.g., credit_card, bank_transfer)"
            value={topupPaymentMethod}
            onChangeText={setTopupPaymentMethod}
          />
          <TestButton
            title="Topup"
            onPress={handleTopup}
            loading={topupLoading}
          />
          <TestResult result={topupResult} />
        </TestCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
  },
});
