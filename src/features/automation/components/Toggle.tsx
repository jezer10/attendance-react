import { Switch } from "@headlessui/react";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Toggle = ({ checked, onChange, disabled, className = "" }: ToggleProps) => (
  <Switch
    checked={checked}
    onChange={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all duration-300 focus:outline-none ${
      disabled ? "cursor-not-allowed bg-zinc-200" : checked ? "bg-black" : "bg-zinc-300"
    } ${className}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out ${
        checked ? "translate-x-[24px]" : "translate-x-[4px]"
      }`}
    />
  </Switch>
);

export default Toggle;
