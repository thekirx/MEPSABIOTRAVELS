const php = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});
export const money = (centavos: number) => php.format(centavos / 100);
export function centavos(value: string | number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0)
    throw new Error("Enter a valid positive amount.");
  return Math.round(n * 100);
}
