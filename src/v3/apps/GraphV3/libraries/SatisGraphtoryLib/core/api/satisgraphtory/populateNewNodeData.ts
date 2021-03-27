import uuidGen from 'v3/utils/stringUtils';
import {
  getAnyConnectionsForBuilding,
  getInputsForBuilding,
  getOutputsForBuilding,
} from 'v3/data/loaders/buildings';
import AdvancedNode from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/AdvancedNode';
import {
  NODE_HEIGHT,
  NODE_WIDTH,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Sizes';
import ExternalInteractionManager from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/interfaces/ExternalInteractionManager';
import { EmptyEdge } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EmptyEdge';
import produce from 'immer';

const populateNewNodeData = (
  x: number,
  y: number,
  translateFunction: (arg0: string) => string,
  externalInteractionManager: ExternalInteractionManager,
  nodeStampOptions: any
) => {
  const buildingSlug = nodeStampOptions?.machineType?.value;

  const additionalBuildingProps = produce(
    nodeStampOptions,
    (draftState: any) => {
      for (const remainingKey of Object.keys(draftState)) {
        draftState[remainingKey] = draftState[remainingKey].value;
      }
    }
  );

  return new AdvancedNode({
    position: {
      x: x - Math.floor(NODE_WIDTH / 2),
      y: y - Math.floor(NODE_HEIGHT / 2),
    },
    id: uuidGen(),
    translateFunction,
    machineName: buildingSlug,
    inputConnections: getInputsForBuilding(
      buildingSlug,
      externalInteractionManager
    ).map((props) => new EmptyEdge(props)),
    outputConnections: getOutputsForBuilding(
      buildingSlug,
      externalInteractionManager
    ).map((props) => new EmptyEdge(props)),
    anyConnections: getAnyConnectionsForBuilding(
      buildingSlug,
      externalInteractionManager
    ).map((props) => new EmptyEdge(props)),
    externalInteractionManager,
    additionalData: additionalBuildingProps,
  });
};

export default populateNewNodeData;
