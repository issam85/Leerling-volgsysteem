// Network status indicator component
import React from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import useNetworkStatus from '../hooks/useNetworkStatus';

const NetworkStatus = () => {
  const { isOnline, connectionType, isSlowConnection, networkQuality } = useNetworkStatus();

  // Don't show indicator if connection is good
  if (isOnline && !isSlowConnection) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSlowConnection) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSlowConnection) return `Langzame verbinding (${connectionType})`;
    return 'Online';
  };

  const getIcon = () => {
    if (!isOnline) return <WifiOff size={16} />;
    if (isSlowConnection) return <Signal size={16} />;
    return <Wifi size={16} />;
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getStatusColor()} text-white text-center py-2 px-4 text-sm font-medium transition-all duration-300`}>
      <div className="flex items-center justify-center space-x-2">
        {getIcon()}
        <span>{getStatusText()}</span>
        {!isOnline && (
          <span className="text-xs opacity-90 ml-2">
            • Sommige functies zijn beperkt beschikbaar
          </span>
        )}
        {isSlowConnection && (
          <span className="text-xs opacity-90 ml-2">
            • Gebruik wordt geoptimaliseerd voor uw verbinding
          </span>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;