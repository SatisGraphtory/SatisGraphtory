import { GraphObject } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/interfaces/GraphObject';
import {
  addGraphChildrenFromWithinStateUpdate,
  getChildFromCanvasState,
  getMultiTypedChildrenFromState,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/canvas/childrenApi';
import EdgeTemplate from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';
import { NodeTemplate } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/NodeTemplate';
import { EmptyEdge } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EmptyEdge';
import { getSupportedConnectionTypes } from 'v3/data/loaders/buildings';
import populateNewEdgeData from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/satisgraphtory/populateNewEdgeData';
import { GlobalGraphAppStore } from '../../../stores/GlobalGraphAppStore';
import { ConnectionTypeEnum } from '.DataWarehouse/enums/dataEnums';

export const setHighLightInStateChildren = (
  state: any,
  types: GraphObject[],
  highlightOn: boolean
) => {
  for (const child of getMultiTypedChildrenFromState(state, types)) {
    child.container.setHighLightOn(highlightOn);
  }
};

export const hasEmptyEdgesWithSelectedResource = (
  edges: EdgeTemplate[],
  supportedConnectionTypes: Set<ConnectionTypeEnum>
) => {
  let found = false;

  for (const edge of edges) {
    if (edge instanceof EmptyEdge) {
      if (supportedConnectionTypes.has(edge.connectionType)) {
        found = true;
        break;
      }
    }
  }

  return found;
};

export const resetState = () => () => {};

export const onCancelLink = (
  pixiCanvasStateId: string,
  eventEmitter: any,
  supportedConnectionTypes: Set<ConnectionTypeEnum>,
  selectedEdge: any
) => () => {
  GlobalGraphAppStore.update([
    resetNodes(pixiCanvasStateId),
    setUpLinkInitialState(
      eventEmitter,
      pixiCanvasStateId,
      supportedConnectionTypes,
      selectedEdge
    ),
  ]);
};

export const resetNodes = (pixiCanvasStateId: string) => (sParent: any) => {
  const s = sParent[pixiCanvasStateId];

  for (const child of getMultiTypedChildrenFromState(s, [
    EdgeTemplate,
    NodeTemplate,
  ])) {
    child.container.setHighLightOn(false);
    child.container.alpha = 1;
    child.removeInteractionEvents();
  }
};

export const onStartLink = (pixiCanvasStateId: string, selectedEdge: any) => (
  startLinkId: string
) => {
  GlobalGraphAppStore.update((sParent) => {
    const s = sParent[pixiCanvasStateId];

    const types = ([EdgeTemplate, NodeTemplate] as unknown) as GraphObject[];

    setHighLightInStateChildren(s, types, false);

    const retrievedNode = getChildFromCanvasState(s, startLinkId);

    if (retrievedNode instanceof NodeTemplate) {
      retrievedNode.container.setHighLightOn(true);
    }

    const supportedConnectionTypes = new Set(
      getSupportedConnectionTypes(selectedEdge)
    );

    let hasOutputAvailable = hasEmptyEdgesWithSelectedResource(
      [...retrievedNode.outputConnections, ...retrievedNode.anyConnections],
      supportedConnectionTypes
    );

    if (hasOutputAvailable) {
      // Business as as normal
      for (const child of getMultiTypedChildrenFromState(s, [NodeTemplate])) {
        if (child.id === startLinkId) continue;

        let found = hasEmptyEdgesWithSelectedResource(
          [...child.inputConnections, ...child.anyConnections],
          supportedConnectionTypes
        );

        child.container.alpha = 1;

        if (!found) {
          child.removeInteractionEvents();
          child.container.alpha = 0.2;
        }
      }
    } else {
      // Disable interaction for all other nodes, just so you can't actually click anything.
      for (const child of getMultiTypedChildrenFromState(s, [NodeTemplate])) {
        if (child.id === startLinkId) continue;

        child.removeInteractionEvents();
        child.container.alpha = 0.2;
      }
    }

    s.sourceNodeId = startLinkId;
  });
};

export const onEndLink = (
  pixiCanvasStateId: string,
  eventEmitter: any,
  supportedConnectionTypes: Set<ConnectionTypeEnum>,
  selectedEdge: any
) => (endLinkId: string) => {
  GlobalGraphAppStore.update([
    (sParent) => {
      const s = sParent[pixiCanvasStateId];

      let sourceNode, targetNode;

      for (const child of getMultiTypedChildrenFromState(s, [
        EdgeTemplate,
        NodeTemplate,
      ])) {
        child.container.setHighLightOn(false);
        if (child.id === s.sourceNodeId) {
          sourceNode = child;
        }

        if (child.id === endLinkId) {
          targetNode = child;
        }
      }

      if (!targetNode || !sourceNode) {
        throw new Error('source or target not found');
      }

      const possibleResourceForms = getSupportedConnectionTypes(selectedEdge);

      // TODO: Fix this resource form resolution, maybe from the interface?
      // TODO: items?

      const edge = populateNewEdgeData(
        null,
        possibleResourceForms[0],
        selectedEdge,
        sourceNode,
        targetNode
      );

      addGraphChildrenFromWithinStateUpdate(
        [edge],
        pixiCanvasStateId,
        true
      )(sParent);
    },
    resetNodes(pixiCanvasStateId),
    setUpLinkInitialState(
      eventEmitter,
      pixiCanvasStateId,
      supportedConnectionTypes,
      selectedEdge
    ),
  ]);
};

export const setUpLinkInitialState = (
  eventEmitter: any,
  pixiCanvasStateId: string,
  supportedConnectionTypes: Set<ConnectionTypeEnum>,
  selectedEdge: any
) => (t: any) => {
  const s = t[pixiCanvasStateId];
  for (const child of getMultiTypedChildrenFromState(s, [NodeTemplate])) {
    if (child instanceof NodeTemplate) {
      let selected = hasEmptyEdgesWithSelectedResource(
        [...child.outputConnections, ...child.anyConnections],
        supportedConnectionTypes
      );
      if (selected) {
        child.container.alpha = 1;
        child.getInteractionManager().enableEventEmitter(child.id);
        child.addLinkEvents(
          onStartLink(pixiCanvasStateId, selectedEdge),
          onEndLink(
            pixiCanvasStateId,
            eventEmitter,
            supportedConnectionTypes,
            selectedEdge
          ),
          onCancelLink(
            pixiCanvasStateId,
            eventEmitter,
            supportedConnectionTypes,
            selectedEdge
          )
        );
      } else {
        child.getInteractionManager().enableEventEmitter(child.id);
        child.addLinkEvents(
          null,
          onEndLink(
            pixiCanvasStateId,
            eventEmitter,
            supportedConnectionTypes,
            selectedEdge
          ),
          onCancelLink(
            pixiCanvasStateId,
            eventEmitter,
            supportedConnectionTypes,
            selectedEdge
          )
        );
        child.container.alpha = 0.2;
      }
    }
  }
};
