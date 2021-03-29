import entries from '.DataWarehouse/images';
import ImageNameMap from '.DataWarehouse/images/ImageNameMap.json';
import {
  getAllItemSlugsWithIcons,
  getImageSlugForItem,
  getItemIcon,
} from './items';
import { ITEM_SIZE } from '../../apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Sizes';

export const getImageFileFromSlug = (slug: string, size: number) => {
  const imageName = (ImageNameMap as any)[slug];
  if (!imageName) throw new Error('Did not find image slug ' + slug);

  const fullName = imageName + '_' + size;
  if (!(entries as any)[fullName])
    throw new Error('Could not find image ' + fullName);
  return (entries as any)[fullName];
};

// Precache all this crap.
const allItemSlugs = getAllItemSlugsWithIcons();

export const imgMap = new Map<string, any>();

const allImagePromises = [] as Promise<any>[];

for (const item of allItemSlugs) {
  const itemImageSlug = getImageSlugForItem(item);
  const itemImg = getItemIcon(itemImageSlug, ITEM_SIZE);

  const img = new Image();
  img.src = itemImg;
  allImagePromises.push(
    new Promise((resolve) => {
      img.onload = function () {
        imgMap.set(item, this);
        resolve(this);
      };
    })
  );
}

export const loadAllImages = () => {
  return Promise.all(allImagePromises);
};
