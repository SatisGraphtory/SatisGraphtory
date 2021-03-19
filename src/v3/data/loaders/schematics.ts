import Schematics from '.DataWarehouse/main/Schematics.json';
import { ESchematicType } from '.DataLanding/interfaces/enums';

import memoize from 'fast-memoize';

const recipeByUnlocks = new Map();
const unlocksByRecipe = new Map();

const blacklistedSchematics = new Set<string>(['schematic-save-compatibility']);

const schematicEntries = Object.entries(Schematics).filter(([key]) => {
  return !blacklistedSchematics.has(key);
});

for (const [slug, entry] of schematicEntries) {
  for (const unlocks of entry?.mUnlocks || []) {
    for (const recipe of (unlocks as any)?.mRecipes || []) {
      const unlockSlug = recipe.slug;

      if (!unlocksByRecipe.has(unlockSlug)) {
        unlocksByRecipe.set(unlockSlug, new Set());
      }

      if (!recipeByUnlocks.has(slug)) {
        recipeByUnlocks.set(slug, new Set());
      }

      unlocksByRecipe.get(unlockSlug)!.add(slug);
      recipeByUnlocks.get(slug)!.add(unlockSlug);
    }
  }
}

function getAlternateRecipesFn() {
  const alternateRecipes = new Set<string>();
  for (const [, entry] of schematicEntries) {
    if (entry?.mType === ESchematicType.EST_Alternate) {
      for (const unlock of entry?.mUnlocks) {
        for (const recipe of (unlock as any).mRecipes || []) {
          alternateRecipes.add(recipe.slug);
        }
      }
    }
  }

  return alternateRecipes;
}

export const getAlternateRecipes = memoize(getAlternateRecipesFn);
