import { makeStyles } from '@material-ui/core/styles';
import produce from 'immer';
import React from 'react';
import { LocaleContext } from 'v3/components/LocaleProvider';
import SelectDropdown from 'v3/components/SelectDropdown';

const useStyles = makeStyles((theme) => ({
  dropdown: {
    paddingBottom: 1,
  },
}));

function DropDownWrapper(props) {
  const { setValue, value, choices, label, id, noOptionsMessage } = props;

  return (
    <SelectDropdown
      {...props}
      id={id}
      selectProps={{
        classes: {
          paper: {
            zIndex: 9999,
          },
          valueContainer: {
            zIndex: 9999,
          },
        },
      }}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.target.value === '' || e.target.value === undefined) {
          setValue(null);
        }
      }}
      noOptionsMessage={noOptionsMessage}
      value={value}
      label={label}
      suggestions={choices}
    />
  );
}

function GenericSelectorComponent(props) {
  const {
    value,
    choices,
    configKey,
    setDraftFunction,
    currentDraft,
    isGrouped,
    initialValue,
  } = props;

  const classes = useStyles();

  const [internalChoice, setInternalChoice] = React.useState(initialValue);

  const { translate } = React.useContext(LocaleContext);

  const changeFunction = (newValue) => {
    let newChoice;
    if (isGrouped) {
      choices.forEach((item) => {
        const possibleChoices = item.options.filter(
          (option) => option.value === newValue
        );
        if (possibleChoices.length) {
          newChoice = possibleChoices[0];
        }
      });
    } else {
      newChoice = choices.filter((option) => option.value === newValue)[0];
    }
    setInternalChoice(newChoice);
    setDraftFunction(
      produce(currentDraft, (draftObject) => {
        draftObject[configKey] = newChoice;
      })
    );
  };

  if (value === null) {
    if (choices.length === 1) {
      setTimeout(() => {
        setDraftFunction(
          produce(currentDraft, (draftObject) => {
            draftObject[configKey] = choices[0];
          })
        );
      });
    }
  }

  if (choices.length <= 1) {
    return null;
  } else {
    return (
      <div className={classes.dropdown}>
        <DropDownWrapper
          id={configKey + '-selector'}
          disabled={false}
          choices={choices}
          value={internalChoice}
          setValue={changeFunction}
          label={translate('config-selector-' + configKey)}
        />
      </div>
    );
  }
}

const GenericSelector = React.memo(GenericSelectorComponent);

export default GenericSelector;
