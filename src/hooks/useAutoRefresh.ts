import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  enabled: boolean;
  interval: number; // in seconds
  onRefresh: () => void;
}

export const useAutoRefresh = ({ enabled, interval, onRefresh }: UseAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Update the ref when onRefresh changes
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval if enabled
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        onRefreshRef.current();
      }, interval * 1000); // Convert seconds to milliseconds
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};