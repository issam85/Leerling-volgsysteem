// Hook for swipe gesture detection
import { useState, useEffect, useRef } from 'react';

const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const elementRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = Math.abs(currentX - touchStartX.current);
    
    if (diff > 10) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    
    if (!touchStartX.current || !touchEndX.current) return;
    
    const swipeDistance = touchStartX.current - touchEndX.current;
    const isSwipeLeft = swipeDistance > threshold;
    const isSwipeRight = swipeDistance < -threshold;

    if (isSwipeLeft && onSwipeLeft) {
      onSwipeLeft();
    } else if (isSwipeRight && onSwipeRight) {
      onSwipeRight();
    }

    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
    setIsSwiping(false);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add passive listeners for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    elementRef,
    isSwiping
  };
};

export default useSwipeGesture;