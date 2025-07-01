// Hook for virtualizing long lists on mobile
import { useState, useEffect, useRef, useMemo } from 'react';

const useVirtualization = ({
  items = [],
  itemHeight,
  containerHeight,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);

  // Calculate which items should be visible
  const visibleRange = useMemo(() => {
    if (!itemHeight || !containerHeight || items.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));

    return { startIndex, endIndex, visibleItems };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for the visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (scrollElementRef.current) {
        setScrollTop(scrollElementRef.current.scrollTop);
      }
    };

    const element = scrollElementRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return {
    scrollElementRef,
    visibleItems: visibleRange.visibleItems,
    totalHeight,
    offsetY
  };
};

export default useVirtualization;