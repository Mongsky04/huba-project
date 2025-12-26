import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { 
  ScaleDevice, 
  ScaleReading, 
  ScaleConnectionStatus,
  ScaleConfiguration 
} from '../domain/entities/scale';

// Standard Weight Scale Service UUIDs (Bluetooth SIG)
const WEIGHT_SCALE_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb';
const WEIGHT_MEASUREMENT_CHAR_UUID = '00002a9d-0000-1000-8000-00805f9b34fb';

/**
 * Bluetooth Scale Service using react-native-ble-plx
 * 
 * Manages Bluetooth connection to scales/timbangan by license key.
 * Supports scanning, pairing, and reading weight data.
 * 
 * @example
 * ```typescript
 * // Scan for scales
 * const devices = await sdk.scale.scanForScales(5);
 * 
 * // Connect to scale with license key
 * await sdk.scale.connectScale('LICENSE-KEY', devices[0].id);
 * 
 * // Listen for weight readings
 * const unsubscribe = sdk.scale.onWeightReading((reading) => {
 *   console.log(`Weight: ${reading.weight} ${reading.unit}`);
 * });
 * 
 * // Disconnect
 * await sdk.scale.disconnectScale();
 * ```
 */
export class ScaleService {
  private bleManager: BleManager;
  private connectedDevice: Device | null = null;
  private currentLicenseKey: string | null = null;
  private configurations: Map<string, ScaleConfiguration> = new Map();
  private weightListeners: Set<(reading: ScaleReading) => void> = new Set();
  private weightSubscription: any = null;

  constructor() {
    this.bleManager = new BleManager();
    this.initializeBLE();
  }

  /**
   * Initialize Bluetooth Low Energy Manager
   */
  private async initializeBLE() {
    try {
      const state = await this.bleManager.state();
      console.log('✅ BLE Manager initialized, state:', state);
      
      // Monitor state changes
      this.bleManager.onStateChange((state) => {
        console.log('BLE State changed:', state);
      }, true);
    } catch (error) {
      console.error('❌ Error initializing BLE:', error);
    }
  }

