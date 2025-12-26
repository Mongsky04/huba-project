import { useState, useEffect, useCallback, useRef } from 'react';
import { KgitonSDK, KgitonSDKConfig } from '../KgitonSDK';
import { User } from '../domain/entities/user';
import { AuthResult } from '../domain/entities/auth';
import { LicenseKey } from '../domain/entities/licenseKey';

/**
 * Global SDK instance
 */
let globalSDKInstance: KgitonSDK | null = null;

/**
 * Initialize the global SDK instance
 */
export function initializeSDK(config: KgitonSDKConfig): KgitonSDK {
  globalSDKInstance = new KgitonSDK(config);
  return globalSDKInstance;
}

/**
 * Get the global SDK instance
 */
export function getSDK(): KgitonSDK {
  if (!globalSDKInstance) {
    throw new Error(
      'SDK not initialized. Call initializeSDK() first.'
    );
  }
  return globalSDKInstance;
}

/**
 * Hook to access the SDK instance
 */
export function useSDK(): KgitonSDK {
  return getSDK();
}

/**
 * Authentication state
 */
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for authentication operations
 */
export function useAuth() {
  const sdk = useSDK();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        await sdk.loadConfiguration();
        if (sdk.isAuthenticated()) {
          const user = await sdk.getUserProfile();
          setState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } else {
          setState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize',
        });
      }
    };

    initAuth();
  }, [sdk]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await sdk.login(email, password);
        setState({
          isAuthenticated: true,
          user: result.user,
          loading: false,
          error: null,
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
        throw error;
      }
    },
    [sdk]
  );

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await sdk.logout();
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [sdk]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await sdk.getUserProfile();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      // Ignore errors during refresh
    }
  }, [sdk]);

  return {
    ...state,
    login,
    logout,
    refreshUser,
  };
}

/**
 * Hook for license key operations
 */
export function useLicenseKeys() {
  const sdk = useSDK();
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenseKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const keys = await sdk.getUserLicenseKeys();
      setLicenseKeys(keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch license keys');
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  useEffect(() => {
    fetchLicenseKeys();
  }, [fetchLicenseKeys]);

  const totalBalance = licenseKeys.reduce((sum, lk) => sum + lk.tokenBalance, 0);

  return {
    licenseKeys,
    totalBalance,
    loading,
    error,
    refresh: fetchLicenseKeys,
  };
}

/**
 * Hook for token balance
 */
export function useTokenBalance(licenseKey?: string) {
  const sdk = useSDK();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (licenseKey) {
        const lk = await sdk.getLicenseKeyBalance(licenseKey);
        setBalance(lk?.tokenBalance || 0);
      } else {
        const total = await sdk.getTotalTokenBalance();
        setBalance(total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [sdk, licenseKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}

/**
 * Hook for cart operations
 */
export function useCart(licenseKey: string) {
  const sdk = useSDK();
  const [items, setItems] = useState<Awaited<ReturnType<typeof sdk.huba.getCart>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!licenseKey) return;
    setLoading(true);
    setError(null);
    try {
      const cartItems = await sdk.huba.getCart(licenseKey);
      setItems(cartItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [sdk, licenseKey]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(
    async (params: Parameters<typeof sdk.huba.addToCart>[0]) => {
      try {
        await sdk.huba.addToCart(params);
        await fetchCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to cart');
        throw err;
      }
    },
    [sdk, fetchCart]
  );

  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        await sdk.huba.removeFromCart(cartItemId);
        await fetchCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove from cart');
        throw err;
      }
    },
    [sdk, fetchCart]
  );

  const clearCart = useCallback(async () => {
    try {
      await sdk.huba.clearCart(licenseKey);
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    }
  }, [sdk, licenseKey]);

  const total = items.reduce((sum, item) => {
    if (item.totalPrice) return sum + item.totalPrice;
    if (item.item) {
      let subtotal = item.item.price * item.quantity;
      if (item.quantityPcs && item.item.pricePerPcs) {
        subtotal += item.item.pricePerPcs * item.quantityPcs;
      }
      return sum + subtotal;
    }
    return sum;
  }, 0);

  return {
    items,
    total,
    itemCount: items.length,
    loading,
    error,
    refresh: fetchCart,
    addToCart,
    removeFromCart,
    clearCart,
  };
}

/**
 * Hook for items/products
 */
export function useItems(options: {
  licenseKey: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const sdk = useSDK();
  const [items, setItems] = useState<Awaited<ReturnType<typeof sdk.huba.getItems>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevOptionsRef = useRef<typeof options>();

  const fetchItems = useCallback(async () => {
    if (!options.licenseKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await sdk.huba.getItems(options);
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [sdk, options]);

  useEffect(() => {
    // Only refetch if options changed
    if (JSON.stringify(prevOptionsRef.current) !== JSON.stringify(options)) {
      prevOptionsRef.current = options;
      fetchItems();
    }
  }, [options, fetchItems]);

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
  };
}
