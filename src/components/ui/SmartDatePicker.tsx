import React, { useState, useEffect, useRef, useCallback } from 'react';
// import Input from '../ui/Input'; // Eliminado: No se puede resolver en este entorno
import { format, parseISO, isValid, parse } from 'date-fns';
import { es } from 'date-fns/locale';
// import { cn } from '../../lib/utils'; // Eliminado: No se puede resolver en este entorno
import { ChevronLeft, ChevronRight } from 'lucide-react';

function cn(...inputs: (string | boolean | null | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}

interface SmartDatePickerProps {
  value: Date | string | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export const SmartDatePicker: React.FC<SmartDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Ej: Miércoles 03 de Junio, 03/06, 03 de Junio",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isValidInput, setIsValidInput] = useState(true);
  const [suggestedDate, setSuggestedDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const DIAS_SEMANA_ABR = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const DIAS_SEMANA_COMPLETOS = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado'
  ];

  const formatearFechaParaInput = useCallback((fecha: Date | null) => {
    if (!fecha || !isValid(fecha)) return '';
    const esAnioActual = fecha.getFullYear() === new Date().getFullYear();
    return `${DIAS_SEMANA_COMPLETOS[fecha.getDay()]}, ${fecha.getDate()} de ${
      MESES[fecha.getMonth()]
    }${esAnioActual ? '' : ' de ' + fecha.getFullYear()}`;
  }, []);

  const parseDateValue = useCallback((val: Date | string | null): Date | null => {
    if (!val) return null;
    
    if (val instanceof Date) {
      return isValid(val) ? val : null;
    }
    
    if (typeof val === 'string') {
      if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = val.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return isValid(date) ? date : null;
      }
      
      const isoDate = parseISO(val);
      return isValid(isoDate) ? isoDate : null;
    }
    
    return null;
  }, []);

  // Esta función no se estaba usando, pero la dejo por si la necesitas.
  const formatDateForOutput = useCallback((date: Date | null): string => {
    if (!date || !isValid(date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    const dateObj = parseDateValue(value);
    
    if (dateObj && isValid(dateObj)) {
      if (!selectedDate || dateObj.toDateString() !== selectedDate.toDateString()) {
        setSelectedDate(dateObj);
        setInputValue(formatearFechaParaInput(dateObj));
        setViewDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
        setSuggestedDate(dateObj);
      }
    } else if (value === null || value === '' || value === undefined) {
      setSelectedDate(null);
      setInputValue('');
      setViewDate(new Date());
      setSuggestedDate(null);
    }
  }, [value, selectedDate, formatearFechaParaInput, parseDateValue]);

  useEffect(() => {
    setCalendarDates(obtenerFechasMes(viewDate));
  }, [viewDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);

        if (inputValue.trim() && !suggestedDate) {
          setIsValidInput(false);
          onChange(null);
          setSelectedDate(null);
        } else if (suggestedDate && isValid(suggestedDate)) {
          if (!selectedDate || suggestedDate.toDateString() !== selectedDate.toDateString()) {
            setSelectedDate(suggestedDate);
            setInputValue(formatearFechaParaInput(suggestedDate));
            onChange(suggestedDate);
            setIsValidInput(true);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [suggestedDate, selectedDate, inputValue, onChange, formatearFechaParaInput]);

  const parsearFechaTextoAvanzado = (texto: string): Date | null => {
    const pattern = new RegExp(
      `^(?:([A-Za-zÁ-Úá-úñ]+)[,]?\\s+)?` +
      `(\\d{1,2})` +
      `(?:\\s*(?:de)?\\s*)` +
      `([A-Za-zÁ-Úá-úñ]+)` +
      `(?:\\s*(?:de|del)?\\s*(\\d{2}|\\d{4}))?$`,
      'i'
    );

    const match = texto.match(pattern);
    if (!match) return null;

    const day = parseInt(match[2], 10);
    const rawMonth = match[3].toLowerCase();
    const foundMonthIndex = MESES.findIndex(
      (m) => m.toLowerCase() === rawMonth
    );
    if (foundMonthIndex === -1) return null;

    let yearStr = match[4];
    if (!yearStr) {
      yearStr = String(new Date().getFullYear());
    } else if (yearStr.length === 2) {
      const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
      yearStr = String(currentCentury + parseInt(yearStr, 10));
    }
    const parsedYear = parseInt(yearStr, 10);

    const parsedDate = new Date(parsedYear, foundMonthIndex, day);
    return isValid(parsedDate) ? parsedDate : null;
  };

  const detectarFechaEnInput = (valor: string): Date | null => {
    const cleanValue = valor.trim().toLowerCase();

    const fechaTexto = parsearFechaTextoAvanzado(cleanValue);
    if (fechaTexto) return fechaTexto;

    const cleanedNumeric = cleanValue.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (cleanedNumeric.length === 8) {
      const day = parseInt(cleanedNumeric.slice(0, 2), 10);
      const month = parseInt(cleanedNumeric.slice(2, 4), 10) - 1;
      const year = parseInt(cleanedNumeric.slice(4, 8), 10);
      const parsedDate = new Date(year, month, day);
      return isValid(parsedDate) ? parsedDate : null;
    } else if (cleanedNumeric.length === 4) {
      const day = parseInt(cleanedNumeric.slice(0, 2), 10);
      const month = parseInt(cleanedNumeric.slice(2, 4), 10) - 1;
      const year = new Date().getFullYear();
      const parsedDate = new Date(year, month, day);
      return isValid(parsedDate) ? parsedDate : null;
    }

    const partsSlash = cleanValue.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (partsSlash) {
        const day = parseInt(partsSlash[1], 10);
        const month = parseInt(partsSlash[2], 10) - 1;
        let year = partsSlash[3] ? parseInt(partsSlash[3], 10) : new Date().getFullYear();
        if (year < 100) year += 2000;
        const parsedDate = new Date(year, month, day);
        return isValid(parsedDate) ? parsedDate : null;
    }

    const partsIso = cleanValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (partsIso) {
        const year = parseInt(partsIso[1], 10);
        const month = parseInt(partsIso[2], 10) - 1;
        const day = parseInt(partsIso[3], 10);
        const parsedDate = new Date(year, month, day);
        return isValid(parsedDate) ? parsedDate : null;
    }

    return null;
  };

  const obtenerProximoDia = (nombreDia: string): Date | null => {
    const cleanedDayName = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1).toLowerCase();
    const indexInFullNames = DIAS_SEMANA_COMPLETOS.findIndex(d => d.startsWith(cleanedDayName));

    if (indexInFullNames === -1) return null;

    const hoy = new Date();
    let diasParaAgregar = (indexInFullNames - hoy.getDay() + 7) % 7;
    if (diasParaAgregar === 0) diasParaAgregar = 7;

    const proximaFecha = new Date(hoy);
    proximaFecha.setDate(hoy.getDate() + diasParaAgregar);
    return proximaFecha;
  };

  const obtenerFechasMes = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const fechas: Date[] = [];

    const diasAntes = primerDia.getDay();
    for (let i = diasAntes; i > 0; i--) {
      fechas.push(new Date(año, mes, 1 - i));
    }

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      fechas.push(new Date(año, mes, d));
    }

    const diasRestantes = 7 - (fechas.length % 7);
    if (diasRestantes < 7) {
      for (let i = 1; i <= diasRestantes; i++) {
        fechas.push(new Date(año, mes + 1, i));
      }
    }

    return fechas;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValidInput(true);
    setIsDropdownOpen(true);

    if (newValue.trim() === '') {
      setSelectedDate(null);
      setSuggestedDate(null);
      onChange(null);
      setViewDate(new Date());
      return;
    }

    let detectedDate: Date | null = null;
    const upperCaseValue = newValue.toUpperCase();
    if (DIAS_SEMANA_ABR.includes(upperCaseValue) || DIAS_SEMANA_COMPLETOS.some(d => d.toUpperCase().startsWith(upperCaseValue))) {
        detectedDate = obtenerProximoDia(newValue);
    } else {
        detectedDate = detectarFechaEnInput(newValue);
    }

    if (detectedDate) {
      setSuggestedDate(detectedDate);
      setViewDate(new Date(detectedDate.getFullYear(), detectedDate.getMonth(), 1));
    } else {
      setSuggestedDate(null);
    }
  };

  const handleBlur = () => {
    if (!isDropdownOpen) {
      if (suggestedDate && isValid(suggestedDate)) {
        if (!selectedDate || suggestedDate.toDateString() !== selectedDate.toDateString()) {
          setSelectedDate(suggestedDate);
          setInputValue(formatearFechaParaInput(suggestedDate));
          onChange(suggestedDate);
          setIsValidInput(true);
        }
      } else if (inputValue.trim() !== '') {
        setIsValidInput(false);
        onChange(null);
        setSelectedDate(null);
      } else {
        setIsValidInput(true);
        onChange(null);
        setSelectedDate(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (suggestedDate && isValid(suggestedDate)) {
        setSelectedDate(suggestedDate);
        setInputValue(formatearFechaParaInput(suggestedDate));
        onChange(suggestedDate);
        setIsValidInput(true);
        setIsDropdownOpen(false);
        inputRef.current?.blur();
      } else {
        setIsValidInput(false);
        onChange(null);
        setSelectedDate(null);
        setIsDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectDate = (fecha: Date) => {
    if (!isValid(fecha)) return;
    setSelectedDate(fecha);
    setInputValue(formatearFechaParaInput(fecha));
    onChange(fecha);
    setIsValidInput(true);
    setSuggestedDate(fecha);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <div className={cn("relative", className)} ref={datePickerRef}>
      {/* Reemplazado <Input> por <input> y se aplicaron los estilos de .input-field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={() => {
          setIsDropdownOpen(true);
          inputRef.current?.select();
        }}
        onFocus={(e) => e.target.select()}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200',
          !isValidInput ? 'border-error-500' : '',
          suggestedDate && !selectedDate && 'border-primary-500/50'
        )}
      />
      {isDropdownOpen && (
        <div className={cn(
          "absolute top-full left-0 mt-2 w-full z-10 p-2",
          "bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-200 dark:border-gray-700"
        )}>
          <div className="flex justify-between items-center mb-2 text-sm pl-2 font-semibold">
            <div>{`${MESES[viewDate.getMonth()]} ${viewDate.getFullYear()}`}</div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={cn(
                  "p-1 rounded-sm transition-colors",
                  "hover:bg-primary-100 dark:hover:bg-gray-700"
                )}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className={cn(
                  "p-1 rounded-sm transition-colors",
                  "hover:bg-primary-100 dark:hover:bg-gray-700"
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA_ABR.map((dia) => (
              <div
                key={dia}
                className={cn(
                  "text-xs font-medium aspect-square flex items-center justify-center",
                  "text-gray-400 dark:text-gray-500"
                )}
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs mt-1">
            {calendarDates.map((fecha, i) => {
              const hoy = new Date();
              const isHoy = isValid(fecha) && fecha.toDateString() === hoy.toDateString();
              const isSelected = selectedDate && isValid(fecha) && isValid(selectedDate) && fecha.toDateString() === selectedDate.toDateString();
              const isSuggestedDay = suggestedDate && isValid(fecha) && isValid(suggestedDate) && fecha.toDateString() === suggestedDate.toDateString();
              const isCurrentMonth = isValid(fecha) && fecha.getMonth() === viewDate.getMonth();

              return (
                <div
                  key={i}
                  className={cn(
                    'select-none aspect-square flex items-center justify-center rounded-md cursor-pointer transition-colors',
                    !isValid(fecha) && 'opacity-50 cursor-not-allowed',
                    !isSelected && 'hover:bg-primary-100 dark:hover:bg-gray-700',
                    isHoy && 'bg-primary-100 text-primary-700 font-semibold',
                    isSelected && 'bg-primary-600 text-white',
                    isSuggestedDay && !isSelected && 'border border-primary-500 text-primary-700 font-semibold',
                    !isCurrentMonth && 'text-gray-400 dark:text-gray-500 opacity-60'
                  )}
                  onClick={() => isValid(fecha) && handleSelectDate(fecha)}
                >
                  {isValid(fecha) ? fecha.getDate() : ''}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

