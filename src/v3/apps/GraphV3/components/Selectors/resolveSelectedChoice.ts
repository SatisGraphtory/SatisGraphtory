export function resolveSelectedDropdownChoice(
  configKey: string,
  configEntry: any,
  translate: any,
  currentlySelectedOption: any,
  currentNodeStampOptions: any
) {
  const valueSlugMap = new Map<string, any>();

  let choices;
  let selectedChoice = null;

  const currentStampKey = currentNodeStampOptions[configKey]?.value;
  if (configEntry.grouped) {
    choices = configEntry.options.map((entry: any) => {
      const allOptions = entry.options
        .map((slug: string, index: number) => {
          valueSlugMap.set(slug, index);
          return {
            value: slug,
            label: configEntry.translations
              ? configEntry.translations[index]
              : translate(slug),
          };
        })
        .sort((a: any, b: any) => a.label.localeCompare(b.label));

      const filteredChoices = allOptions.filter(
        (item: any) => item.value === currentlySelectedOption?.value
      );

      if (filteredChoices.length) {
        selectedChoice = filteredChoices[0].value;
      } else {
        if (currentStampKey !== undefined) {
          const currentFilteredChoices = allOptions.filter(
            (item: any) => item.value === currentStampKey
          );

          if (currentFilteredChoices.length) {
            selectedChoice = currentFilteredChoices[0].value;
          }
        }
      }

      return {
        label: translate(entry.label),
        options: allOptions,
      };
    });
  } else {
    choices = configEntry.options
      .map((slug: string, index: number) => {
        valueSlugMap.set(slug, index);
        return {
          value: slug,
          label: configEntry.translations
            ? configEntry.translations[index]
            : translate(slug),
        };
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label));

    const filteredChoices = choices.filter(
      (item: any) => item.value === currentlySelectedOption?.value
    );

    if (filteredChoices.length) {
      selectedChoice = filteredChoices[0].value;
    } else {
      if (currentStampKey !== undefined) {
        const currentFilteredChoices = choices.filter(
          (item: any) => item.value === currentStampKey
        );

        if (currentFilteredChoices.length) {
          selectedChoice = currentFilteredChoices[0].value;
        }
      }
    }
  }

  return { choices, selectedChoice };
}
