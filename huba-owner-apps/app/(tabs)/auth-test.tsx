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
import { sdk } from '../../lib/sdk-config';
import { showError, showSuccess, generateTestEmail, generateTestPhone } from '../../lib/test-utils';
import { TestButton, TestCard, TestResult } from '../../components/test-components';

export default function AuthTestScreen() {
  // Register states
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerLicense, setRegisterLicense] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [registerCity, setRegisterCity] = useState('');
  const [registerResult, setRegisterResult] = useState<any>(null);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginResult, setLoginResult] = useState<any>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Verify email states
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Reset password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetResult, setResetResult] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Handlers
  const handleRegister = async () => {
    setRegisterLoading(true);
    try {
      const result = await sdk.register({
        email: registerEmail,
        password: registerPassword,
        name: registerName,
        licenseKey: registerLicense,
        phoneNumber: registerPhone,
        address: registerAddress,
        city: registerCity,
      });
      setRegisterResult(result);
      showSuccess('Registration successful! Check your email for verification.');
    } catch (error) {
      showError(error);
      setRegisterResult({ error: String(error) });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGenerateTestData = () => {
    setRegisterEmail(generateTestEmail());
    setRegisterPassword('Password123!');
    setRegisterName('Test User');
    setRegisterLicense('TEST-LICENSE-KEY');
    setRegisterPhone(generateTestPhone());
    setRegisterAddress('Jl. Test No. 123');
    setRegisterCity('Jakarta');
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const result = await sdk.login(loginEmail, loginPassword);
      setLoginResult(result);
      showSuccess(`Login successful! Welcome ${result.user.name}`);
    } catch (error) {
      showError(error);
      setLoginResult({ error: String(error) });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyLoading(true);
    try {
      await sdk.verifyEmail(verifyToken);
      setVerifyResult({ success: true });
      showSuccess('Email verified successfully!');
    } catch (error) {
      showError(error);
      setVerifyResult({ error: String(error) });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await sdk.forgotPassword(resetEmail);
      showSuccess('Password reset email sent! Check your email.');
    } catch (error) {
      showError(error);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      await sdk.resetPassword(resetToken, resetPassword);
      setResetResult({ success: true });
      showSuccess('Password reset successful!');
    } catch (error) {
      showError(error);
      setResetResult({ error: String(error) });
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await sdk.logout();
      showSuccess('Logged out successfully!');
      setLoginResult(null);
    } catch (error) {
      showError(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.header}>🔐 Authentication Tests</Text>

        {/* Register Section */}
        <TestCard title="1. Register User">
          <TestButton
            title="Generate Test Data"
            onPress={handleGenerateTestData}
            variant="secondary"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={registerEmail}
            onChangeText={setRegisterEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={registerPassword}
            onChangeText={setRegisterPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={registerName}
            onChangeText={setRegisterName}
          />
          <TextInput
            style={styles.input}
            placeholder="License Key"
            value={registerLicense}
            onChangeText={setRegisterLicense}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={registerPhone}
            onChangeText={setRegisterPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={registerAddress}
            onChangeText={setRegisterAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={registerCity}
            onChangeText={setRegisterCity}
          />
          
          <TestButton
            title="Register"
            onPress={handleRegister}
            loading={registerLoading}
          />
          
          <TestResult result={registerResult} />
        </TestCard>

        {/* Login Section */}
        <TestCard title="2. Login">
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={loginEmail}
            onChangeText={setLoginEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry
          />
          
          <TestButton
            title="Login"
            onPress={handleLogin}
            loading={loginLoading}
          />
          
          <TestButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
          />
          
          <TestResult result={loginResult} />
        </TestCard>

        {/* Verify Email Section */}
        <TestCard title="3. Verify Email">
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={verifyEmail}
            onChangeText={setVerifyEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Verification Token"
            value={verifyToken}
            onChangeText={setVerifyToken}
          />
          
          <TestButton
            title="Verify Email"
            onPress={handleVerifyEmail}
            loading={verifyLoading}
          />
          
          <TestResult result={verifyResult} />
        </TestCard>

        {/* Reset Password Section */}
        <TestCard title="4. Reset Password">
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={resetEmail}
            onChangeText={setResetEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TestButton
            title="Send Reset Email"
            onPress={handleForgotPassword}
            variant="secondary"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Reset Token"
            value={resetToken}
            onChangeText={setResetToken}
          />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={resetPassword}
            onChangeText={setResetPassword}
            secureTextEntry
          />
          
          <TestButton
            title="Reset Password"
            onPress={handleResetPassword}
            loading={resetLoading}
          />
          
          <TestResult result={resetResult} />
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
