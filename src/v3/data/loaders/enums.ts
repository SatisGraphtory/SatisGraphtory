import memoize from 'fast-memoize';

const getEnumNamesFn = (enm: any) => {
  const names = [];
  for (const enumMember in enm) {
    const isValueProperty = parseInt(enumMember, 10) >= 0;
    if (!isValueProperty) {
      names.push(enumMember);
    }
  }

  return names;
};

const getEnumValuesFn = (enm: any) => {
  const names = [];
  for (const enumMember in enm) {
    const isValueProperty = parseInt(enumMember, 10) >= 0;
    if (isValueProperty) {
      names.push(parseInt(enumMember, 10));
    }
  }

  return names;
};

const getEnumDisplayNamesFn = (enm: any, enumDisplayNameKey: any) => {
  const names = [];
  for (const enumMember in enm) {
    const isValueProperty = parseInt(enumMember, 10) >= 0;
    if (!isValueProperty && !enumMember.endsWith('MAX')) {
      names.push(enumDisplayNameKey[enm[enumMember]]);
    }
  }

  return names;
};

export const getEnumValue = (enm: any, enumMap: any) => {
  return enumMap[enm];
};

export const getEnumValues = memoize(getEnumValuesFn);
export const getEnumNames = memoize(getEnumNamesFn);
export const getEnumDisplayNames = memoize(getEnumDisplayNamesFn);
