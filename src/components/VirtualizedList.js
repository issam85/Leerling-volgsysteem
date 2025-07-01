// Virtualized list component for better performance with large datasets
import React from 'react';
import useVirtualization from '../hooks/useVirtualization';

const VirtualizedList = ({
  items = [],
  itemHeight = 60,
  height = 400,
  renderItem,
  className = '',
  overscan = 5
}) => {
  const {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY
  } = useVirtualization({
    items,
    itemHeight,
    containerHeight: height,
    overscan
  });

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item) => (
            <div
              key={item.id || item.index}
              style={{ height: itemHeight }}
              className="w-full"
            >
              {renderItem(item, item.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedList;