import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SelectOption {
  value: string
  label: string
}

interface SelectWrapperProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  name?: string
  className?: string
}

export default function SelectWrapper({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
  name,
  className
}: SelectWrapperProps) {
  const emptyOption = options.find(opt => opt.value === '');
  const effectivePlaceholder = placeholder || emptyOption?.label;
  const validOptions = options.filter(opt => opt.value !== '');

  if (label) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>{label}</Label>
        <Select value={value} onValueChange={onChange} disabled={disabled} name={name}>
          <SelectTrigger className={error ? "border-destructive" : ""}>
            <SelectValue placeholder={effectivePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {validOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} name={name}>
      <SelectTrigger className={cn(error ? "border-destructive" : "", className)}>
        <SelectValue placeholder={effectivePlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {validOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
