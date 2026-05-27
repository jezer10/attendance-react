import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";

// Register Spanish locale
countries.registerLocale(es);

export interface PhoneCountry {
  id: string;
  label: string;
  dialCode: string;
}

/**
 * Generates the full list of countries with localized names and dial codes.
 * Restored from project history (commit f56e0f).
 */
export const getAllCountries = (): PhoneCountry[] => {
  const regions = getCountries();
  return regions
    .map((region) => {
      // Priority: Official Spanish name -> English name -> Region Code
      const label =
        countries.getName(region, "es", { select: "official" }) ||
        countries.getName(region, "en") ||
        region;
      
      let dialCode = "";
      try {
        dialCode = String(getCountryCallingCode(region));
      } catch {
        dialCode = "";
      }
      
      return { id: region, label, dialCode };
    })
    .filter((country) => country.dialCode)
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
};

/**
 * Resolves the dial code for a given country code.
 */
export const getDialCode = (countryCode: CountryCode): string => {
  try {
    return String(getCountryCallingCode(countryCode));
  } catch {
    return "51"; // Default fallback to Peru
  }
};
