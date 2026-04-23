import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

const d1 = makeDualDateValueFromAd(new Date("2026-04-24"));
const d2 = makeDualDateValueFromAd(new Date("2026-04-23"));
const d3 = makeDualDateValueFromAd(new Date("2026-04-24T00:00:00"));
console.log("2026-04-24 ->", d1.formatted.bs);
console.log("2026-04-23 ->", d2.formatted.bs);
console.log("2026-04-24T00:00:00 ->", d3.formatted.bs);
