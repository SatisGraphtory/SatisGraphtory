import { recipeEnums, itemEnums } from '.DataWarehouse/enums/dataEnums';

const getEnumFromNumber = (
  key: number,
  enumStore: Record<string | number, string | number>
) => {
  if (key === 0) return '';

  const enumNumber = enumStore[key];

  if (enumNumber === undefined) {
    throw new Error('No enum defined for key ' + key);
  }

  if (typeof enumNumber === 'number') {
    throw new Error(
      'Key ' + key + ' was used to retrieve number value ' + enumNumber
    );
  }

  return enumNumber;
};

const getNumberFromEnum = (
  key: string,
  enumStore: Record<string | number, string | number>
) => {
  if (key === '') return 0;

  const enumNumber = enumStore[key];

  if (enumNumber === undefined) {
    throw new Error('No enum defined for key ' + key);
  }

  if (typeof enumNumber !== 'number') {
    throw new Error(
      'Key ' + key + ' was used to retrieve non-number value ' + enumNumber
    );
  }

  return enumNumber;
};

function translateEnumOrString(
  entry: string | number,
  enumStore: Record<string | number, string | number>
) {
  if (typeof entry === 'number') {
    return getEnumFromNumber(entry as number, enumStore);
  } else {
    return getNumberFromEnum(entry as string, enumStore);
  }
}

function translateEnums(draftState: any) {
  if (draftState.recipe) {
    draftState.recipe = translateEnumOrString(draftState.recipe, recipeEnums);
  }
  if (draftState.extractedItem) {
    draftState.extractedItem = translateEnumOrString(
      draftState.extractedItem,
      itemEnums
    );
  }
}

export default translateEnums;
