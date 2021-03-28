import PIXI from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/PixiProvider';
import { produce } from 'immer';
import createText from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/TruncatedText/createText';

type WrappedBitmapStyle = {
  style: {
    fontName: string;
    maxWidth: number;
    fontSize: number;
    align?: string;
  };
  textStyle: PIXI.TextStyle;
};

const createTruncatedText = (
  text: string,
  maxWidth: number,
  styleOptions: WrappedBitmapStyle,
  x: number,
  y: number,
  horizontalAlign: string,
  verticalAlign: string
) => {
  const baseMetrics = PIXI.TextMetrics.measureText(
    text,
    styleOptions.textStyle
  );
  const displayedString = baseMetrics.lines.join('\n');

  const usedStyle = produce(styleOptions.style, (draftStyle) => {
    draftStyle.align = horizontalAlign;
  });

  return createText(
    displayedString,
    usedStyle,
    x,
    y,
    horizontalAlign,
    verticalAlign,
    true
  );
};

export default createTruncatedText;
