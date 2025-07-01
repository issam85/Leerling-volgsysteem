// Pull-to-refresh component
import React from 'react';
import { RotateCcw, ArrowDown } from 'lucide-react';
import usePullToRefresh from '../hooks/usePullToRefresh';

const PullToRefresh = ({ onRefresh, children, className = '' }) => {
  const {
    scrollableRef,
    isRefreshing,
    isPulling,
    pullDistance,
    refreshIndicatorStyle,
    canRefresh
  } = usePullToRefresh(onRefresh);

  return (
    <div className={`relative ${className}`} ref={scrollableRef}>
      {/* Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-gradient-to-b from-blue-50 to-transparent z-10"
          style={refreshIndicatorStyle}
        >
          <div className="flex items-center space-x-2 text-blue-600">
            {isRefreshing ? (
              <>
                <RotateCcw 
                  size={20} 
                  className="animate-spin" 
                />
                <span className="text-sm font-medium">Vernieuwen...</span>
              </>
            ) : (
              <>
                <ArrowDown 
                  size={20} 
                  className={`transform transition-transform duration-200 ${
                    canRefresh ? 'rotate-180 text-green-600' : ''
                  }`}
                />
                <span className="text-sm font-medium">
                  {canRefresh ? 'Loslaten om te vernieuwen' : 'Trek omlaag om te vernieuwen'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className={isPulling ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;