import uuidGen from 'v3/utils/stringUtils';
import SimpleEdge from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/SimpleEdge';
import { getConnectionTypeNeededForItem } from 'v3/data/loaders/items';
import { NodeTemplate } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/NodeTemplate';
import { EdgeAttachmentSide } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeAttachmentSide';

const populateNewEdgeData = (
  items: string[] | null,
  connectionType: number | null,
  connectorName: string,
  sourceNode: NodeTemplate,
  targetNode: NodeTemplate,
  sourceNodeAttachmentSide?: EdgeAttachmentSide,
  targetNodeAttachmentSide?: EdgeAttachmentSide
) => {
  if (items === null && connectionType == null) {
    throw new Error('Only recipe or connectionType can be null, not both');
  }

  let usedConnectionType = connectionType;

  if (items !== null && items.length > 0) {
    const allResourceForms = items.map((item) =>
      getConnectionTypeNeededForItem(item)
    );
    if (new Set(allResourceForms).size > 1) {
      throw new Error('Multiple resource forms not allowed here');
    }
    usedConnectionType = allResourceForms[0];
  }

  if (usedConnectionType === null) {
    throw new Error('Connection type is still null');
  }

  return new SimpleEdge({
    id: uuidGen(),
    connectionType: usedConnectionType as number,
    sourceNode,
    targetNode,
    connectorName,
    sourceNodeAttachmentSide,
    targetNodeAttachmentSide,
    useProvidedAttachmentSides: true,
    externalInteractionManager: sourceNode.getInteractionManager(), // TODO: a hack to pass through the theme
  });
};

export default populateNewEdgeData;
