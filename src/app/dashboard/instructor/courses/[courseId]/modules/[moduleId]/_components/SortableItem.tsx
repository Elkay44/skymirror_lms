'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentBlock } from '@/types/module';
import { BlockItem } from './BlockItem';

interface SortableItemProps {
  id: string;
  block: ContentBlock;
  onEdit: () => void;
  onDelete: () => void;
}

export const SortableItem = ({ id, block, onEdit, onDelete }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? 'relative' : 'static',
    zIndex: isDragging ? 10 : 'auto',
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style as React.CSSProperties}
      className={`${isDragging ? 'shadow-lg ring-2 ring-primary/20 rounded-md' : ''}`}
    >
      <BlockItem 
        block={block} 
        onEdit={onEdit} 
        onDelete={onDelete}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        isDragging={isDragging}
      />
    </div>
  );
};
