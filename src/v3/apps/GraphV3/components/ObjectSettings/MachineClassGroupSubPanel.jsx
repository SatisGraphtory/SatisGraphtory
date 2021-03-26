import { Typography } from '@material-ui/core';
// import {makeStyles} from "@material-ui/core/styles";
import React from 'react';
import GenericSelector from 'v3/apps/GraphV3/components/Selectors/GenericSelector';
import MathExpressionSelectorComponent from 'v3/apps/GraphV3/components/Selectors/MathExpressionSelectorComponent';
import { resolveSelectorOptions } from 'v3/apps/GraphV3/components/Selectors/resolveSelectorOptions';
import { LocaleContext } from 'v3/components/LocaleProvider';
import { getConfigurableOptionsByMachineClass } from 'v3/data/loaders/buildings';

// const useStyles = makeStyles((theme) => ({
//
// }));

function consolidateOptions(nodes) {
  const commonOptions = {};
  const blacklistedOptions = new Set();
  for (const options of nodes) {
    for (const [optionKey, optionValue] of options) {
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

function MachineClassGroupSubPanel(props) {
  const { machineClassName, nodes } = props;
  const { translate } = React.useContext(LocaleContext);
  // const classes = useStyles();

  const allOptions = getConfigurableOptionsByMachineClass(machineClassName);
  const modifiableOptionNames = new Set(
    Object.keys(allOptions).filter((key) => allOptions[key].mutable !== false)
  );

  const consolidatedCommonOptions = consolidateOptions(
    nodes.map((node) => node.getAdditionalData())
  );

  const elements = [];

  const [draftSelection, setDraftSelection] = React.useState(() => {
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

  return (
    <div>
      <Typography variant="h6">{translate(machineClassName)}</Typography>
      {elements}
      {/*{machineMap.machineClassNames.map((machineClassName) => {*/}
      {/*  for (const machineName of machineMap.sortedMachineMap.get(machineClassName)) {*/}
      {/*    // const tiers = getTiersForMachineClass(machineClassName);*/}
      {/*    const theseNodes = nodes.filter(node => node.machineName === machineName);*/}
      {/*    const allOptions = getConfigurableOptionsByMachineClass(machineClassName);*/}
      {/*    const modifiableOptions = Object.keys(allOptions).filter(key => allOptions[key].mutable !== false);*/}
      {/*    console.log(modifiableOptions);*/}
      {/*  }*/}

      {/*  return [*/}
      {/*    <Typography key={1} variant="h5">Hello</Typography>*/}
      {/*  ];*/}
      {/*})}*/}
    </div>
  );
}

export default MachineClassGroupSubPanel;
