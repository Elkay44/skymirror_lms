import { useState } from 'react';

interface FilterButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function FilterButton({ active, label, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
        active ? 'bg-indigo-100 text-indigo-800 font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
