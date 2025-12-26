/**
 * Bluetooth Scale Device Information
 */
export interface ScaleDevice {
  /** Device ID/UUID */
  id: string;
  /** Device Name */
  name: string | null;
  /** Signal Strength (RSSI) */
  rssi?: number;
  /** Is currently connected */
  isConnected: boolean;
}

/**
 * Scale Weight Reading
 */
export interface ScaleReading {
  /** Weight value */
  weight: number;
  /** Unit of measurement */
  unit: 'kg' | 'g' | 'lb';
  /** Timestamp of reading */
  timestamp: Date;
  /** Is weight stable */
  stable: boolean;
}

/**
 * Scale Connection Status
 */
export interface ScaleConnectionStatus {
  /** Is connected */
  connected: boolean;
  /** Connected device info */
  device?: ScaleDevice;
  /** License key associated with scale */
  licenseKey?: string;
}

/**
 * Scale Configuration by License Key
 */
export interface ScaleConfiguration {
  /** License Key */
  licenseKey: string;
  /** Bluetooth Device ID */
  deviceId: string;
  /** Device Name */
  deviceName: string;
  /** Auto-connect on app start */
  autoConnect: boolean;
  /** Last connected timestamp */
  lastConnected?: Date;
}
