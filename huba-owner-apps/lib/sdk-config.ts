import { KgitonSDK } from 'react-kgiton-sdk';

/**
 * SDK Configuration
 * 
 * Update these URLs based on your environment:
 * - For Android Emulator: http://10.0.2.2:3000
 * - For iOS Simulator: http://localhost:3000
 * - For Physical Device: http://YOUR_IP:3000
 */
export const SDK_CONFIG = {
  coreApiUrl: 'http://192.168.0.105:3000', // Change this based on your setup
  hubaApiUrl: 'http://192.168.0.105:3001', // Change this based on your setup
  enableLogging: true,
};

// Global SDK instance
export const sdk = new KgitonSDK(SDK_CONFIG);
