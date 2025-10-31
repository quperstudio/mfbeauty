import React, { useState, useEffect, useRef, useCallback } from 'react';
import Input from '../ui/Input';
import { cn } from '../../lib/utils';

interface SmartTimeInputProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

function getRoundedNow(): string {
  const now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();

  if (minutes % 30 === 0) {
    return format24h(hour, minutes);
  }

  const remainder = minutes % 30;
  minutes = minutes - remainder + 30;
  if (minutes === 60) {
    hour++;
    minutes = 0;
  }
  if (hour === 24) {
    hour = 0;
  }
  return format24h(hour, minutes);
}

function getHalfHourSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) { // 8 AM to 8 PM
    slots.push(format24h(hour, 0));
    slots.push(format24h(hour, 30));
  }
  return slots;
}

// Always use 24-hour format for consistency
function format24h(hour24: number, minute: number): string {
  const hh = hour24.toString().padStart(2, '0');
  const mm = minute.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

// Convert 24-hour to 12-hour for display only
function format12h(hour24: number, minute: number): string {
  const ampm = hour24 >= 12 ? 'pm' : 'am';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  const mm = minute.toString().padStart(2, '0');
  return `${hour12}:${mm} ${ampm}`;
}

function parseTime(str: string): string | null {
  let txt = str.toLowerCase().replace(/\s+/g, '');
  txt = txt.replace(/\./g, '');

  // Handle 24-hour format first (HH:mm)
  const twentyFourHourPattern = /^(\d{1,2}):(\d{2})$/;
  const twentyFourHourMatch = txt.match(twentyFourHourPattern);
  if (twentyFourHourMatch) {
    let hour = parseInt(twentyFourHourMatch[1], 10);
    let minute = parseInt(twentyFourHourMatch[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return format24h(hour, minute);
    }
  }

  // Handle 12-hour format
  const ampmPattern = /^(\d{1,2})(?::?(\d{0,2}))?(a|p)?m?$/;
  const match = txt.match(ampmPattern);

  if (!match) return null;

  let [, hh, mm, ampmIndicator] = match;
  if (!hh) return null;

  let hour = parseInt(hh, 10);
  let minute = mm ? parseInt(mm, 10) : 0;

  if (minute < 0 || minute > 59) return null;
  if (hour < 1 || hour > 12) return null;

  // Convert to 24-hour format
  if (ampmIndicator === 'p' && hour !== 12) {
    hour += 12;
  } else if (ampmIndicator === 'a' && hour === 12) {
    hour = 0;
  }

  return format24h(hour, minute);
}

export const SmartTimeInput: React.FC<SmartTimeInputProps> = ({
  value,
  onChange,
  placeholder = "Ej: 9am, 2:30pm, 14:00",
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedTime, setSelectedTime] = useState(value);
  const [suggestedTime, setSuggestedTime] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const timePickerContainerRef = useRef<HTMLDivElement>(null);

  const halfHourSlots = getHalfHourSlots();

  const confirmSelection = useCallback((valueToConfirm: string) => {
    console.log('SmartTimeInput - Confirming selection:', valueToConfirm);
    setSelectedTime(valueToConfirm);
    setInputValue(getDisplayValue(valueToConfirm));
    setSuggestedTime(null);
    onChange(valueToConfirm); // Always send 24-hour format
    setIsValid(true);
  }, [onChange]);

  // Display value conversion for better UX (show 12-hour format)
  const getDisplayValue = (time24h: string): string => {
    if (!time24h) return '';
    const [hourStr, minuteStr] = time24h.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    return format12h(hour, minute);
  };

  useEffect(() => {
    console.log('SmartTimeInput - Value prop changed:', value);
    if (value !== selectedTime) {
      // Value is already in 24-hour format from parent
      setInputValue(getDisplayValue(value));
      setSelectedTime(value);
      setIsValid(true);
    }
  }, [value, selectedTime]);

  useEffect(() => {
    if (isDropdownOpen && dropdownContentRef.current) {
      const timeToScrollTo = suggestedTime || selectedTime;
      if (timeToScrollTo) {
        const elements = dropdownContentRef.current.querySelectorAll('.dropdown-item-slot');
        let elementFound: HTMLElement | null = null;
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].textContent?.trim() === getDisplayValue(timeToScrollTo)) {
            elementFound = elements[i] as HTMLElement;
            break;
          }
        }

        if (elementFound) {
          elementFound.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [suggestedTime, selectedTime, isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        timePickerContainerRef.current &&
        !timePickerContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        if (inputValue.trim()) {
          const parsed = parseTime(inputValue);
          if (parsed) {
            confirmSelection(parsed);
          } else {
            if (selectedTime) {
                setInputValue(getDisplayValue(selectedTime));
                setIsValid(true);
            } else {
                setIsValid(false);
            }
          }
        } else {
            setIsValid(true);
            setInputValue('');
            onChange('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, confirmSelection, selectedTime, onChange]);

  const getSuggestion = useCallback((input: string): string | null => {
    const parsed = parseTime(input);
    return parsed;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsValid(true);
    setIsDropdownOpen(val.trim().length > 0);

    if (!val.trim()) {
      setSuggestedTime(null);
      return;
    }

    const suggestion = getSuggestion(val);
    setSuggestedTime(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestedTime) {
        confirmSelection(suggestedTime);
      } else {
        const parsed = parseTime(inputValue);
        if (parsed) {
          confirmSelection(parsed);
        } else {
          setIsValid(false);
        }
      }
      setIsDropdownOpen(false);
    }
    if (e.key === 'Tab' && suggestedTime && !e.shiftKey) {
        e.preventDefault();
        confirmSelection(suggestedTime);
        setIsDropdownOpen(false);
    }
  };

  const handleSelectOption = (option: string) => {
    confirmSelection(option);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
    if (!inputValue.trim()) {
        setSuggestedTime(null);
    } else {
        setSuggestedTime(getSuggestion(inputValue));
    }
  };

  return (
    <div className={cn('relative w-full', className)} ref={timePickerContainerRef}>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={`${!isValid ? 'border-destructive' : ''}`}
      />

      {isDropdownOpen && (
        <div
          ref={dropdownContentRef}
          className={cn(
            "absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground",
            "p-1 rounded-md shadow-md border max-h-60 overflow-y-auto z-50"
          )}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        >
          {halfHourSlots.map((slot) => {
            const isSelected = slot === selectedTime;
            const isSuggested = slot === suggestedTime;
            const displaySlot = getDisplayValue(slot);

            return (
              <div
                key={slot}
                className={cn(
                  'dropdown-item-slot cursor-pointer px-2 py-1 rounded-sm text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-primary text-primary-foreground',
                  isSuggested && 'border border-primary'
                )}
                onClick={() => {
                  handleSelectOption(slot);
                }}
              >
                {displaySlot}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
