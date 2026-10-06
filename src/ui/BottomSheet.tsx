import React, { useRef, useState } from 'react';

export type SnapPoint = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  snap: SnapPoint;
  onSnapChange: (snap: SnapPoint) => void;
  headerContent: React.ReactNode;
  children: React.ReactNode;
}

import { ChevronDownIcon, ChevronUpIcon } from './icons';

export const BottomSheet: React.FC<BottomSheetProps> = ({
  snap,
  onSnapChange,
  headerContent,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentY = useRef(0);

  const getSnapHeightClass = (s: SnapPoint) => {
    switch (s) {
      case 'peek':
        return 'h-[46px]';
      case 'half':
        return 'h-[50vh] landscape:h-[65vh]';
      case 'full':
        return 'h-[85vh] landscape:h-[90vh]';
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    currentY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    currentY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_e) {
      // Ignore
    }

    const diff = currentY.current - dragStartY.current;

    // If dragged upwards by more than 30px
    if (diff < -30) {
      if (snap === 'peek') onSnapChange('half');
      else if (snap === 'half') onSnapChange('full');
    }
    // If dragged downwards by more than 30px
    else if (diff > 30) {
      if (snap === 'full') onSnapChange('half');
      else if (snap === 'half') onSnapChange('peek');
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-ground border-t border-rule shadow-2xl flex flex-col transition-all duration-300 ease-out landscape:hidden lg:hidden ${getSnapHeightClass(
        snap
      )}`}
    >
      {/* Drag Handle Bar & Header */}
      <div
        className="w-full flex items-center justify-between px-3 pt-1.5 pb-1 select-none shrink-0 cursor-pointer"
        onClick={() => {
          if (snap === 'peek') onSnapChange('half');
          else onSnapChange('peek');
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing py-0.5"
        >
          <div className="w-9 h-1 bg-rule rounded-full hover:bg-ink-soft transition-colors" />
        </div>
      </div>

      {/* Persistent Header Bar with Content and Collapse/Expand Chevron */}
      <div
        onClick={() => {
          if (snap === 'peek') onSnapChange('half');
          else onSnapChange('peek');
        }}
        className="px-4 pb-2 shrink-0 cursor-pointer flex items-center justify-between gap-2"
      >
        <div className="flex-1 min-w-0">{headerContent}</div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSnapChange(snap === 'peek' ? 'half' : 'peek');
          }}
          className="p-1 text-ink-soft hover:text-ink shrink-0 rounded"
          title={snap === 'peek' ? 'Expand courses' : 'Minimize to peek'}
          aria-label={snap === 'peek' ? 'Expand courses' : 'Minimize to peek'}
        >
          {snap === 'peek' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        </button>
      </div>

      {/* Scrollable Sheet Content (only rendered when expanded) */}
      {snap !== 'peek' && (
        <div className="flex-1 overflow-y-auto px-4 pb-8">{children}</div>
      )}
    </div>
  );
};
