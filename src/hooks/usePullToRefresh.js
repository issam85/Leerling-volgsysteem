// Hook for pull-to-refresh functionality
import { useState, useEffect, useRef } from 'react';

const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollableRef = useRef(null);

  const handleTouchStart = (e) => {
    // Only start pull if at top of scroll
    const element = scrollableRef.current;
    if (element && element.scrollTop > 0) return;
    
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const element = scrollableRef.current;
    if (!element || element.scrollTop > 0 || !touchStartY.current) return;

    const currentY = e.touches[0].clientY;
    const pullDistance = Math.max(0, currentY - touchStartY.current);

    if (pullDistance > 10) {
      setIsPulling(true);
      setPullDistance(Math.min(pullDistance, threshold * 1.5));
      
      // Prevent default scrolling when pulling
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    // Reset values
    setIsPulling(false);
    setPullDistance(0);
    touchStartY.current = 0;
  };

  useEffect(() => {
    const element = scrollableRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isPulling, isRefreshing, threshold]);

  const refreshIndicatorStyle = {
    transform: `translateY(${pullDistance}px)`,
    opacity: pullDistance / threshold,
    transition: isPulling ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
  };

  return {
    scrollableRef,
    isRefreshing,
    isPulling,
    pullDistance,
    refreshIndicatorStyle,
    canRefresh: pullDistance >= threshold
  };
};

export default usePullToRefresh;