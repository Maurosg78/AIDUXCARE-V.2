// @ts-nocheck
import { geolocationService } from "../../services/geolocationService";

import type { PhoneCountryCode } from "@/services/geolocationService";

export type Props = {
  selectedCode?: PhoneCountryCode | null;
  onChange: (code: PhoneCountryCode) => void;
};

export default function CountryCodeSelector({ selectedCode, onChange }: Props) {
  // El servicio devuelve la lista tipada (usamos assertion específica, sin any/unknown)
  const countryCodes = geolocationService.getAllPhoneCountryCodes() ;

  return (
    <select
      className="border rounded px-2 py-1"
      value={selectedCode?.code ?? ""}
      onChange={(e) => {
        const next = countryCodes.find(c => c.code === e.target.value);
        if (next) onChange(next);
      }}
    >
      <option value="" disabled>Selecciona país</option>
      {countryCodes.map((country: PhoneCountryCode) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
}
