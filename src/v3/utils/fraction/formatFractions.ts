import { Fraction } from 'mathjs';

export const formatFraction = (fraction: Fraction, minDecimals: number) => {
  return ((fraction.n / fraction.d) * fraction.s).toFixed(minDecimals);
};
