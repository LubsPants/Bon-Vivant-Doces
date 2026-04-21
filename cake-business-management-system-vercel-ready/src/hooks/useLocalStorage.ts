import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = () => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    return readValue();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(readValue());
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  return [storedValue, setStoredValue] as const;
}
