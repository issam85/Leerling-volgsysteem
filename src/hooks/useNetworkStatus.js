// Hook for monitoring network status
import { useState, useEffect } from 'react';

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
          setConnectionType(connection.effectiveType || 'unknown');
          
          // Consider 2G and slow-3G as slow connections
          const slowConnections = ['2g', 'slow-2g'];
          setIsSlowConnection(slowConnections.includes(connection.effectiveType));
        }
      }
    };

    // Initial check
    updateOnlineStatus();
    updateConnectionInfo();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Connection change listener (if supported)
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', updateConnectionInfo);
        
        return () => {
          window.removeEventListener('online', updateOnlineStatus);
          window.removeEventListener('offline', updateOnlineStatus);
          connection.removeEventListener('change', updateConnectionInfo);
        };
      }
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlowConnection,
    networkQuality: isSlowConnection ? 'slow' : isOnline ? 'good' : 'offline'
  };
};

export default useNetworkStatus;