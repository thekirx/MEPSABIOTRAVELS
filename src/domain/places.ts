const places: Record<string, { code: string; city: string }> = {
  Japan: { code: "NRT", city: "Tokyo–Osaka" },
  "South Korea": { code: "ICN", city: "Seoul" },
  "Hong Kong": { code: "HKG", city: "Hong Kong" },
  Singapore: { code: "SIN", city: "Singapore" },
  "El Nido, Palawan": { code: "ENI", city: "El Nido" },
  "El Nido": { code: "ENI", city: "El Nido" },
  Boracay: { code: "MPH", city: "Boracay" },
};
export const destinationCode = (destination: string) =>
  places[destination]?.code ?? "TRIP";
export const destinationCity = (destination: string) =>
  places[destination]?.city ?? destination;
