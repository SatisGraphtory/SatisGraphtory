import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import { all, create } from 'mathjs';
import React from 'react';
import { BrowserView, isMobile } from 'react-device-detect';
import ModalOpenTrigger from 'v3/apps/GraphV3/components/ModalOpenTrigger/ModalOpenTrigger';
import GenericSelector from 'v3/apps/GraphV3/components/Selectors/GenericSelector';
import MathExpressionSelectorComponent from 'v3/apps/GraphV3/components/Selectors/MathExpressionSelectorComponent';
import { resolveSelectorOptions } from 'v3/apps/GraphV3/components/Selectors/resolveSelectorOptions';
import { GlobalGraphAppStore } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStore';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';
import { LocaleContext } from 'v3/components/LocaleProvider';
import {
  getBuildableMachineClassIcon,
  getBuildingIcon,
  getConfigurableOptionsByMachineClass,
} from 'v3/data/loaders/buildings';

const useStyles = makeStyles((theme) => ({
  openDialog: {
    minWidth: 350,
  },
  machineImage: {
    width: 30,
    height: 30,
    marginRight: 10,
    verticalAlign: 'middle',
  },
}));

const mathjsFractionReader = create(all);
mathjsFractionReader.config({ number: 'Fraction' });

function NodeCreationDialog(props) {
  const { nodeClass, openDialog, setOpenDialog, closeDrawerFunction } = props;
  const classes = useStyles();
  const { translate } = React.useContext(LocaleContext);
  const { pixiCanvasStateId, nodeStampOptions } = React.useContext(
    PixiJSCanvasContext
  );

  const configurableOptions = getConfigurableOptionsByMachineClass(nodeClass);

  const [draftSelection, setDraftSelection] = React.useState(() => {
    const draftState = {};
    for (const [configKey, configEntry] of Object.entries(
      configurableOptions
    )) {
      const { initialValue } = resolveSelectorOptions(
        configEntry,
        nodeStampOptions,
        configKey,
        translate,
        {}
      );
      if (initialValue !== undefined && initialValue !== null) {
        draftState[configKey] = initialValue;
      }
    }

    return draftState;
  });

  let totalUserChoices = 0;

  let numChoicesLeft = Object.entries(configurableOptions).length;

  const childElements = [];

  for (const [configKey, configEntry] of Object.entries(configurableOptions)) {
    const { initialValue, choices, selectedChoice } = resolveSelectorOptions(
      configEntry,
      nodeStampOptions,
      configKey,
      translate,
      draftSelection
    );
    if (configEntry.mathExpression) {
      childElements.push(
        <MathExpressionSelectorComponent
          key={configKey}
          configEntry={configEntry}
          configKey={configKey}
          setDraftFunction={setDraftSelection}
          currentDraft={draftSelection}
          initialValue={initialValue.value}
        />
      );
      if (draftSelection[configKey] !== undefined) {
        numChoicesLeft--;
      }
    } else {
      childElements.push(
        <GenericSelector
          key={configKey}
          value={selectedChoice}
          choices={choices}
          configKey={configKey}
          setDraftFunction={setDraftSelection}
          currentDraft={draftSelection}
          isGrouped={configEntry.grouped || false}
          initialValue={initialValue}
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
