// features/stories/components/CreateNewDropdown.tsx
'use client';

import { useEffect, useRef, useState, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import CreateNewMenuPanel, { CreateNewMenuItem } from './createNewMenuPanel';

interface CreateNewDropdownProps {
  items: CreateNewMenuItem[];
  panelWidth?: number; // px, default 260
  renderTrigger: (props: {
    onClick: () => void;
    isOpen: boolean;
    triggerRef: RefObject<HTMLButtonElement | null>;
  }) => ReactNode;
}

/**
 * Dropdown "Create New" yang reusable (dipakai StoriesSidebar &
 * EmptyDetailPanel) -- isinya pilihan bikin item baru: New User story,
 * New Non-functional requirement, New Epic, dst.
 *
 * Ini SENGAJA dipisah dari ProjectMenuDropdown: ProjectMenuDropdown itu
 * khusus buat ganti/hapus/buat Project (dipakai di header atas halaman
 * Stories), sedangkan dropdown ini khusus buat aksi "Create New" sesuai
 * desain (tombol biru "Create New" + panah bawah -> muncul 3 pilihan).
 *
 * Positioning-nya sama seperti ProjectMenuDropdown: dirender lewat React
 * Portal ke document.body dengan `position: fixed` biar tidak kepotong
 * ancestor yang overflow-hidden, dan otomatis membuka ke atas/geser kalau
 * bakal kepotong viewport.
 */
export default function CreateNewDropdown({
  items,
  panelWidth = 260,
  renderTrigger,
}: CreateNewDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportPadding = 12;
      const estimatedPanelHeight = items.length * 44 + 16;

      let left = rect.left;
      if (left + panelWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - panelWidth - viewportPadding;
      }
      left = Math.max(viewportPadding, left);

      let top = rect.bottom + 6;
      if (top + estimatedPanelHeight > window.innerHeight - viewportPadding) {
        // Bakal kepotong di bawah layar -> buka ke atas tombol sebagai ganti.
        top = Math.max(viewportPadding, rect.top - estimatedPanelHeight - 6);
      }

      setPanelPos({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, panelWidth, items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Bungkus onClick tiap item supaya panel otomatis nutup begitu salah satu
  // pilihan diklik.
  const wrappedItems: CreateNewMenuItem[] = items.map((item) => ({
    ...item,
    onClick: () => {
      close();
      item.onClick();
    },
  }));

  return (
    <>
      {renderTrigger({ onClick: toggle, isOpen, triggerRef })}

      {mounted && isOpen && panelPos && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            width: panelWidth,
            zIndex: 9999,
          }}
        >
          <CreateNewMenuPanel items={wrappedItems} />
        </div>,
        document.body
      )}
    </>
  );
}