import { memo, useMemo } from "react";
import { AsYouType, getExampleNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { getAllCountries } from "./countries";

interface PhoneNumberSectionProps {
  selectedCountry: CountryCode;
  phoneNumber: string;
  onCountryChange: (country: CountryCode) => void;
  onNumberChange: (number: string) => void;
  showValidation?: boolean;
  error?: string;
  className?: string;
}

const MAX_NATIONAL_LENGTH = 15;
const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

const PhoneNumberSection = ({
  selectedCountry,
  phoneNumber,
  onCountryChange,
  onNumberChange,
  showValidation,
  error,
  className = "",
}: PhoneNumberSectionProps) => {
  const allCountries = useMemo(() => getAllCountries(), []);

  const currentCountry = useMemo(
    () => allCountries.find((c) => c.id === selectedCountry) || allCountries[0],
    [selectedCountry, allCountries]
  );

  const formattedPhoneNumber = useMemo(() => {
    if (!phoneNumber) return "";
    return new AsYouType(currentCountry.id as CountryCode).input(phoneNumber) || phoneNumber;
  }, [currentCountry.id, phoneNumber]);

  const phonePlaceholder = useMemo(() => {
    try {
      const example = getExampleNumber(currentCountry.id as CountryCode, examples);
      if (example) return example.formatNational();
    } catch {
      // ignore
    }
    return "123 456 789";
  }, [currentCountry.id]);

  return (
    <section
      className={`glass-panel p-8 rounded-token space-y-6 border border-black/5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-black text-lg font-light">
            notifications_active
          </span>
        </div>
        <h2 className="font-display text-sm uppercase tracking-[0.1em] text-black font-light">
          Notificaciones
        </h2>
      </div>

      <div className="space-y-5">
        <p className="text-[10px] text-black/40 uppercase tracking-widest font-display font-light leading-relaxed">
          Configura el número de teléfono donde recibirás las confirmaciones de marcación.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="phone-country"
              className="text-[8px] text-black/40 uppercase tracking-[0.25em] ml-1 font-display font-light"
            >
              País
            </label>
            <div className="relative">
              <select
                id="phone-country"
                value={selectedCountry}
                onChange={(e) => onCountryChange(e.target.value as CountryCode)}
                className="w-full bg-white/60 border border-black/5 rounded-token px-6 py-3 focus:ring-2 focus:ring-black outline-none text-sm text-black appearance-none cursor-pointer font-light"
              >
                {allCountries.map((country) => (
                  <option key={country.id} value={country.id} className="text-black bg-white">
                    {country.label} (+{country.dialCode})
                  </option>
                ))}
              </select>
              <span
                aria-hidden="true"
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none text-base"
              >
                expand_more
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone-number"
              className="text-[8px] text-black/40 uppercase tracking-[0.25em] ml-1 font-display font-light"
            >
              Número de Teléfono
            </label>
            <input
              id="phone-number"
              type="text"
              inputMode="numeric"
              value={formattedPhoneNumber}
              onChange={(e) => {
                const digits = normalizePhoneDigits(e.target.value);
                onNumberChange(digits.slice(0, MAX_NATIONAL_LENGTH));
              }}
              className="w-full bg-white/60 border border-black/5 rounded-token px-6 py-3 focus:ring-2 focus:ring-black outline-none text-sm text-black placeholder:text-black/20 font-light"
              placeholder={phonePlaceholder}
            />
          </div>
        </div>

        {showValidation && error ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-lg border border-rose-100">
            <span className="material-symbols-outlined text-[14px] text-rose-500">error</span>
            <span className="text-[9px] uppercase tracking-widest text-rose-500 font-display font-light">
              {error}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-black/5 rounded-lg">
            <span className="material-symbols-outlined text-[14px] text-black/40 font-light">
              info
            </span>
            <span className="text-[9px] uppercase tracking-widest text-black/40 font-display font-light">
              Registro vía WhatsApp
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(PhoneNumberSection);
