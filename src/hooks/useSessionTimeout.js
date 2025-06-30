// src/hooks/useSessionTimeout.js - Automatic session timeout for security
import { useState, useEffect, useCallback, useRef } from 'react';

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export const useSessionTimeout = (isAuthenticated, logout) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set new warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set new session timeout
    timeoutRef.current = setTimeout(() => {
      console.log('[Session] Automatic logout due to inactivity');
      logout();
    }, SESSION_TIMEOUT);
  }, [logout]);

  // Extend session (called when user acknowledges warning)
  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  // Force logout (called when user clicks logout in warning)
  const forceLogout = useCallback(() => {
    setShowWarning(false);
    logout();
  }, [logout]);

  // Activity detection
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all timeouts when not authenticated
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setShowWarning(false);
      return;
    }

    // Initialize session timeout
    updateActivity();

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Add event listeners for activity detection
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up interval to update countdown
    intervalRef.current = setInterval(() => {
      if (showWarning) {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        const remaining = SESSION_TIMEOUT - elapsed;
        setTimeLeft(Math.max(0, Math.floor(remaining / 1000)));
      }
    }, 1000);

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, updateActivity, showWarning]);

  return {
    showWarning,
    timeLeft,
    extendSession,
    forceLogout,
    updateActivity
  };
};