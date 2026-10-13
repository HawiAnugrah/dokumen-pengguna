// features/stories/components/CreateNewMenuPanel.tsx
import { ReactNode } from 'react';

export interface CreateNewMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface CreateNewMenuPanelProps {
  items: CreateNewMenuItem[];
}

export default function CreateNewMenuPanel({ items }: CreateNewMenuPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl py-2">
      {items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={item.onClick}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-left"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}