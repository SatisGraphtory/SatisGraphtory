import PIXI from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/PixiProvider';
import { RECIPE_FONT_OFFSET } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Offsets';
import memoize from 'fast-memoize';
import {
  EFFICIENCY_FONT_SIZE,
  NAME_FONT_SIZE,
  OVERCLOCK_STROKE_SIZE,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Texts';
import uuidGen from '../../../../../../../utils/stringUtils';

export const RECIPE_STYLE = memoize((width: number, theme) => {
  const textStyle = new PIXI.TextStyle({
    align: 'center',
    fill: theme.nodeSubText.fill,
    fontSize: NAME_FONT_SIZE,
    fontFamily: '"Bebas Neue", sans-serif',
    stroke: theme.nodes.text.name.stroke,
    strokeThickness: theme.nodes.text.name.strokeThickness,
    wordWrapWidth: width - RECIPE_FONT_OFFSET,
    wordWrap: true,
  });
  const styleUuid = 'custom-font' + uuidGen();
  PIXI.BitmapFont.from(styleUuid, textStyle, {
    resolution: 10,
    chars: PIXI.BitmapFont.ASCII,
  });

  return {
    style: {
      fontName: styleUuid,
      maxWidth: width - RECIPE_FONT_OFFSET,
      fontSize: NAME_FONT_SIZE,
    },
    textStyle,
  };
});

export const MACHINE_STYLE = memoize((theme) => {
  const textStyle = new PIXI.TextStyle({
    align: 'center',
    fill: theme.nodeName.fill,
    fontSize: theme.nodes.text.name.fontSize,
    stroke: theme.nodes.text.name.stroke,
    strokeThickness: theme.nodes.text.name.strokeThickness,
    fontFamily: '"Bebas Neue", sans-serif',
  });
  const styleUuid = 'custom-font' + uuidGen();
  PIXI.BitmapFont.from(styleUuid, textStyle, {
    resolution: 10,
    chars: PIXI.BitmapFont.ASCII,
  });

  return {
    fontName: styleUuid,
  };
});

export const NODE_TIER_STYLE = memoize((theme) => {
  const textStyle = new PIXI.TextStyle({
    align: 'center',
    fill: theme.nodes.text.tier.fill,
    fontSize: theme.nodes.text.tier.fontSize,
    fontFamily: '"Roboto Slab", sans-serif',
    stroke: theme.nodes.text.tier.stroke,
    strokeThickness: theme.nodes.text.tier.strokeThickness,
    // fontWeight: "bold"
  });
  const styleUuid = 'custom-font' + uuidGen();
  PIXI.BitmapFont.from(styleUuid, textStyle, {
    resolution: 10,
    chars: PIXI.BitmapFont.ASCII,
  });

  return {
    fontName: styleUuid,
    fontSize: theme.nodes.text.tier.fontSize,
  };
});

export const EDGE_TIER_STYLE = memoize((theme) => {
  const textStyle = new PIXI.TextStyle({
    align: 'center',
    fill: theme.edges.text.tier.fill,
    fontSize: theme.edges.text.tier.fontSize,
    fontFamily: '"Roboto Slab", sans-serif',
    stroke: theme.edges.text.tier.stroke,
    strokeThickness: theme.edges.text.tier.strokeThickness,
    fontWeight: 'bold',
  });

  const styleUuid = 'custom-font' + uuidGen();

  PIXI.BitmapFont.from(styleUuid, textStyle, {
    resolution: 9,
    chars: PIXI.BitmapFont.ALPHA,
  });

  return {
    style: {
      fontName: styleUuid,
    },
    textStyle,
  };
});

export const OVERCLOCK_STYLE = memoize((theme) => {
  const textStyle = new PIXI.TextStyle({
    align: 'right',
    fill: theme.overclock.fill,
    fontSize: EFFICIENCY_FONT_SIZE,
    fontFamily: '"Bebas Neue", sans-serif',
    stroke: theme.overclock.stroke,
    strokeThickness: OVERCLOCK_STROKE_SIZE,
  });
  const styleUuid = 'custom-font' + uuidGen();
  PIXI.BitmapFont.from(styleUuid, textStyle, {
    resolution: 10,
    chars: PIXI.BitmapFont.ASCII,
  });

  return {
    fontName: styleUuid,
  };
});

export const RATE_STYLE = memoize((theme) => {
  const textStyle = new PIXI.TextStyle({
    align: 'right',
    fill: theme.rate.fill,
    fontSize: EFFICIENCY_FONT_SIZE,
    fontFamily: '"Bebas Neue", sans-serif',
    stroke: theme.rate.stroke,
    strokeThickness: OVERCLOCK_STROKE_SIZE,
  });

  const styleUuid = 'custom-font' + uuidGen();

  PIXI.BitmapFont.from(styleUuid, textStyle, {
    resolution: 10,
    chars: PIXI.BitmapFont.ASCII,
  });

  return {
    fontName: styleUuid,
  };
});

// export const INPUT_STYLE = memoize(
//   (theme) =>
//     new PIXI.TextStyle({
//       align: 'left',
//       fill: GREEN,
//       fontSize: INPUT_FONT_SIZE,
//       fontFamily: '"Roboto Condensed", sans-serif',
//     })
// );
//
// export const OUTPUT_STYLE = memoize(
//   (theme) =>
//     new PIXI.TextStyle({
//       align: 'left',
//       fill: ORANGE,
//       fontSize: OUTPUT_FONT_SIZE,
//       fontFamily: '"Roboto Condensed", Helvetica, sans-serif',
//     })
// );
