import DaySelector from './DaySelector'
import Toggle from './Toggle'
import type { AutomationBlock, DayKey } from './types'

interface ScheduleBlockProps {
  title: string
  description: string
  block: AutomationBlock
  timeInputId: string
  timeLabel: string
  onToggleEnabled: (value: boolean) => void
  onTimeChange: (value: string) => void
  onToggleDay: (day: DayKey) => void
  validationErrors: string[]
  showValidation: boolean
}

const ScheduleBlock = ({
  title,
  description,
  block,
  timeInputId,
  timeLabel,
  onToggleEnabled,
  onTimeChange,
  onToggleDay,
  validationErrors,
  showValidation,
}: ScheduleBlockProps) => (
  <div className="space-y-4 rounded-xl border border-slate-200 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <Toggle
        checked={block.habilitado}
        onChange={onToggleEnabled}
        label={block.habilitado ? 'Sí' : 'No'}
      />
    </div>
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor={timeInputId}
          className="text-sm font-medium text-slate-700"
        >
          {timeLabel}
        </label>
        <input
          id={timeInputId}
          type="time"
          value={block.hora_local}
          onChange={(event) => onTimeChange(event.target.value)}
          disabled={!block.habilitado}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm disabled:bg-slate-100"
        />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Días de la semana
        </span>
        <DaySelector
          selectedDays={block.dias}
          onToggle={onToggleDay}
          disabled={!block.habilitado}
        />
      </div>
      {showValidation && validationErrors.length > 0 && (
        <ul className="space-y-1 text-sm text-rose-600">
          {validationErrors.map((error) => (
            <li key={error}>• {error}</li>
          ))}
        </ul>
      )}
    </div>
  </div>
)

export default ScheduleBlock
