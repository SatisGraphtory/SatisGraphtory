import PIXI from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/PixiProvider';
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

const createWrappedText = (
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

  return createText(
    displayedString,
    styleOptions.style,
    x,
    y,
    horizontalAlign,
    verticalAlign,
    true
  );
};

export default createWrappedText;
