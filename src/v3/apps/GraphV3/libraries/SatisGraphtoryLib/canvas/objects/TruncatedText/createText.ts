import PIXI from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/PixiProvider';
// import {sgDevicePixelRatio} from "v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/canvasUtils";

type BitmapStyle = {
  fontName: string;
};

const createText = (
  text: string,
  style: PIXI.TextStyle | BitmapStyle,
  x: number,
  y: number,
  horizontalAlign = 'left',
  verticalAlign = 'center',
  bitmap = false,
  maxWidth = 0
) => {
  const nameStr = bitmap
    ? new PIXI.BitmapText(text, style)
    : new PIXI.Text(text, style);

  let alignY = -1;
  if (verticalAlign === 'top') {
    alignY = 0;
  } else if (verticalAlign === 'bottom') {
    alignY = 1;
  } else if (verticalAlign === 'center') {
    alignY = 0.5;
  }

  if (horizontalAlign === 'left') {
    nameStr.anchor.set(0, alignY);
  } else if (horizontalAlign === 'right') {
    nameStr.anchor.set(1, alignY);
  } else if (horizontalAlign === 'center') {
    nameStr.anchor.set(0.5, alignY);
  }

  //
  // let alignX = -1;
  // if (verticalAlign === 'top') {
  //   alignX = 0;
  // } else if (verticalAlign === 'bottom') {
  //   alignX = 1
  // } else if (verticalAlign === 'center') {
  //   alignX = 0.5
  // }
  //
  // nameStr.anchor.set(alignX, alignY);

  nameStr.position.x = x;
  nameStr.position.y = y;
  // nameStr.resolution = sgDevicePixelRatio * 2;
  return nameStr;
};

export default createText;
