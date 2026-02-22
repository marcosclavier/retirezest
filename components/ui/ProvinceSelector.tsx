'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export interface ProvinceSelectorProps {
  value: string
  onChange: (province: string) => void
  showQuebecWarning?: boolean
  className?: string
}

const PROVINCES = [
  { code: 'AB', name: 'Alberta', qpp: false },
  { code: 'BC', name: 'British Columbia', qpp: false },
  { code: 'MB', name: 'Manitoba', qpp: false },
  { code: 'NB', name: 'New Brunswick', qpp: false },
  { code: 'NL', name: 'Newfoundland and Labrador', qpp: false },
  { code: 'NT', name: 'Northwest Territories', qpp: false },
  { code: 'NS', name: 'Nova Scotia', qpp: false },
  { code: 'NU', name: 'Nunavut', qpp: false },
  { code: 'ON', name: 'Ontario', qpp: false },
  { code: 'PE', name: 'Prince Edward Island', qpp: false },
  { code: 'QC', name: 'Quebec', qpp: true },
  { code: 'SK', name: 'Saskatchewan', qpp: false },
  { code: 'YT', name: 'Yukon', qpp: false },
]

export function ProvinceSelector({
  value,
  onChange,
  showQuebecWarning = true,
  className,
}: ProvinceSelectorProps) {
  const handleProvinceChange = (province: string) => {
    onChange(province)

    if (province === 'QC' && showQuebecWarning) {
      // Show Quebec-specific information
      toast.info(
        'Quebec selected: Your retirement planning will now use QPP instead of CPP, ' +
        'Quebec tax rates with 16.5% federal abatement, and Quebec-specific benefits.',
        { duration: 5000 }
      )
    }
  }

  const selectedProvince = PROVINCES.find(p => p.code === value)

  return (
    <div className={className}>
      <Select value={value} onValueChange={handleProvinceChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select province">
            {selectedProvince && (
              <div className="flex items-center gap-2">
                <span>{selectedProvince.name}</span>
                {selectedProvince.qpp && (
                  <Badge variant="secondary" className="text-xs">QPP</Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PROVINCES.map(province => (
            <SelectItem key={province.code} value={province.code}>
              <div className="flex items-center gap-2">
                <span>{province.name}</span>
                {province.qpp && (
                  <Badge variant="outline" className="text-xs">QPP</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === 'QC' && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
          <p className="font-medium mb-1">Quebec-Specific Features:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>QPP (Quebec Pension Plan) instead of CPP</li>
            <li>Quebec provincial tax rates</li>
            <li>16.5% federal tax abatement</li>
            <li>Solidarity tax credit available</li>
            <li>Additional senior benefits</li>
          </ul>
        </div>
      )}
    </div>
  )
}