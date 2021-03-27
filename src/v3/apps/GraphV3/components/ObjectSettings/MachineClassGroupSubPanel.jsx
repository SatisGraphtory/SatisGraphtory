import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import BuildIcon from '@material-ui/icons/Build';
import produce from 'immer';
import React from 'react';
import GenericSelector from 'v3/apps/GraphV3/components/Selectors/GenericSelector';
import MathExpressionSelectorComponent from 'v3/apps/GraphV3/components/Selectors/MathExpressionSelectorComponent';
import { resolveSelectorOptions } from 'v3/apps/GraphV3/components/Selectors/resolveSelectorOptions';
import { LocaleContext } from 'v3/components/LocaleProvider';
import { getConfigurableOptionsByMachineClass } from 'v3/data/loaders/buildings';

const useStyles = makeStyles((theme) => ({
  modifyButton: {},
  subPanelDetail: {
    width: '100%',
    height: '100%',
  },
  resetButton: {
    marginTop: 10,
  },
}));

function consolidateOptions(nodes, whitelistedOptions) {
  const commonOptions = {};
  const blacklistedOptions = new Set();
  for (const options of nodes) {
    for (const [optionKey, optionValue] of options) {
      if (!whitelistedOptions.has(optionKey)) continue;
      if (blacklistedOptions.has(optionKey)) continue;
      if (!commonOptions[optionKey] !== undefined) {
        commonOptions[optionKey] = {
          value: optionValue,
        };
      } else {
        if (commonOptions[optionKey] !== optionValue) {
          blacklistedOptions.add(optionKey);
          delete commonOptions[optionKey];
        }
      }
    }
  }
  return commonOptions;
}

function createInitialDraftState(
  allOptions,
  modifiableOptionNames,
  consolidatedCommonOptions,
  translate
) {
  const draftState = {};
  for (const [configKey, configEntry] of Object.entries(allOptions)) {
    if (!modifiableOptionNames.has(configKey)) continue;
    const { initialValue } = resolveSelectorOptions(
      configEntry,
      consolidatedCommonOptions,
      configKey,
      translate,
      {}
    );
    if (initialValue !== undefined && initialValue !== null) {
      draftState[configKey] = initialValue;
    }
  }

  return draftState;
}

function MachineClassGroupSubPanel(props) {
  const { machineClassName, nodes } = props;
  const { translate } = React.useContext(LocaleContext);
  const classes = useStyles();

  const allOptions = getConfigurableOptionsByMachineClass(machineClassName);
  const modifiableOptionNames = new Set(
    Object.keys(allOptions).filter((key) => allOptions[key].mutable !== false)
  );

  const consolidatedCommonOptions = consolidateOptions(
    nodes.map((node) => node.getAdditionalData()),
    modifiableOptionNames
  );
  const elements = [];

  const [draftSelection, setDraftSelection] = React.useState(() => {
    return createInitialDraftState(
      allOptions,
      modifiableOptionNames,
      consolidatedCommonOptions,
      translate
    );
  });

  for (const [configKey, configEntry] of Object.entries(allOptions)) {
    if (!modifiableOptionNames.has(configKey)) continue;
    const { initialValue, choices, selectedChoice } = resolveSelectorOptions(
      configEntry,
      consolidatedCommonOptions,
      configKey,
      translate,
      draftSelection
    );
    if (configEntry.mathExpression) {
      elements.push(
        <MathExpressionSelectorComponent
          key={configKey}
          configEntry={configEntry}
          configKey={configKey}
          setDraftFunction={setDraftSelection}
          currentDraft={draftSelection}
          initialValue={initialValue.value}
        />
      );
    } else {
      elements.push(
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
    }
  }

  const allKeys = new Set([
    ...Object.keys(consolidatedCommonOptions),
    Object.keys(draftSelection),
  ]);

  const isEqual = allKeys.every((key) => {
    return consolidatedCommonOptions[key]?.value === draftSelection[key]?.value;
  });

  return (
    <div className={classes.subPanelDetail}>
      {elements}
      <Button
        onClick={() => {
          const newAdditionalData = produce(draftSelection, (draftState) => {
            for (const key of Object.keys(draftState)) {
              draftState[key] = draftState[key].value;
            }
          });
          for (const node of nodes) {
            node.updateAdditionalData(newAdditionalData);
          }
        }}
        className={classes.modifyButton}
        fullWidth
        disabled={isEqual}
        color="primary"
        variant="contained"
        startIcon={<BuildIcon />}
      >
        {isEqual
          ? 'No changes'
          : `Modify ${nodes.length} Node${nodes.length === 1 ? '' : 's'}`}
      </Button>
    </div>
  );
}

export default MachineClassGroupSubPanel;
