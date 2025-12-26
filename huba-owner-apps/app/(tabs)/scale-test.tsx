import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { sdk } from '../../lib/sdk-config';
import { showError, showSuccess } from '../../lib/test-utils';
import { TestButton, TestCard, TestResult } from '../../components/test-components';
import type { ScaleDevice, ScaleReading } from '../../sdk-source/domain/entities/scale';

export default function ScaleTestScreen() {
  // Scan states
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [scanDuration, setScanDuration] = useState('5');

  // Connection states
  const [connectLicense, setConnectLicense] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  // Weight reading states
  const [currentWeight, setCurrentWeight] = useState<ScaleReading | null>(null);
  const [weightHistory, setWeightHistory] = useState<ScaleReading[]>([]);
  const [reading, setReading] = useState(false);
  const [listening, setListening] = useState(false);

  // Auto-connect states
  const [autoConnectLicense, setAutoConnectLicense] = useState('');
  const [autoConnecting, setAutoConnecting] = useState(false);

  // Bluetooth status
  const [btStatus, setBtStatus] = useState<any>(null);

  const handleCheckBluetooth = async () => {
    try {
      const enabled = await sdk.scale.isBluetoothEnabled();
      setBtStatus({ enabled });
      if (enabled) {
        showSuccess('Bluetooth is enabled');
      } else {
        showError('Bluetooth is not enabled. Please enable Bluetooth.');
      }
    } catch (error) {
      showError(error);
      setBtStatus({ error: String(error) });
    }
  };

  const handleScanScales = async () => {
    setScanning(true);
    setDevices([]);
    try {
      const duration = parseInt(scanDuration) || 5;
      showSuccess(`Scanning for ${duration} seconds...`);
      
      const foundDevices = await sdk.scale.scanForScales(duration);
      setDevices(foundDevices);
      
      if (foundDevices.length === 0) {
        showError('No scales found. Make sure your scale is nearby and powered on.');
      } else {
        showSuccess(`Found ${foundDevices.length} scale(s)`);
      }
    } catch (error) {
      showError(error);
    } finally {
      setScanning(false);
    }
  };

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      showSuccess(`Selected: ${device.name}`);
    }
  };

  const handleConnectScale = async () => {
    if (!selectedDeviceId) {
      showError('Please select a scale device first');
      return;
    }
    if (!connectLicense.trim()) {
      showError('Please enter a license key');
      return;
    }

    setConnecting(true);
    try {
      const status = await sdk.scale.connectScale(connectLicense, selectedDeviceId);
      setConnectionStatus(status);
      showSuccess(`Connected to ${status.device?.name}`);
      
      // Start listening for weight
      startWeightListener();
    } catch (error) {
      showError(error);
      setConnectionStatus({ error: String(error) });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      stopWeightListener();
      await sdk.scale.disconnectScale();
      setConnectionStatus(null);
      setCurrentWeight(null);
      showSuccess('Disconnected from scale');
    } catch (error) {
      showError(error);
    }
  };

  const handleReadWeight = async () => {
    setReading(true);
    try {
      const weight = await sdk.scale.readWeight();
      setCurrentWeight(weight);
      addToWeightHistory(weight);
      showSuccess(`Weight: ${weight.weight} ${weight.unit}`);
    } catch (error) {
      showError(error);
    } finally {
      setReading(false);
    }
  };

  const startWeightListener = () => {
    if (listening) return;
    
    const unsubscribe = sdk.scale.onWeightReading((reading) => {
      console.log('Weight reading:', reading);
      setCurrentWeight(reading);
      addToWeightHistory(reading);
    });
    
    setListening(true);
    showSuccess('Started listening for weight readings');
    
    // Store unsubscribe function
    (global as any).__scaleUnsubscribe = unsubscribe;
  };

  const stopWeightListener = () => {
    if ((global as any).__scaleUnsubscribe) {
      (global as any).__scaleUnsubscribe();
      (global as any).__scaleUnsubscribe = null;
      setListening(false);
      showSuccess('Stopped listening for weight readings');
    }
  };

  const addToWeightHistory = (reading: ScaleReading) => {
    setWeightHistory(prev => {
      const newHistory = [reading, ...prev];
      return newHistory.slice(0, 10); // Keep last 10 readings
    });
  };

  const handleAutoConnect = async () => {
    if (!autoConnectLicense.trim()) {
      showError('Please enter a license key');
      return;
    }

    setAutoConnecting(true);
    try {
      const status = await sdk.scale.autoConnectScale(autoConnectLicense);
      setConnectionStatus(status);
      showSuccess(`Auto-connected to ${status.device?.name}`);
      startWeightListener();
    } catch (error) {
      showError(error);
    } finally {
      setAutoConnecting(false);
    }
  };

  const handleGetStatus = () => {
    const status = sdk.scale.getConnectionStatus();
    setConnectionStatus(status);
    if (status.connected) {
      showSuccess(`Connected to ${status.device?.name}`);
    } else {
      showSuccess('Not connected');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
        <Text className="text-2xl font-bold mb-5 text-gray-800">📊 Bluetooth Scale Tests</Text>

        {/* Bluetooth Status */}
        <TestCard title="1. Check Bluetooth">
          <TestButton
            title="Check Bluetooth Status"
            onPress={handleCheckBluetooth}
          />
          <TestResult result={btStatus} />
        </TestCard>

        {/* Scan for Scales */}
        <TestCard title="2. Scan for Scales">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="Scan duration (seconds)"
            value={scanDuration}
            onChangeText={setScanDuration}
            keyboardType="numeric"
          />
          <TestButton
            title={scanning ? 'Scanning...' : 'Scan for Scales'}
            onPress={handleScanScales}
            loading={scanning}
          />
          
          {devices.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm font-semibold mb-2 text-gray-700">Found Scales:</Text>
              {devices.map((device) => (
                <View
                  key={device.id}
                  className={`p-3 rounded-lg mb-2 border ${
                    selectedDeviceId === device.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200'
                  }`}
                  onTouchEnd={() => handleSelectDevice(device.id)}
                >
                  <Text className="font-semibold text-gray-900">{device.name || 'Unknown'}</Text>
                  <Text className="text-xs text-gray-500 mt-1">ID: {device.id}</Text>
                  {device.rssi && (
                    <Text className="text-xs text-gray-500">Signal: {device.rssi} dBm</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </TestCard>

        {/* Connect to Scale */}
        <TestCard title="3. Connect to Scale">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="License Key"
            value={connectLicense}
            onChangeText={setConnectLicense}
          />
          <Text className="text-xs text-gray-500 mb-2">
            Selected Device: {selectedDeviceId ? devices.find(d => d.id === selectedDeviceId)?.name : 'None'}
          </Text>
          <TestButton
            title="Connect to Scale"
            onPress={handleConnectScale}
            loading={connecting}
            disabled={!selectedDeviceId}
          />
          <TestButton
            title="Disconnect"
            onPress={handleDisconnect}
            variant="danger"
          />
          <TestButton
            title="Get Connection Status"
            onPress={handleGetStatus}
            variant="secondary"
          />
          <TestResult result={connectionStatus} />
        </TestCard>

        {/* Auto Connect */}
        <TestCard title="4. Auto Connect (Saved Scale)">
          <TextInput
            className="bg-white p-3 rounded-lg my-1.5 border border-gray-200 text-base"
            placeholder="License Key"
            value={autoConnectLicense}
            onChangeText={setAutoConnectLicense}
          />
          <TestButton
            title="Auto Connect to Saved Scale"
            onPress={handleAutoConnect}
            loading={autoConnecting}
          />
          <Text className="text-xs text-gray-500 mt-2">
            💡 Auto-connect will connect to the last paired scale for this license key
          </Text>
        </TestCard>

        {/* Read Weight */}
        <TestCard title="5. Read Weight">
          <TestButton
            title="Read Current Weight"
            onPress={handleReadWeight}
            loading={reading}
          />
          <TestButton
            title={listening ? 'Stop Real-time Monitoring' : 'Start Real-time Monitoring'}
            onPress={listening ? stopWeightListener : startWeightListener}
            variant={listening ? 'danger' : 'secondary'}
          />
          
          {currentWeight && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
              <Text className="text-lg font-bold text-blue-900">
                {currentWeight.weight.toFixed(2)} {currentWeight.unit}
              </Text>
              <Text className="text-xs text-blue-600 mt-1">
                {currentWeight.stable ? '✓ Stable' : '⋯ Stabilizing'}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {currentWeight.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          )}

          {weightHistory.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm font-semibold mb-2 text-gray-700">Weight History:</Text>
              {weightHistory.map((reading, index) => (
                <View key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-1">
                  <Text className="text-sm font-mono text-gray-800">
                    {reading.weight.toFixed(2)} {reading.unit}
                    <Text className="text-xs text-gray-500">
                      {' '}• {reading.timestamp.toLocaleTimeString()}
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TestCard>

        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <Text className="text-xs text-yellow-800 font-semibold mb-2">📝 Notes:</Text>
          <Text className="text-xs text-yellow-700 leading-5">
            • Make sure Bluetooth is enabled on your device{'\n'}
            • Scale must be nearby and powered on{'\n'}
            • First scan, then select a device, then connect{'\n'}
            • Weight readings are real-time when monitoring is active{'\n'}
            • Disconnect before scanning again
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
