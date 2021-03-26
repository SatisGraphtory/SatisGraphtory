import InputAdornment from '@material-ui/core/InputAdornment';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import produce from 'immer';
import { equal, isNumeric, larger, smaller } from 'mathjs';
import React from 'react';
import resolveMathValue from 'v3/apps/GraphV3/components/Selectors/resolveMathValue';
import { LocaleContext } from 'v3/components/LocaleProvider';
import { formatFraction } from 'v3/utils/fraction/formatFractions';

const useStyles = makeStyles((theme) => ({
  numberSelector: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 5,
    margin: 3,
  },
}));

function MathExpressionSelectorComponent(props) {
  const { translate } = React.useContext(LocaleContext);
  const classes = useStyles();

  const {
    setDraftFunction,
    configEntry,
    currentDraft,
    configKey,
    initialValue,
  } = props;

  const [sliderValue, setSliderValue] = React.useState(initialValue);

  function resolveAndSetMathValue(currentValue) {
    let resolvedValue = resolveMathValue(currentValue);

    if (
      resolvedValue === undefined ||
      !isNumeric(resolvedValue) ||
      smaller(resolvedValue, configEntry.minValue) ||
      larger(resolvedValue, configEntry.maxValue)
    ) {
      resolvedValue = undefined;
    }

    if (equal(resolvedValue, resolveMathValue(currentDraft[configKey]?.value)))
      return resolvedValue;

    if (resolvedValue === undefined) {
      setTimeout(() => {
        const newDraft = produce(currentDraft, (draftObject) => {
          delete draftObject[configKey];
        });
        setDraftFunction(newDraft);
      });
    } else {
      setTimeout(() => {
        const newDraft = produce(currentDraft, (draftObject) => {
          draftObject[configKey] = { value: currentValue };
        });

        setDraftFunction(newDraft);
      });
    }
  }

  const mathValue = resolveMathValue(sliderValue);
  const percentValue =
    mathValue === undefined ? '?%' : formatFraction(mathValue, 3) + '%';

  let popperText = '';

  if (mathValue !== undefined && smaller(mathValue, configEntry.minValue)) {
    popperText = 'Value must be >= ' + configEntry.minValue;
  } else if (
    mathValue !== undefined &&
    larger(mathValue, configEntry.maxValue)
  ) {
    popperText = 'Value must be <= ' + configEntry.maxValue;
  }

  return (
    <div className={classes.numberSelector}>
      <TextField
        label={translate('config-selector-' + configKey)}
        fullWidth
        variant="outlined"
        error={mathValue === undefined || popperText !== ''}
        helperText={
          popperText !== ''
            ? popperText
            : 'Math expressions are allowed (eg. 200 * 1/3).'
        }
        value={sliderValue}
        onChange={(e) => {
          setSliderValue(e.target.value);
          resolveAndSetMathValue(e.target.value);
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">{percentValue}</InputAdornment>
          ),
        }}
      />
    </div>
  );
}

export default MathExpressionSelectorComponent;
