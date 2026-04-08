import { Switch } from '@headlessui/react'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}

const Toggle = ({ checked, onChange, label, disabled }: ToggleProps) => (
  <Switch.Group as="div" className="flex items-center gap-3">
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 ${
        disabled
          ? 'cursor-not-allowed bg-slate-200'
          : checked
            ? 'bg-emerald-500'
            : 'bg-slate-300'
      }`}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </Switch>
    <Switch.Label
      className={`text-sm font-medium ${
        disabled ? 'text-slate-400' : 'text-slate-700'
      }`}
    >
      {label}
    </Switch.Label>
  </Switch.Group>
)

export default Toggle
