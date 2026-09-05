import React, { useState, useEffect } from 'react';
import { PremiumSelect } from './PremiumSelect';

interface PremiumDatePickerProps {
  value: string; // ISO date format 'YYYY-MM-DD'
  onChange: (dateStr: string, age: number) => void;
  minAge?: number;
  label?: string;
  helperText?: string;
}

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

export const PremiumDatePicker: React.FC<PremiumDatePickerProps> = ({
  value,
  onChange,
  minAge = 18,
  label = 'Date de naissance',
  helperText,
}) => {
  // Parse initial values
  const [year, setYear] = useState<number>(() => {
    if (value && value.includes('-')) {
      const y = parseInt(value.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return 1998;
  });

  const [month, setMonth] = useState<number>(() => {
    if (value && value.includes('-')) {
      const m = parseInt(value.split('-')[1], 10);
      if (!isNaN(m)) return m;
    }
    return 5;
  });

  const [day, setDay] = useState<number>(() => {
    if (value && value.includes('-')) {
      const d = parseInt(value.split('-')[2], 10);
      if (!isNaN(d)) return d;
    }
    return 15;
  });

  // Calculate days in selected month and year
  const daysInMonth = new Date(year, month, 0).getDate();

  // Adjust day if month changed and day > daysInMonth
  useEffect(() => {
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [month, year, daysInMonth, day]);

  // Current year
  const currentYear = new Date().getFullYear();

  // Generate Year options: from (currentYear - 80) up to (currentYear - 16)
  const yearOptions = Array.from({ length: 65 }, (_, i) => {
    const y = currentYear - 16 - i;
    return {
      value: y,
      label: `${y}`,
      badge: y <= currentYear - 18 ? undefined : 'Mineur',
    };
  });

  // Generate Month options
  const monthOptions = MONTHS.map((m) => ({
    value: m.value,
    label: `${m.label}`,
    badge: `Mois ${m.value.toString().padStart(2, '0')}`,
  }));

  // Generate Day options
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return {
      value: d,
      label: `${d.toString().padStart(2, '0')}`,
    };
  });

  // Calculate age
  const calculateAge = (y: number, m: number, d: number) => {
    const today = new Date();
    let computed = today.getFullYear() - y;
    const mDiff = today.getMonth() + 1 - m;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) {
      computed--;
    }
    return computed;
  };

  const currentAge = calculateAge(year, month, day);
  const isValidAge = currentAge >= minAge;

  // Propagate changes when year, month, or day change
  const handleDateChange = (newYear: number, newMonth: number, newDay: number) => {
    const safeDay = Math.min(newDay, new Date(newYear, newMonth, 0).getDate());
    const dateString = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    const age = calculateAge(newYear, newMonth, safeDay);
    onChange(dateString, age);
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center justify-between">
          <label className="font-display text-xs sm:text-sm font-bold text-[#211E1A] flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#0F5C4D]">
              cake
            </span>
            <span>{label}</span>
          </label>
          <span className="text-[11px] font-semibold text-[#0F5C4D] bg-[#0F5C4D]/10 px-2.5 py-1 rounded-full">
            Âge requis : 18 ans et +
          </span>
        </div>
      )}

      {/* 3 Coordinated Selectors */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Jour */}
        <div>
          <span className="block text-[11px] font-bold text-[#575147] mb-1">
            Jour
          </span>
          <PremiumSelect
            value={day}
            onChange={(val) => {
              const d = parseInt(val, 10);
              setDay(d);
              handleDateChange(year, month, d);
            }}
            options={dayOptions}
            searchable={false}
            placeholder="Jour"
          />
        </div>

        {/* Mois */}
        <div>
          <span className="block text-[11px] font-bold text-[#575147] mb-1">
            Mois
          </span>
          <PremiumSelect
            value={month}
            onChange={(val) => {
              const m = parseInt(val, 10);
              setMonth(m);
              handleDateChange(year, m, day);
            }}
            options={monthOptions}
            searchable={false}
            placeholder="Mois"
          />
        </div>

        {/* Année */}
        <div>
          <span className="block text-[11px] font-bold text-[#575147] mb-1">
            Année
          </span>
          <PremiumSelect
            value={year}
            onChange={(val) => {
              const y = parseInt(val, 10);
              setYear(y);
              handleDateChange(y, month, day);
            }}
            options={yearOptions}
            searchable={true}
            placeholder="Année"
          />
        </div>
      </div>

      {/* Computed Age & Status Card */}
      <div
        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
          isValidAge
            ? 'bg-[#FAF8F2] border-[#8BAE9F]/40'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif-display font-bold text-base shrink-0 ${
              isValidAge
                ? 'bg-[#0F5C4D] text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {currentAge}
          </div>
          <div>
            <div className="font-display text-xs sm:text-sm font-bold text-[#211E1A] flex items-center gap-2">
              <span>{currentAge} ans révolus</span>
              {isValidAge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F5C4D]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Majeur(e)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#575147]">
              {isValidAge
                ? "Conforme aux règles de maturité et d'engagement de la plateforme."
                : `Vous devez avoir au minimum ${minAge} ans pour utiliser NASSIB.`}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-[11px] text-[#7D766C]">Date complète</div>
          <div className="font-mono text-xs font-semibold text-[#211E1A]">
            {day.toString().padStart(2, '0')}/
            {month.toString().padStart(2, '0')}/{year}
          </div>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-[#7D766C]">{helperText}</p>
      )}
    </div>
  );
};
