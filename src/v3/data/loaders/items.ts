import ItemJson from '.DataWarehouse/main/Items.json';
import ItemClassJson from '.DataWarehouse/main/ItemClasses.json';
import ConnectionResourceFormsJson from '.DataWarehouse/main/ConnectionResourceForms.json';
import memoize from 'fast-memoize';
import { getBuildingImageName } from 'v3/data/loaders/buildings';
import { getMachineCraftableRecipeDefinitionList } from 'v3/data/loaders/recipes';

import { getImageFileFromSlug } from './images';

export const getItemDefinition = (itemSlug: string) => {
  return (ItemJson as any)[itemSlug];
};

const getResourcesFn = () => {
  return Object.entries(ItemClassJson)
    .filter(([, value]) => {
      return value === 'FGResourceDescriptor';
    })
    .map(([key]) => key);
};

const getResourcesByFormFn = (resourceForm: number) => {
  return Object.entries(ItemJson)
    .filter(([key, value]) => {
      return (
        (ItemClassJson as any)[key] === 'FGResourceDescriptor' &&
        (value as any).mForm === resourceForm
      );
    })
    .map(([key]) => key);
};

const getItemListFn = () => {
  return Object.entries(ItemJson).map(([slug, value]) => {
    return {
      ...value,
      slug,
    };
  });
};

export const getItemIcon = (itemSlug: string, size: number = 256) => {
  const itemImageSlug = getBuildingImageName(itemSlug);

  return getImageFileFromSlug(itemImageSlug, size);
};

//TODO: REVISIT
const getMachineCraftableItemsFn = () => {
  return [
    ...new Set(
      getMachineCraftableRecipeDefinitionList()
        .map((item) => {
          return [
            ...item.mProduct.map((subItem: any) => subItem.ItemClass.slug),
          ];
        })
        .flat()
    ),
  ];
};

const getAllItemsFn = () => {
  return ItemJson;
};

export const getItemResourceForm = (itemSlug: string) => {
  return (getAllItemsFn() as Record<string, any>)[itemSlug].mForm;
};

const resourceFormToConnectionTypeMap = new Map<number, number>();

for (const [key, values] of Object.entries(ConnectionResourceFormsJson)) {
  for (const value of values) {
    resourceFormToConnectionTypeMap.set(value, parseInt(key, 10));
  }
}

export const getConnectionTypeNeededForItem = (itemSlug: string) => {
  const form = (getAllItemsFn() as Record<string, any>)[itemSlug].mForm;
  return resourceFormToConnectionTypeMap.get(form)!;
};

export const getMachineCraftableItems = memoize(getMachineCraftableItemsFn);
export const getResources = memoize(getResourcesFn);
export const getResourcesByForm = memoize(getResourcesByFormFn);
export const getItemList = memoize(getItemListFn);
