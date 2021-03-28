import * as PIXIMain from 'pixi.js';
import * as PIXILegacy from 'pixi.js-legacy';

const urlParams = new URLSearchParams(window.location.search);

let PIXIImpl;

if (urlParams.get('useCanvas')) {
  console.log('Using Canvas Pixi');
  PIXIImpl = PIXILegacy;
} else {
  console.log('Using WebGL Pixi');
  PIXIImpl = PIXIMain;
}
window.PIXI = PIXIImpl;
global.PIXI = PIXI;
export default PIXIImpl as any;
