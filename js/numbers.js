// German number helpers used by lessons, drills and the placement test.

const ones = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
  "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const tens = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

// 0–99 (small unit first: 47 = siebenundvierzig).
function below100(n) {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (o === 0) return tens[t];
  return (o === 1 ? "ein" : ones[o]) + "und" + tens[t];
}

// 0–9999: 100 = hundert, 347 = dreihundertsiebenundvierzig, 2500 = zweitausendfünfhundert.
export function numberToGerman(n) {
  if (n < 100) return below100(n);
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return (h === 1 ? "" : below100Prefix(h)) + "hundert" + (rest ? below100(rest) : "");
  }
  if (n < 10000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    return (th === 1 ? "" : below100Prefix(th)) + "tausend" + (rest ? numberToGerman(rest) : "");
  }
  return String(n);
}

// In compounds "eins" becomes "ein": einhundert is avoided, but zweihundert, dreitausend etc. use the plain word.
const below100Prefix = (n) => (n === 1 ? "ein" : ones[n]);

// 3.50 -> "drei Euro fünfzig", 0.80 -> "achtzig Cent", 4.00 -> "vier Euro"
export function priceToGerman(euros, cents) {
  const e = euros === 1 ? "ein" : numberToGerman(euros);
  if (euros === 0) return `${numberToGerman(cents)} Cent`;
  if (cents === 0) return `${e} Euro`;
  return `${e} Euro ${numberToGerman(cents)}`;
}
