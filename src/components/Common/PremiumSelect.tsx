import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface PremiumSelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: string;
}

interface PremiumSelectProps {
  id?: string;
  label?: string;
  value: string | number;
  onChange: (value: any) => void;
  options: PremiumSelectOption[] | string[];
  placeholder?: string;
  icon?: string;
  searchable?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
  required?: boolean;
}

export const PremiumSelect: React.FC<PremiumSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Sélectionnez une option',
  icon,
  searchable = false,
  disabled = false,
  helperText,
  className = '',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to PremiumSelectOption
  const normalizedOptions: PremiumSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  });

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className} ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      {label && (
        <label
          htmlFor={id}
          className="font-display text-xs font-bold text-[#575147] mb-1.5 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            {icon && (
              <span className="material-symbols-outlined text-base text-[#0F5C4D]">
                {icon}
              </span>
            )}
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </span>
          {selectedOption && (
            <span className="text-[11px] font-normal text-[#0F5C4D]">
              Sélectionné
            </span>
          )}
        </label>
      )}

      {/* Main trigger button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[50px] px-4 py-3 bg-white rounded-2xl border transition-all flex items-center justify-between gap-3 text-left cursor-pointer ${
          isOpen
            ? 'border-[#0F5C4D] ring-2 ring-[#0F5C4D]/15 shadow-sm'
            : selectedOption
            ? 'border-[#0F5C4D]/40 hover:border-[#0F5C4D]'
            : 'border-[#E8E3D7] hover:border-[#8BAE9F]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedOption?.icon ? (
            <span className="material-symbols-outlined text-lg text-[#0F5C4D] shrink-0">
              {selectedOption.icon}
            </span>
          ) : icon && !label ? (
            <span className="material-symbols-outlined text-lg text-[#0F5C4D] shrink-0">
              {icon}
            </span>
          ) : null}

          <div className="truncate">
            {selectedOption ? (
              <div className="flex items-center gap-2">
                <span className="font-display text-xs sm:text-sm font-semibold text-[#211E1A] truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F2] border border-[#E8E3D7] text-[#735619]">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-body text-xs sm:text-sm text-[#7D766C]">
                {placeholder}
              </span>
            )}
            {selectedOption?.sublabel && (
              <span className="block text-[11px] text-[#575147] truncate">
                {selectedOption.sublabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`material-symbols-outlined text-lg text-[#7D766C] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#0F5C4D]' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {helperText && (
        <p className="text-[11px] text-[#7D766C] mt-1 ml-1">{helperText}</p>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-2xl border border-[#E8E3D7] shadow-xl overflow-hidden max-h-72 flex flex-col"
          >
            {/* Search Box if searchable or more than 6 options */}
            {(searchable || normalizedOptions.length > 7) && (
              <div className="p-2.5 border-b border-[#E8E3D7] bg-[#FAF8F2]">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#7D766C]">
                    search
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full h-8 pl-8 pr-3 bg-white border border-[#E8E3D7] rounded-xl text-xs text-[#211E1A] placeholder-[#7D766C] focus:outline-none focus:border-[#0F5C4D]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7D766C] hover:text-[#211E1A]"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto p-1.5 space-y-1 divide-y divide-[#FAF8F2] flex-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#7D766C]">
                  Aucun résultat pour « {searchQuery} »
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F5C4D]/10 text-[#0F5C4D] font-bold'
                          : 'hover:bg-[#FAF8F2] text-[#211E1A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {opt.icon && (
                          <span
                            className={`material-symbols-outlined text-base ${
                              isSelected ? 'text-[#0F5C4D]' : 'text-[#7D766C]'
                            }`}
                          >
                            {opt.icon}
                          </span>
                        )}
                        <div className="truncate">
                          <div className="text-xs sm:text-sm truncate">
                            {opt.label}
                          </div>
                          {opt.sublabel && (
                            <div className="text-[11px] text-[#7D766C] truncate">
                              {opt.sublabel}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {opt.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-[#E8E3D7] text-[#575147]">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <span className="material-symbols-outlined text-base text-[#0F5C4D]">
                            check_circle
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
