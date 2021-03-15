import entries from '.DataWarehouse/images';
import ImageNameMap from '.DataWarehouse/images/ImageNameMap.json';

export const getImageFileFromSlug = (slug: string, size: number) => {
  const imageName = (ImageNameMap as any)[slug];
  if (!imageName) throw new Error('Did not find image slug ' + slug);

  const fullName = imageName + '_' + size;
  if (!(entries as any)[fullName])
    throw new Error('Could not find imagge ' + fullName);
  return (entries as any)[fullName];
};
