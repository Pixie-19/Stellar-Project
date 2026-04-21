import { useState, useCallback, useRef, useEffect } from 'react';
import { cache, cacheKeys } from '../services/cache';

/**
 * Custom hook for managing async operations with loading/error states
 * @param {Function} asyncFn - Async function to execute
 * @param {Array} dependencies - Dependencies array for effect
 * @returns {object} { data, loading, error, execute, reset }
 */
export const useAsync = (asyncFn, dependencies = []) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await asyncFn(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (dependencies.length === 0) return;
    execute();
  }, dependencies);

  return { ...state, execute, reset };
};

/**
 * Custom hook for fetching balance with caching
 * @param {string} address - Wallet address
 * @param {Function} fetchFn - Function to fetch balance
 * @param {number} interval - Polling interval in ms (0 = disabled)
 * @returns {object} { balance, loading, error, refresh }
 */
export const useBalance = (address, fetchFn, interval = 0) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!address || !fetchFn) return;

    // Check cache first
    const cacheKey = cacheKeys.balance(address);
    const cached = cache.get(cacheKey);
    if (cached) {
      setBalance(cached);
      return cached;
    }

    setLoading(true);
    try {
      const result = await fetchFn(address);
      cache.set(cacheKey, result, 30 * 1000); // Cache for 30 seconds
      setBalance(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err);
      console.error('Balance fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [address, fetchFn]);

  useEffect(() => {
    refresh();

    if (interval > 0) {
      intervalRef.current = setInterval(refresh, interval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [address, refresh, interval]);

  return { balance, loading, error, refresh };
};

/**
 * Custom hook for transaction polling and tracking
 * @param {string} txHash - Transaction hash to poll
 * @param {Function} checkStatusFn - Function to check transaction status
 * @param {number} maxAttempts - Max polling attempts (default: 30)
 * @param {number} interval - Polling interval in ms (default: 1000)
 * @returns {object} { status, result, error, isComplete }
 */
export const useTransactionPoll = (
  txHash,
  checkStatusFn,
  maxAttempts = 30,
  interval = 1000
) => {
  const [status, setStatus] = useState('pending');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const attemptsRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!txHash) return;

    const poll = async () => {
      if (attemptsRef.current >= maxAttempts) {
        setStatus('timeout');
        setError('Transaction polling timeout');
        setIsComplete(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      try {
        const res = await checkStatusFn(txHash);

        if (res.status === 'SUCCESS') {
          setStatus('success');
          setResult(res.result);
          setIsComplete(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        if (res.status === 'FAILED') {
          setStatus('failed');
          setError(res.error || 'Transaction failed');
          setIsComplete(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        attemptsRef.current += 1;
      } catch (err) {
        setStatus('error');
        setError(err.message);
        setIsComplete(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    intervalRef.current = setInterval(poll, interval);
    poll(); // Poll immediately

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [txHash, checkStatusFn, maxAttempts, interval]);

  return { status, result, error, isComplete };
};

/**
 * Custom hook for debounced value
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in ms
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for managing form state with validation
 * @param {object} initialValues - Initial form values
 * @param {Function} validate - Validation function
 * @returns {object} Form state and handlers
 */
export const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e.preventDefault();
    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await onSubmit(values);
    }
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
  };
};

/**
 * Custom hook for local storage persistence
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @returns {Array} [storedValue, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('localStorage read error:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('localStorage write error:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};
