import RecipeJson from '.DataWarehouse/main/Recipes.json';
import memoize from 'fast-memoize';

const getAllRecipesFn = () => {
  return RecipeJson;
};

const getRecipeListFn = () => {
  return Object.entries(getAllRecipes()).map(([slug, value]) => {
    return {
      ...value,
      slug,
    };
  });
};

const handcraftingProducers = new Set([
  'building-equipment-descriptor-build-gun',
  'building-work-bench-component',
  'building-workshop-component',
  'building-converter', // this one is here because its recipes are not complete.
]);

const getMachineCraftableRecipeDefinitionListFn = () => {
  return getRecipeList().filter(({ mProducedIn }) => {
    return (
      mProducedIn.filter((item: any) => {
        return !handcraftingProducers.has(item.slug);
      }).length > 0
    );
  });
};

const getRecipesByMachineFn = (machineSlug: string) => {
  return getRecipeList()
    .filter(({ mProducedIn }) => {
      return (
        mProducedIn.filter((item: any) => {
          return item.slug === machineSlug;
        }).length > 0
      );
    })
    .map((item) => item.slug);
};

export const getRecipesByMachine = memoize(getRecipesByMachineFn);

const getRecipesByItemProductFn = (itemSlug: string) => {
  return getRecipeList()
    .filter(({ mProduct }) => {
      return (
        mProduct.filter((item: any) => {
          return item.ItemClass.slug === itemSlug;
        }).length > 0
      );
    })
    .map((item) => item.slug);
};

export const getRecipesByItemProduct = memoize(getRecipesByItemProductFn);

const getRecipesByItemIngredientFn = (itemSlug: string) => {
  return getRecipeList()
    .filter(({ mIngredients }) => {
      return (
        mIngredients.filter((item: any) => {
          return item.ItemClass.slug === itemSlug;
        }).length > 0
      );
    })
    .map((item) => item.slug);
};

export const getRecipesByItemIngredient = memoize(getRecipesByItemIngredientFn);

export const getMachinesFromMachineCraftableRecipe = (slug: string) => {
  return (getAllRecipes() as any)[slug].mProducedIn.filter(
    (item: any) => !handcraftingProducers.has(item.slug)
  );
};

export const getRecipeIngredients = (slug: string) => {
  return (getAllRecipes() as any)[slug].mIngredients;
};

export const getRecipeProducts = (slug: string) => {
  return (getAllRecipes() as any)[slug].mProduct;
};

export const getRecipeDefinition = (slug: string) => {
  return (getAllRecipes() as any)[slug];
};

const getMachineCraftableRecipeListFn = () => {
  return getMachineCraftableRecipeDefinitionList().map(({ slug }) => slug);
};

export const getMachineCraftableRecipeList = memoize(
  getMachineCraftableRecipeListFn
);

export const getMachineCraftableRecipeDefinitionList = memoize(
  getMachineCraftableRecipeDefinitionListFn
);

export const getAllRecipes = memoize(getAllRecipesFn);
export const getRecipeList = memoize(getRecipeListFn);
