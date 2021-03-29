import PIXI from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/PixiProvider';
import { imgMap } from '../../../../../../../data/loaders/images';
import createOutline from '../../../algorithms/outliner';
import uuidGen from '../../../../../../../utils/stringUtils';

type CreateImageAdditionalOptions = {
  outline?: {
    color: number;
    lineWidth: number;
  };
};

export const createImageIconFromSlug = (
  slug: string,
  width: number,
  height: number,
  x: number,
  y: number,
  additionalOptions?: CreateImageAdditionalOptions
) => {
  const texture = PIXI.utils.TextureCache[slug];

  const container = new PIXI.Container();

  if (additionalOptions?.outline) {
    const { color, lineWidth } = additionalOptions.outline;
    const ImgElement = imgMap.get(slug)!;

    const points = createOutline(ImgElement);
    const graphicsObject = new PIXI.Graphics();
    graphicsObject.lineStyle(lineWidth * 2, color, 1);

    const polygon = new PIXI.Polygon(points);
    polygon.closeStroke = true;
    graphicsObject.drawShape(polygon);
    graphicsObject.position.x = -(width / 2);
    graphicsObject.position.y = -(height / 2);
    graphicsObject.scale.set(
      width / ImgElement.naturalWidth,
      height / ImgElement.naturalHeight
    );
    container.addChild(graphicsObject);
  }

  const imageSprite = new PIXI.Sprite(texture);
  imageSprite.anchor.set(0.5, 0.5);
  imageSprite.width = width;
  imageSprite.height = height;

  container.position.x = x;
  container.position.y = y;
  container.addChild(imageSprite);
  return container;
};

//TODO: figure out how to use this
export class MultiOutlineControllerContainer extends PIXI.Container {
  id: string = uuidGen();

  addChild(child: any) {
    super.addChild(child);
  }
}
