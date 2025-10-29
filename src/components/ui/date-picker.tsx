import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils'

interface DatePickerProps {
    label?: string;
    value: string | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function DatePicker({ label, value, onChange, placeholder = "Selecciona una fecha", disabled = false }: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    
    const selectedDate = value ? parseISO(value) : undefined;
    
    const handleSelect = (date: Date | undefined) => {
        onChange(date || null)
        setOpen(false)
    }

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <Label className="block text-sm font-medium text-muted-foreground">
                    {label}
                </Label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal overflow-hidden",
                            !value && "text-muted-foreground",
                        )}
                        disabled={disabled}
                    >
                        <span className="truncate">
                            {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
                        </span>
                        <ChevronDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        captionLayout="dropdown"
                        onSelect={handleSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}