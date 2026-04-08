import { memo, useMemo } from "react";
import { AsYouType, getExampleNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";

interface PhoneCountry {
  id: CountryCode;
  label: string;
  dialCode: string;
}

interface PhoneNumberSectionProps {
  phoneCountries: PhoneCountry[];
  selectedCountry: CountryCode;
  phoneNumber: string;
  onCountryChange: (country: CountryCode) => void;
  onNumberChange: (number: string) => void;
  showValidation: boolean;
  error?: string;
}

const MAX_NATIONAL_LENGTH = 15;
const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

const PhoneNumberSection = ({
  phoneCountries,
  selectedCountry,
  phoneNumber,
  onCountryChange,
  onNumberChange,
  showValidation,
  error,
}: PhoneNumberSectionProps) => {
  const currentCountry = useMemo(
    () => phoneCountries.find((c) => c.id === selectedCountry) || phoneCountries[0],
    [phoneCountries, selectedCountry]
  );

  const formattedPhoneNumber = useMemo(() => {
    if (!phoneNumber) return "";
    return new AsYouType(currentCountry.id).input(phoneNumber) || phoneNumber;
  }, [currentCountry.id, phoneNumber]);

  const phonePlaceholder = useMemo(() => {
    try {
      const example = getExampleNumber(currentCountry.id, examples);
      if (example) return example.formatNational();
    } catch {
      // ignore
    }
    return "123 456 789";
  }, [currentCountry.id]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Teléfono de contacto</h2>
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">País y número</label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <select
            value={selectedCountry}
            onChange={(e) => {
              const nextCountry = e.target.value as CountryCode;
              onCountryChange(nextCountry);
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
          >
            {phoneCountries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.label} (+{country.dialCode})
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="numeric"
            value={formattedPhoneNumber}
            onChange={(e) => {
              const digits = normalizePhoneDigits(e.target.value);
              onNumberChange(digits.slice(0, MAX_NATIONAL_LENGTH));
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm"
            placeholder={phonePlaceholder}
          />
        </div>
        <p className="text-sm text-slate-500">Ingresa el número local y selecciona el país.</p>
        {showValidation && error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : null}
      </div>
    </section>
  );
};

export default memo(PhoneNumberSection);
