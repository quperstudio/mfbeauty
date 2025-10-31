import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO, isValid, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      {/* Input con la clase personalizada 'input-field' y manejo de estado de error/sugerencia */}
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
        // Se aplica la clase de componente 'input-field' y se ajustan los colores para estados
        className={cn(
          'input-field', // Clase personalizada que ya aplica la mayoría de los estilos
          !isValidInput && 'border-destructive focus:ring-destructive/50', // Color de borde para error
          suggestedDate && !selectedDate && 'border-primary/50 focus:ring-primary/80', // Borde sutil cuando hay sugerencia
        )}
      />
      {/* Indicador visual de error/sugerencia si es necesario */}
      {!isValidInput && (
        <p className="text-xs text-destructive mt-1 absolute -bottom-5 left-0">Formato de fecha no válido</p>
      )}
      {isDropdownOpen && (
        // Contenedor del calendario. Usa colores de tarjeta/popover.
        <div className={cn(
          "absolute top-full left-0 mt-2 w-full z-10 p-4",
          "bg-popover text-popover-foreground rounded-lg shadow-medium border border-border" // Aplicando colores base y sombra media
        )}>
          {/* Encabezado del calendario (Mes y Año) */}
          <div className="flex justify-between items-center mb-4 text-sm font-semibold text-foreground">
            {/* Texto del Mes y Año */}
            <div className="text-base">{`${MESES[viewDate.getMonth()]} ${viewDate.getFullYear()}`}</div>
            {/* Botones de navegación de mes */}
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                // Usando bg-accent para hover en elementos interactivos
                className={cn(
                  "p-1 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                // Usando bg-accent para hover en elementos interactivos
                className={cn(
                  "p-1 rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Días de la semana abreviados */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA_ABR.map((dia) => (
              <div
                key={dia}
                className={cn(
                  "text-xs font-medium aspect-square flex items-center justify-center",
                  "text-muted-foreground" // Usa texto de bajo contraste
                )}
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1 text-sm mt-2">
            {calendarDates.map((fecha, i) => {
              const hoy = new Date();
              const isHoy = isValid(fecha) && fecha.toDateString() === hoy.toDateString();
              const isSelected = selectedDate && isValid(fecha) && isValid(selectedDate) && fecha.toDateString() === selectedDate.toDateString();
              const isSuggestedDay = suggestedDate && isValid(fecha) && isValid(suggestedDate) && fecha.toDateString() === suggestedDate.toDateString();
              const isCurrentMonth = isValid(fecha) && fecha.getMonth() === viewDate.getMonth();
              const isClickable = isValid(fecha);

              return (
                <div
                  key={i}
                  className={cn(
                    'select-none aspect-square flex items-center justify-center rounded-lg transition-colors',
                    // Estilo base
                    'text-foreground',
                    
                    // Días no válidos o de meses anteriores/siguientes
                    (!isCurrentMonth || !isClickable) ? 'text-muted-foreground/60 cursor-not-allowed opacity-60' : 'cursor-pointer',
                    
                    // Hover/Resaltado (para días no seleccionados)
                    !isSelected && isClickable && isCurrentMonth && 'hover:bg-accent hover:text-accent-foreground',
                    
                    // DÍA DE HOY
                    isHoy && 'bg-accent text-accent-foreground font-semibold',
                    
                    // DÍA SELECCIONADO (Prioridad más alta)
                    isSelected && 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90',

                    // DÍA SUGERIDO (Si no está ya seleccionado)
                    isSuggestedDay && !isSelected && 'border-2 border-ring text-foreground font-semibold bg-accent/50',
                  )}
                  onClick={() => isClickable && handleSelectDate(fecha)}
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