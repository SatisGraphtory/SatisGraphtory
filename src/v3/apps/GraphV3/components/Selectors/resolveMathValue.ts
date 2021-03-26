import { all, create, typeOf, evaluate, fraction } from 'mathjs';

const fractionMathJsInstance = create(all) as any;
fractionMathJsInstance.config({
  number: 'Fraction',
});

export default function resolveMathValue(currentValue: any) {
  let mathValue;
  try {
    mathValue = fractionMathJsInstance.evaluate(currentValue);
    if (typeOf(mathValue) !== 'Fraction') {
      mathValue = fraction(mathValue);
    }
  } catch (e) {
    try {
      mathValue = fraction(evaluate(currentValue));
    } catch (e) {
      return undefined;
    }
  }

  if (mathValue === undefined || typeOf(mathValue) !== 'Fraction') {
    return undefined;
  }

  return mathValue;
}
