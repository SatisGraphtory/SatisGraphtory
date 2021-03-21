import EdgeTemplate from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';
import { NodeTemplate } from '../Node/NodeTemplate';

export class EmptyEdge extends EdgeTemplate {
  addDragEvents(): any[] {
    return [];
  }

  addSelectEvents(onSelectObjects: (ids: string[]) => any): void {}

  disableHitBox(): void {}

  enableHitBox(): void {}

  removeInteractionEvents(): void {}

  update(): void {}
  updateWithoutHitBox(): void {}

  setConnections(
    sourceNode: NodeTemplate | null,
    targetNode: NodeTemplate | null
  ): void {
    if (sourceNode !== null || targetNode !== null) {
      throw new Error('Cannot set connections on an empty edge');
    }
  }
}
