import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { branchAPI } from '../lib/api';
import { Building2, ChevronDown } from 'lucide-react';

export function BranchSelector() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchAPI.getAll({ isActive: true }),
    staleTime: 10 * 60 * 1000,
  });

  // Load saved branch preference
  useEffect(() => {
    const saved = localStorage.getItem('selectedBranchId');
    if (saved) {
      setSelectedBranchId(saved);
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Clamp left so the 256px dropdown stays within the viewport
      const idealLeft = rect.left;
      const clampedLeft = Math.max(8, Math.min(idealLeft, window.innerWidth - 272));
      setDropdownPos({
        top: rect.bottom + 8,
        left: clampedLeft,
      });
    }
    setIsOpen(!isOpen);
  };

  // Save branch preference
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem('selectedBranchId', branchId);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: { branchId } }));
  };

  const branchList = branches?.data || [];
  const selectedBranch = branchList.find((b: any) => b.id === selectedBranchId);
  const displayName = selectedBranch ? selectedBranch.name : 'All Branches';

  if (branchList.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-700/50 border border-white/10 rounded-lg hover:bg-slate-700 hover:text-white transition-colors focus:outline-none max-w-[140px]"
      >
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{displayName}</span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
      </button>

      {isOpen && createPortal(
        <>
          {/* Overlay — closes dropdown on outside click */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown rendered at body level to escape nav stacking context */}
          <div
            className="fixed w-64 bg-white border border-gray-200 rounded-md shadow-xl"
            style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          >
            <div className="py-1">
              <button
                onClick={() => handleBranchChange('all')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  selectedBranchId === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                All Branches
              </button>
              {branchList.map((branch: any) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchChange(branch.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    selectedBranchId === branch.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{branch.name}</span>
                    <span className="text-xs text-gray-500">{branch.code}</span>
                  </div>
                  {branch.isHeadquarters && (
                    <span className="text-xs text-blue-600">Headquarters</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// Custom hook to get current selected branch
export function useSelectedBranch() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('selectedBranchId') || 'all';
  });

  useEffect(() => {
    const handleBranchChange = (event: any) => {
      setSelectedBranchId(event.detail.branchId);
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, []);

  return selectedBranchId === 'all' ? null : selectedBranchId;
}
