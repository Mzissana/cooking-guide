import { useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }

    const storedValue = window.localStorage.getItem(key);

    if (storedValue) {
      try {
        return JSON.parse(storedValue);
      } catch (error) {
        console.warn(`Failed to parse localStorage key "${key}"`, error);
      }
    }

    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
