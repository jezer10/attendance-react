import { DAYS } from './constants'
import type { DayKey } from './types'

interface DaySelectorProps {
  selectedDays: DayKey[]
  onToggle: (day: DayKey) => void
  disabled?: boolean
}

const DaySelector = ({ selectedDays, onToggle, disabled }: DaySelectorProps) => (
  <div className="flex flex-wrap gap-2">
    {DAYS.map((day) => {
      const isChecked = selectedDays.includes(day)
      return (
        <label
          key={day}
          className={`flex cursor-pointer select-none items-center gap-2 rounded-full border px-3 py-1 text-sm ${
            disabled
              ? 'border-slate-200 bg-slate-100 text-slate-400'
              : isChecked
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={isChecked}
            disabled={disabled}
            onChange={() => onToggle(day)}
          />
          {day}
        </label>
      )
    })}
  </div>
)

export default DaySelector
