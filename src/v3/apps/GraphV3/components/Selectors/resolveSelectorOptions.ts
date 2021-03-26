import { resolveSelectedDropdownChoice } from './resolveSelectedChoice';

function resolveMathSelectorComponent(
  nodeStampOptions: any,
  configKey: string,
  draftSelection: any,
  configEntry: any
) {
  const baseValue = (nodeStampOptions || {})[configKey]?.value;

  if (baseValue !== undefined) {
    return baseValue;
  }

  const currentValue = draftSelection[configKey];
  if (currentValue !== undefined) {
    return currentValue.value;
  }

  return configEntry.defaultValue;
}

export function resolveSelectorOptions(
  configEntry: any,
  nodeStampOptions: any,
  configKey: string,
  translate: any,
  draftSelection: any
) {
  if (configEntry.mathExpression) {
    return {
      initialValue: {
        value: resolveMathSelectorComponent(
          nodeStampOptions,
          configKey,
          draftSelection,
          configEntry
        ),
      },
    };
  } else {
    const { choices, selectedChoice } = resolveSelectedDropdownChoice(
      configKey,
      configEntry,
      translate,
      draftSelection[configKey],
      nodeStampOptions
    );

    let choiceValue =
      configEntry.grouped || false
        ? choices
            .map((choice: any) => choice.options)
            .flat()
            .filter((option: any) => option.value === selectedChoice)
        : choices.filter((option: any) => option.value === selectedChoice);

    return {
      initialValue: choiceValue.length ? choiceValue[0] : null,
      choices,
      selectedChoice,
    };
  }
}
