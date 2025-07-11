'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ModuleCard } from './ModuleCard';
import { Module } from '@/types/module';

interface SortableModuleCardProps {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (moduleId: string) => void;
}

export function SortableModuleCard({ module, onEdit, onDelete }: SortableModuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50 z-50' : ''}
    >
      <ModuleCard
        module={module}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      />
    </div>
  );
}
