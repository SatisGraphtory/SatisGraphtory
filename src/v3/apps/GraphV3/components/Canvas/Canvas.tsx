// @refresh reset
import React, { Suspense } from 'react';
import AutoSizedLoadingWrapper from 'common/react/AutoSizedLoadingWrapper';

const FontFaceObserver = require('fontfaceobserver');

const InnerComponent = React.lazy(() => {
  return Promise.all([
    new FontFaceObserver('Roboto Condensed', { weight: 400 }).load(),
    new FontFaceObserver('Bebas Neue', { weight: 400 }).load(),
    new FontFaceObserver('Roboto Slab', { weight: 400 }).load(),
    // Here is where we would have imported all images
  ])
    .catch(() => {
      // Prerenderer isn't happy about us blocking on load
      return import(
        'v3/apps/GraphV3/libraries/SatisGraphtoryLib/react/PixiJSCanvas/PixiJSCanvasContainer'
      );
    })
    .then(
      () =>
        import(
          'v3/apps/GraphV3/libraries/SatisGraphtoryLib/react/PixiJSCanvas/PixiJSCanvasContainer'
        )
    );
});

type CanvasProps = {
  initialCanvasGraph: Record<string, any> | undefined;
  onFinishLoad: () => void | undefined;
  dataLoaded: boolean;
};

function Canvas(props: CanvasProps) {
  return (
    <Suspense fallback={<AutoSizedLoadingWrapper />}>
      <InnerComponent {...props} />
    </Suspense>
  );
}

export default Canvas;
