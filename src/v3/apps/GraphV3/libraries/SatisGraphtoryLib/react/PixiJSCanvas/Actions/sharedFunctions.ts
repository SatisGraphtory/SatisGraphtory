import { getMultiTypedChildrenFromState } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/canvas/childrenApi';
import { MachineNodeTemplate } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/MachineNodeTemplate';
import EdgeTemplate from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';

export const removeChildEvents = (pixiCanvasStateId: any) => (t: any) => {
  const s = t[pixiCanvasStateId];
  for (const child of getMultiTypedChildrenFromState(s, [
    MachineNodeTemplate,
    EdgeTemplate,
  ])) {
    child.removeInteractionEvents();
  }
};
