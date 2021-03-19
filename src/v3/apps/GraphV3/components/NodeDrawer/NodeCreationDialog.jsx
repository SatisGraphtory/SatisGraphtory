import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import produce from 'immer';
import React from 'react';
import { BrowserView, isMobile } from 'react-device-detect';
import ModalOpenTrigger from 'v3/apps/GraphV3/components/ModalOpenTrigger/ModalOpenTrigger';
import { GlobalGraphAppStore } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStore';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';
import { LocaleContext } from 'v3/components/LocaleProvider';
import {
  getBuildableMachineClassIcon,
  getBuildingIcon,
  getConfigurableOptionsByMachine,
} from 'v3/data/loaders/buildings';
import SelectDropdown from '../../../../components/SelectDropdown';

const useStyles = makeStyles((theme) => ({
  default: {
    zIndex: theme.zIndex.drawer,
  },
  inlineLabel: {
    display: 'inline-block',
    marginRight: 10,
  },
  openDialog: {
    minWidth: 350,
  },
  select: {
    marginBottom: 10,
  },
  machineImage: {
    width: 30,
    height: 30,
    marginRight: 10,
    verticalAlign: 'middle',
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

function resolveSelectedChoice(
  configEntry,
  translate,
  currentlySelectedOption
) {
  const valueSlugMap = new Map();

  let choices;
  let selectedChoice = null;

  if (configEntry.grouped) {
    choices = configEntry.options.map((entry) => {
      const allOptions = entry.options
        .map((slug, index) => {
          valueSlugMap.set(slug, index);
          return {
            value: slug,
            label: configEntry.translations
              ? configEntry.translations[index]
              : translate(slug),
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

      const filteredChoices = allOptions.filter(
        (item) => item.value === currentlySelectedOption?.value
      );

      if (filteredChoices.length) {
        selectedChoice = filteredChoices[0].value;
      }

      return {
        label: translate(entry.label),
        options: allOptions,
      };
    });
  } else {
    choices = configEntry.options
      .map((slug, index) => {
        valueSlugMap.set(slug, index);
        return {
          value: slug,
          label: configEntry.translations
            ? configEntry.translations[index]
            : translate(slug),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const filteredChoices = choices.filter(
      (item) => item.value === currentlySelectedOption?.value
    );

    if (filteredChoices.length) {
      selectedChoice = filteredChoices[0].value;
    }
  }

  return { choices, selectedChoice };
}

function GenericSelectorComponent(props) {
  const {
    value,
    choices,
    configKey,
    setDraftFunction,
    currentDraft,
    isGrouped,
  } = props;

  const choiceValue = choices.filter((option) => option.value === value);

  const [internalChoice, setInternalChoice] = React.useState(
    choiceValue.length ? choiceValue[0] : ''
  );
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
      <DropDownWrapper
        id={configKey + '-selector'}
        disabled={false}
        choices={choices}
        value={internalChoice}
        setValue={changeFunction}
        label={translate('config-selector-' + configKey)}
      />
    );
  }
}

const GenericSelector = React.memo(GenericSelectorComponent);

function NodeCreationDialog(props) {
  const { nodeClass, openDialog, setOpenDialog, closeDrawerFunction } = props;
  const classes = useStyles();
  const { translate } = React.useContext(LocaleContext);
  const { pixiCanvasStateId } = React.useContext(PixiJSCanvasContext);

  const [draftSelection, setDraftSelection] = React.useState({});

  const configurableOptions = getConfigurableOptionsByMachine(nodeClass);

  let totalUserChoices = 0;

  let numChoicesLeft = Object.entries(configurableOptions).length;

  const childElements = [];

  for (const [configKey, configEntry] of Object.entries(configurableOptions)) {
    const { choices, selectedChoice } = resolveSelectedChoice(
      configEntry,
      translate,
      draftSelection[configKey]
    );

    childElements.push(
      <GenericSelector
        key={configKey}
        value={selectedChoice}
        choices={choices}
        configKey={configKey}
        setDraftFunction={setDraftSelection}
        currentDraft={draftSelection}
        isGrouped={configEntry.grouped || false}
      />
    );
    if (choices.length > 1) {
      totalUserChoices++;
    }

    if (!choices.length) {
      numChoicesLeft--;
    } else {
      if (selectedChoice !== null) {
        numChoicesLeft--;
      }
    }
  }

  const setSelectedDataButton = () => {
    GlobalGraphAppStore.update((s) => {
      const instance = s[pixiCanvasStateId];
      instance.nodeStampOptions = draftSelection;
    });
    setOpenDialog(false);
    closeDrawerFunction(false);
  };

  if (totalUserChoices === 0) {
    if (numChoicesLeft) {
      return <React.Fragment>{childElements}</React.Fragment>;
    } else {
      setTimeout(setSelectedDataButton, 0);
      return null;
    }
  }

  return (
    <Dialog
      open={openDialog}
      fullScreen={isMobile}
      onClose={() => {
        setOpenDialog(false);
      }}
    >
      <DialogTitle>
        <img
          src={getBuildingIcon(getBuildableMachineClassIcon(nodeClass), 64)}
          className={classes.machineImage}
          alt={props.label}
        />
        {props.label} Settings
      </DialogTitle>
      <DialogContent className={classes.openDialog}>
        <ModalOpenTrigger />
        <BrowserView>{childElements}</BrowserView>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        <Button
          disabled={numChoicesLeft > 0}
          color="primary"
          onClick={setSelectedDataButton}
        >
          Set
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NodeCreationDialog;