  /**
   * Check if Bluetooth is enabled
   * 
   * @returns Promise<boolean>
   */
  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.bleManager.state();
    return state === State.PoweredOn;
  }

  /**
   * Request to enable Bluetooth (Android only)
   */
  async enableBluetooth(): Promise<void> {
    try {
      const state = await this.bleManager.state();
      if (state !== State.PoweredOn) {
        console.log('Requesting Bluetooth enable...');
        // Note: This will show system dialog on Android
      }
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
      throw error;
    }
  }

  /**
   * Scan for nearby Bluetooth scale devices
   * 
   * @param durationSeconds - Scan duration in seconds (default: 5)
   * @returns Promise<ScaleDevice[]> - List of discovered scale devices
   */
  async scanForScales(durationSeconds: number = 5): Promise<ScaleDevice[]> {
    const devices = new Map<string, ScaleDevice>();

    try {
      console.log(`🔍 Scanning for Bluetooth scales (${durationSeconds}s)...`);

      // Check Bluetooth state
      const state = await this.bleManager.state();
      if (state !== State.PoweredOn) {
        throw new Error('Bluetooth is not enabled. Please enable Bluetooth and try again.');
      }

      // Start scanning
      this.bleManager.startDeviceScan(
        null, // Scan for all devices (or specify service UUIDs)
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }

          if (device && device.name) {
            const name = device.name.toLowerCase();
            
            // Filter for scale devices
            const isScale = 
              name.includes('scale') || 
              name.includes('weight') || 
              name.includes('timbangan') ||
              name.includes('cas') ||
              name.includes('mettler') ||
              name.includes('ohaus') ||
              name.includes('a&d') ||
              name.includes('weighing') ||
              name.includes('balance');

            if (isScale && !devices.has(device.id)) {
              console.log(`📊 Found scale: ${device.name} (${device.id})`);
              
              devices.set(device.id, {
                id: device.id,
                name: device.name,
                rssi: device.rssi || undefined,
                isConnected: false,
              });
            }
          }
        }
      );

      // Wait for scan duration
      await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));

      // Stop scanning
      this.bleManager.stopDeviceScan();

      const foundDevices = Array.from(devices.values());
      console.log(`✅ Scan complete. Found ${foundDevices.length} scale(s)`);
      
      return foundDevices;
    } catch (error) {
      this.bleManager.stopDeviceScan();
      console.error('❌ Error scanning for scales:', error);
      throw new Error(`Failed to scan for scales: ${error}`);
    }
  }

  /**
   * Connect to a scale device using license key
   * 
   * @param licenseKey - License key to associate with scale
   * @param deviceId - Bluetooth device ID
   * @returns Promise<ScaleConnectionStatus>
   */
  async connectScale(
    licenseKey: string,
    deviceId: string
  ): Promise<ScaleConnectionStatus> {
    try {
      console.log(`🔗 Connecting to scale: ${deviceId} for license: ${licenseKey}`);

      // Disconnect previous device if connected
      if (this.connectedDevice) {
        console.log('Disconnecting previous device...');
        await this.disconnectScale();
      }

      // Connect to device
      const device = await this.bleManager.connectToDevice(deviceId);
      console.log('✅ Connected to device:', device.name);

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();
      console.log('✅ Services discovered');

      // Save configuration
      const config: ScaleConfiguration = {
        licenseKey,
        deviceId: device.id,
        deviceName: device.name || 'Scale',
        autoConnect: true,
        lastConnected: new Date(),
      };
      this.configurations.set(licenseKey, config);

      // Update connected device
      this.connectedDevice = device;
      this.currentLicenseKey = licenseKey;

      // Start monitoring weight
      await this.startWeightMonitoring(device);

      console.log(`✅ Scale connected successfully for license: ${licenseKey}`);

      return {
        connected: true,
        device: {
          id: device.id,
          name: device.name,
          rssi: device.rssi || undefined,
          isConnected: true,
        },
        licenseKey,
      };
    } catch (error) {
      console.error('❌ Error connecting to scale:', error);
      throw new Error(`Failed to connect to scale: ${error}`);
    }
  }

  /**
   * Disconnect from current scale
   * 
   * @returns Promise<void>
   */
  async disconnectScale(): Promise<void> {
    if (!this.connectedDevice) {
      return;
    }

    try {
      // Stop weight monitoring
      if (this.weightSubscription) {
        this.weightSubscription.remove();
        this.weightSubscription = null;
      }

      // Disconnect device
      const deviceId = this.connectedDevice.id;
      await this.bleManager.cancelDeviceConnection(deviceId);
      
      console.log(`✅ Disconnected from scale: ${deviceId}`);
      
      this.connectedDevice = null;
      this.currentLicenseKey = null;
    } catch (error) {
      console.error('❌ Error disconnecting scale:', error);
      throw new Error(`Failed to disconnect scale: ${error}`);
    }
  }

  /**
   * Get current connection status
   * 
   * @returns ScaleConnectionStatus
   */
  getConnectionStatus(): ScaleConnectionStatus {
    if (!this.connectedDevice) {
      return { connected: false };
    }

    return {
      connected: true,
      device: {
        id: this.connectedDevice.id,
        name: this.connectedDevice.name,
        rssi: this.connectedDevice.rssi || undefined,
        isConnected: true,
      },
      licenseKey: this.currentLicenseKey || undefined,
    };
  }

  /**
   * Get saved scale configuration for a license key
   * 
   * @param licenseKey - License key
   * @returns ScaleConfiguration | null
   */
  getScaleConfiguration(licenseKey: string): ScaleConfiguration | null {
    return this.configurations.get(licenseKey) || null;
  }

  /**
   * Auto-connect to saved scale for a license key
   * 
   * @param licenseKey - License key
   * @returns Promise<ScaleConnectionStatus>
   */
  async autoConnectScale(licenseKey: string): Promise<ScaleConnectionStatus> {
    const config = this.getScaleConfiguration(licenseKey);
    if (!config || !config.autoConnect) {
      throw new Error('No saved scale configuration found for this license key');
    }

    console.log(`🔄 Auto-connecting to saved scale for license: ${licenseKey}`);
    return await this.connectScale(licenseKey, config.deviceId);
  }

  /**
   * Start monitoring weight from connected scale
   * 
   * @param device - Connected BLE device
   */
  private async startWeightMonitoring(device: Device): Promise<void> {
    try {
      console.log('📊 Starting weight monitoring...');

      // Monitor weight measurement characteristic
      this.weightSubscription = device.monitorCharacteristicForService(
        WEIGHT_SCALE_SERVICE_UUID,
        WEIGHT_MEASUREMENT_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Weight monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            const reading = this.parseWeightData(characteristic);
            if (reading) {
              this.notifyWeightListeners(reading);
            }
          }
        }
      );

      console.log('✅ Weight monitoring started');
    } catch (error) {
      console.warn('⚠️ Could not start weight monitoring:', error);
      console.warn('Your scale may not support standard Weight Scale Service.');
      console.warn('You may need to customize the service/characteristic UUIDs.');
    }
  }

  /**
   * Parse weight data from BLE characteristic
   * Based on Bluetooth Weight Scale Service standard
   * 
   * @param characteristic - BLE characteristic with weight data
   * @returns ScaleReading | null
   */
  private parseWeightData(characteristic: Characteristic): ScaleReading | null {
    try {
      if (!characteristic.value) return null;

      // Decode base64 value to bytes
      const data = this.base64ToBytes(characteristic.value);
      
      if (data.length < 3) return null;

      // Parse according to Weight Scale Service specification
      const flags = data[0];
      const weightUnit = flags & 0x01; // Bit 0: 0 = SI (kg), 1 = Imperial (lb)
      
      // Weight is in bytes 1-2 (little-endian, 16-bit)
      const weightRaw = data[1] | (data[2] << 8);
      const weight = weightRaw / 100; // Usually in 0.01 units
      
      return {
        weight,
        unit: weightUnit === 0 ? 'kg' : 'lb',
        timestamp: new Date(),
        stable: true,
      };
    } catch (error) {
      console.error('❌ Error parsing weight data:', error);
      return null;
    }
  }

  /**
   * Convert base64 string to byte array
   */
  private base64ToBytes(base64: string): number[] {
    const binaryString = atob(base64);
    const bytes = new Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Add listener for weight readings
   * 
   * @param callback - Function to call with weight readings
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = sdk.scale.onWeightReading((reading) => {
   *   console.log(`Weight: ${reading.weight} ${reading.unit}`);
   *   if (reading.stable) {
   *     console.log('Weight is stable!');
   *   }
   * });
   * 
   * // Later, when done:
   * unsubscribe();
   * ```
   */
  onWeightReading(callback: (reading: ScaleReading) => void): () => void {
    this.weightListeners.add(callback);
    return () => {
      this.weightListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of new weight reading
   */
  private notifyWeightListeners(reading: ScaleReading): void {
    this.weightListeners.forEach(listener => {
      try {
        listener(reading);
      } catch (error) {
        console.error('❌ Error in weight listener:', error);
      }
    });
  }

  /**
   * Read current weight (one-time read)
   * 
   * @returns Promise<ScaleReading>
   */
  async readWeight(): Promise<ScaleReading> {
    if (!this.connectedDevice) {
      throw new Error('No scale connected. Call connectScale() first.');
    }

    try {
      console.log('📊 Reading weight from scale...');

      const characteristic = await this.connectedDevice.readCharacteristicForService(
        WEIGHT_SCALE_SERVICE_UUID,
        WEIGHT_MEASUREMENT_CHAR_UUID
      );

      const reading = this.parseWeightData(characteristic);
      if (!reading) {
        throw new Error('Failed to parse weight data from scale');
      }

      console.log(`✅ Weight reading: ${reading.weight} ${reading.unit}`);
      return reading;
    } catch (error) {
      console.error('❌ Error reading weight:', error);
      throw new Error(`Failed to read weight: ${error}`);
    }
  }

  /**
   * Cleanup and destroy BLE manager
   */
  async destroy(): Promise<void> {
    try {
      if (this.connectedDevice) {
        await this.disconnectScale();
      }
      this.bleManager.destroy();
      this.weightListeners.clear();
      this.configurations.clear();
    } catch (error) {
      console.error('Error destroying ScaleService:', error);
    }
  }
}
