import PIXI from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/PixiProvider';
import { createBackboard } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/Backboard';
import { SatisGraphtoryNodeProps } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/types';
import {
  MACHINE_STYLE,
  NODE_TIER_STYLE,
  OVERCLOCK_STYLE,
  RATE_STYLE,
  RECIPE_STYLE,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/style/textStyles';
import createWrappedText from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/TruncatedText/createWrappedText';
import { getTierText } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/utils/tierUtils';
import createText from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/TruncatedText/createText';

import { createImageIcon } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/ImageIcon';
import { MachineNodeTemplate } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/MachineNodeTemplate';
import { createNodeHighlight } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/NodeHighlight';
import { EResourcePurity } from '.DataLanding/interfaces/enums';

import {
  getBuildingName,
  getClassNameForBuildableMachine,
} from 'v3/data/loaders/buildings';
// import { createBadge } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/Badge';
import {
  EFFICIENCY_OFFSET_X,
  EFFICIENCY_OFFSET_Y,
  HIGHLIGHT_OFFSET_X,
  HIGHLIGHT_OFFSET_Y,
  MACHINE_NAME_OFFSET_X,
  MACHINE_NAME_OFFSET_Y,
  MACHINE_OFFSET_X,
  MACHINE_OFFSET_Y,
  RECIPE_OFFSET_X,
  RECIPE_OFFSET_Y,
  RECIPE_ICON_SIZE,
  RECIPE_ICON_OFFSET_X,
  RECIPE_ICON_OFFSET_Y,
  TIER_OFFSET_X,
  TIER_OFFSET_Y,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Offsets';
import {
  GRID_SIZE,
  MACHINE_SIZE,
  NODE_HEIGHT,
  NODE_WIDTH,
  OUTLINE_THICKNESS,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Sizes';
import {
  calculateConnectionNodeOffset,
  Dot,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/Dot';
import { Events } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Events';
import initializeMap from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/utils/initializeMap';
import EdgeTemplate, {
  EdgeType,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';
import { GraphObject } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/interfaces/GraphObject';
import {
  optimizeSidesFunction,
  rearrangeEdgesFunction,
  updateChildrenFunction,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/satisgraphtory/layout/graphLayout';
import { EdgeAttachmentSide } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeAttachmentSide';
import {
  GlobalGraphAppStore,
  triggerCanvasUpdateFunction,
} from '../../../stores/GlobalGraphAppStore';
import { ConnectionTypeEnum } from '.DataWarehouse/enums/dataEnums';
import { getEnumValue } from 'v3/data/loaders/enums';
import resolveMathValue from '../../../../../components/Selectors/resolveMathValue';
import { Fraction, typeOf } from 'mathjs';
import { OutlineFilter } from '@pixi/filter-outline';
import Colors from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/consts/Colors';

export default class AdvancedNode extends MachineNodeTemplate {
  connectionsMap: Map<EdgeAttachmentSide, EdgeTemplate[]> = new Map();
  connectionsDirectionMap: Map<EdgeTemplate, EdgeType> = new Map();
  connectionsContainer: PIXI.Container = new PIXI.Container();

  rateText: PIXI.BitmapText;
  recipeText: PIXI.Text | undefined;
  recipeTexture: any | undefined;
  extractedItemText: PIXI.Text | undefined;
  efficiencyText: PIXI.Text | undefined;
  levelText: PIXI.Text | undefined;
  machineText: PIXI.Text | undefined;
  machineTexture: any | undefined;

  constructor(props: SatisGraphtoryNodeProps) {
    super(props);

    const { machineName } = props;

    const container = this.container;

    container.setHighLightObject(
      createNodeHighlight(HIGHLIGHT_OFFSET_X, HIGHLIGHT_OFFSET_Y)
    );
    this.container.addChild(this.container.getHighLight());
    this.container.setHighLightOn(false);

    const machineType = getClassNameForBuildableMachine(machineName)!;

    container.boundCalculator = createBackboard(0, 0, machineType);
    container.addChild(container.boundCalculator);

    const theme = this.getInteractionManager().getTheme();

    this.rateText = createText(
      '',
      RATE_STYLE(theme),
      NODE_WIDTH / 2,
      NODE_HEIGHT + 60,
      'center',
      'center',
      true
    );

    container.addChild(this.rateText);

    this.runAdditionalDataUpdateActions();

    this.recalculateConnections();

    container.addChild(this.connectionsContainer);
  }

  rate = -1;

  updateDisplay(rateText: number) {
    if (this.rate !== rateText) {
      this.rate = rateText;
      this.rateText.text = `${rateText.toFixed(2)} items/minute`;
    }
  }

  resetDisplay() {
    this.rate = -1;
    this.rateText.text = '';
  }

  eventFunctions = new Map<string, any[]>();

  recalculateConnections(rearrange = false) {
    if (rearrange) {
      this.optimizeSides();
    }

    this.connectionsMap.clear();
    this.connectionsOffsetMap.clear();
    this.connectionsContainer.removeChildren();

    for (const anyEdge of this.anyConnections) {
      let side;
      if (anyEdge.sourceNode === this) {
        side = anyEdge.sourceNodeAttachmentSide;
      } else if (anyEdge.targetNode === this) {
        side = anyEdge.targetNodeAttachmentSide;
      } else {
        // It's an empty node, do something!!!
        side = anyEdge.targetNodeAttachmentSide;
      }
      let connectionsArray: EdgeTemplate[] = [];
      if (this.connectionsMap.get(side)) {
        connectionsArray = this.connectionsMap.get(side)!;
      }
      connectionsArray.push(anyEdge);
      this.connectionsMap.set(side, connectionsArray);
      this.connectionsDirectionMap.set(anyEdge, EdgeType.ANY);
    }

    for (const inputEdge of this.inputConnections) {
      const side = inputEdge.targetNodeAttachmentSide;
      let connectionsArray: EdgeTemplate[] = [];
      if (this.connectionsMap.get(side)) {
        connectionsArray = this.connectionsMap.get(side)!;
      }
      connectionsArray.push(inputEdge);
      this.connectionsMap.set(side, connectionsArray);
      this.connectionsDirectionMap.set(inputEdge, EdgeType.INPUT);
    }

    for (const outputEdge of this.outputConnections) {
      const side = outputEdge.sourceNodeAttachmentSide;
      let connectionsArray: EdgeTemplate[] = [];
      if (this.connectionsMap.get(side)) {
        connectionsArray = this.connectionsMap.get(side)!;
      }
      connectionsArray.push(outputEdge);
      this.connectionsMap.set(side, connectionsArray);
      this.connectionsDirectionMap.set(outputEdge, EdgeType.OUTPUT);
    }

    for (const [side, edges] of this.connectionsMap.entries()) {
      switch (side) {
        case EdgeAttachmentSide.TOP:
        case EdgeAttachmentSide.BOTTOM:
          let y = side === EdgeAttachmentSide.TOP ? 0 : NODE_HEIGHT;
          const yFunc1 = () => y;
          const xFunc1 = (offset: number[], i: number) => offset[i];
          this.recalculateEdgesForSide(side, edges, NODE_WIDTH, xFunc1, yFunc1);
          break;
        case EdgeAttachmentSide.LEFT:
        case EdgeAttachmentSide.RIGHT:
          let x = side === EdgeAttachmentSide.LEFT ? 0 : NODE_WIDTH;
          const xFunc2 = () => x;
          const yFunc2 = (offset: number[], i: number) => offset[i];
          this.recalculateEdgesForSide(
            side,
            edges,
            NODE_HEIGHT,
            xFunc2,
            yFunc2
          );
          break;
        default:
          throw new Error('Unknown side ' + side);
      }
    }
  }

  public optimizeSides() {
    // Optimize one pass by the node location, then optimize by edge
    for (const edge of [
      ...this.inputConnections,
      ...this.outputConnections,
      ...this.anyConnections,
    ]) {
      const isSource = edge.sourceNode === this;
      if (!edge.sourceNode && !edge.targetNode) continue;
      if (!edge.sourceNode || !edge.targetNode) {
        console.log(edge);
        throw new Error('One of the edge sides are null');
      }

      let otherNode = isSource ? edge.targetNode : edge.sourceNode;

      let x = this.container.x - otherNode?.container?.x;
      let y = this.container.y - otherNode?.container?.y;

      if (!isNaN(x) && !isNaN(y)) {
        let theta = Math.atan2(y, x); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degrees, range (-180, 180]

        let property = 'targetNodeAttachmentSide';
        if (isSource) {
          property = 'sourceNodeAttachmentSide';
        }

        if (theta <= 45 && theta >= -45) {
          (edge as any)[property] = EdgeAttachmentSide.LEFT;
        } else if (theta > 45 && theta < 135) {
          (edge as any)[property] = EdgeAttachmentSide.TOP;
        } else if (theta > -135 && theta < -45) {
          (edge as any)[property] = EdgeAttachmentSide.BOTTOM;
        } else {
          (edge as any)[property] = EdgeAttachmentSide.RIGHT;
        }
      }
    }

    this.recalculateConnections();
  }

  private getEdgeAngle(edge: EdgeTemplate, useNodeCoordinate = false) {
    const isSource = edge.sourceNode === this;
    if (!edge.sourceNode && !edge.targetNode) return Infinity;
    if (!edge.sourceNode || !edge.targetNode) {
      throw new Error('One of the edge sides are null');
    }

    let otherNode = isSource ? edge.targetNode : edge.sourceNode;

    let x1;
    let y1;

    if (useNodeCoordinate) {
      // TODO: Abstract this to be part of the context.
      x1 = this.container.x + NODE_WIDTH / 2;
      y1 = this.container.y + NODE_HEIGHT / 2;
    } else {
      const { x, y } = this.getConnectionCoordinate(edge);
      x1 = x;
      y1 = y;
    }

    const { x: x2, y: y2 } = otherNode.getConnectionCoordinate(edge);

    let x = x1 - x2;
    let y = y1 - y2;

    if (!isNaN(x) && !isNaN(y)) {
      let theta = Math.atan2(y, x); // range (-PI, PI]
      theta *= 180 / Math.PI; // rads to degs, range (-180, 180]

      if (theta < 0) {
        theta = 360 + theta;
      }

      let property = 'targetNodeAttachmentSide';
      if (isSource) {
        property = 'sourceNodeAttachmentSide';
      }

      switch ((edge as any)[property]) {
        case EdgeAttachmentSide.LEFT:
          theta += 180;
          theta = theta % 360;
          theta = 360 - theta;
          break;
        case EdgeAttachmentSide.RIGHT:
          break;
        case EdgeAttachmentSide.TOP:
          theta += 90;
          theta = theta % 360;
          break;
        case EdgeAttachmentSide.BOTTOM:
          theta += 270;
          theta = theta % 360;
          theta = 360 - theta;
          break;
        default:
          throw new Error('Unhandled side ' + (edge as any)[property]);
      }

      return theta;
    } else {
      throw new Error('X or Y are NaN ' + this.id);
    }
  }
  public rearrangeEdges(edges: EdgeTemplate[]) {
    const allNodes = new Set<MachineNodeTemplate>();
    edges.sort((a, b) => {
      if (a.sourceNode && a.targetNode) {
        allNodes.add(a.sourceNode);
        allNodes.add(a.targetNode);
      }

      if (b.sourceNode && b.targetNode) {
        allNodes.add(b.sourceNode);
        allNodes.add(b.targetNode);
      }

      return this.getEdgeAngle(a, true) - this.getEdgeAngle(b, true);
    });

    for (const node of allNodes) {
      node.recalculateConnections();
    }
  }

  private recalculateEdgesForSide(
    side: EdgeAttachmentSide,
    edges: EdgeTemplate[],
    length: number,
    xFunc: Function,
    yFunc: Function
  ) {
    const offsets = calculateConnectionNodeOffset(edges, length);
    this.connectionsOffsetMap.set(side, offsets);

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      this.connectionsIndexMap.set(edge, i);
      this.connectionsSideMap.set(edge, side);

      const direction = this.connectionsDirectionMap.get(edge)!;

      let dotTexture;

      switch (edge.connectionType) {
        case ConnectionTypeEnum.AFGBuildablePipeline:
          if (direction === EdgeType.INPUT) {
            dotTexture = PIXI.utils.TextureCache['inRectangle'];
          } else if (direction === EdgeType.OUTPUT) {
            dotTexture = PIXI.utils.TextureCache['outRectangle'];
          } else if (direction === EdgeType.ANY) {
            dotTexture = PIXI.utils.TextureCache['anyRectangle'];
          }
          break;
        case ConnectionTypeEnum.AFGBuildableConveyorBelt:
        default:
          if (direction === EdgeType.INPUT) {
            dotTexture = PIXI.utils.TextureCache['inCircle'];
          } else if (direction === EdgeType.OUTPUT) {
            dotTexture = PIXI.utils.TextureCache['outCircle'];
          } else if (direction === EdgeType.ANY) {
            dotTexture = PIXI.utils.TextureCache['anyRectangle'];
          }
      }

      const dot = Dot(dotTexture, xFunc(offsets, i), yFunc(offsets, i));
      this.connectionsContainer.addChild(dot);
    }
  }

  delete() {
    const ret = super.delete();
    this.recalculateConnections();
    return ret;
  }

  removeInteractionEvents() {
    const container = this.container;

    container.interactive = false;
    container.buttonMode = false;
    container.off('click');
    container.off('pointerdown');
    container.off('pointerup');
    container.off('pointerupoutside');
    container.off('pointermove');

    const interactionManager = this.getInteractionManager();

    if (!interactionManager.eventEmitterEnabled(this.id)) {
      return;
    }

    for (const [name, events] of this.eventFunctions.entries()) {
      for (const event of events) {
        interactionManager.getEventEmitter().removeListener(name, event, this);
      }
    }

    this.eventFunctions = new Map();
    interactionManager.disableEventEmitter(this.id);
  }

  addSelectEvents(onSelectObjects: (ids: string[]) => any) {
    const container = this.addContainerHitArea();

    container.on('pointerdown', function (this: any, event: any) {
      event.stopPropagation();
    });

    container.on('click', function (this: any, event: any) {
      event.stopPropagation();
      onSelectObjects([container.id]);
    });
  }

  addEvent(event: string, functionToAdd: any) {
    initializeMap<string, any[]>(this.eventFunctions, event, []);
    this.eventFunctions.get(event)!.push(functionToAdd);

    this.getInteractionManager()
      .getEventEmitter()
      .addListener(event, functionToAdd, this);
  }

  addLinkEvents(startFunc: Function, endFunc: Function, cancelFunc: Function) {
    // Drag Pointer Down Start

    let linkStarted: GraphObject | null = null;

    function linkPointerDownSourceNode(
      this: any,
      triggerSource: any,
      ignoreEventIfLinkNotStarted: boolean
    ) {
      if (linkStarted) {
        if (linkStarted === this && this === triggerSource) {
          cancelFunc();
          linkStarted = null;
        } else {
          if (triggerSource === this) {
            endFunc(this.id);
          }

          linkStarted = null;
        }
      } else {
        if (!ignoreEventIfLinkNotStarted) {
          linkStarted = triggerSource;

          if (triggerSource === this && startFunc) {
            startFunc(this.id);
          }
        }
      }
    }

    this.addEvent(Events.NodePointerDown, linkPointerDownSourceNode);

    const container = this.addContainerHitArea();

    const context = this;
    const nodeEventEmitter = this.getInteractionManager().getEventEmitter();

    container.on('pointerdown', function (this: any, event: any) {
      event.stopPropagation();
      nodeEventEmitter.emit(
        Events.NodePointerDown,
        context,
        startFunc === null
      );
    });
  }

  addDragEvents(opts?: { snapToGrid?: boolean; autoShuffleEdge?: boolean }) {
    const container = this.addContainerHitArea();

    let dragging = false;
    let dragLeader = false;
    let sourceX = 0;
    let sourceY = 0;
    let clickX = 0;
    let clickY = 0;

    const context = this;
    const nodeEventEmitter = this.getInteractionManager().getEventEmitter();
    const pixiCanvasStateId = this.getInteractionManager().getCanvasId();

    // Drag Functions Start

    // Drag Pointer Down Start
    function dragPointerDownFunction(
      this: any,
      triggerSource: any,
      newPos: PIXI.ObservablePoint,
      moveAllHighlightedArg: boolean
    ) {
      if (
        triggerSource === this ||
        (moveAllHighlightedArg && this.container.highLight.visible)
      ) {
        clickX = newPos.x;
        clickY = newPos.y;
        sourceX = container.position.x;
        sourceY = container.position.y;
        dragging = true;
      }
    }

    this.addEvent(Events.NodePointerDown, dragPointerDownFunction);

    let moveAllHighlighted = false;

    container.on('pointerdown', function (this: any, event: any) {
      event.stopPropagation();
      const newPos = event.data.getLocalPosition(this.parent);
      moveAllHighlighted = this.highLight.visible;
      nodeEventEmitter.emit(
        Events.NodePointerDown,
        context,
        newPos,
        moveAllHighlighted
      );
      dragLeader = true;
    });

    // Drag Pointer Up Start
    function dragPointerUpFunction(
      this: any,
      triggerSource: any,
      moveAllHighlightedArg: boolean
    ) {
      if (triggerSource === this || moveAllHighlightedArg) {
        dragging = false;
        dragLeader = false;
        if (opts?.snapToGrid) {
          container.position.x =
            Math.round(container.position.x / GRID_SIZE) * GRID_SIZE;
          container.position.y =
            Math.round(container.position.y / GRID_SIZE) * GRID_SIZE;
        }

        updateEdges();

        // Only run this once
        if (opts?.autoShuffleEdge) {
          GlobalGraphAppStore.update([
            optimizeSidesFunction(pixiCanvasStateId),
            rearrangeEdgesFunction(pixiCanvasStateId),
            updateChildrenFunction(pixiCanvasStateId),
            triggerCanvasUpdateFunction(pixiCanvasStateId),
          ]);
        }
      }
    }

    this.addEvent(Events.NodePointerUp, dragPointerUpFunction);

    container.on('pointerup', function (this: any) {
      nodeEventEmitter.emit(Events.NodePointerUp, context, moveAllHighlighted);
    });

    container.on('pointerupoutside', function (this: any) {
      nodeEventEmitter.emit(Events.NodePointerUp, context, moveAllHighlighted);
    });

    // Drag Pointer Move Start
    const updateEdges = this.updateEdges;

    function dragPointerMoveFunction(
      this: any,
      triggerSource: any,
      deltaX: number,
      deltaY: number,
      moveAllHighlightedArg: boolean
    ) {
      if (dragging && (triggerSource === this || moveAllHighlightedArg)) {
        container.position.x = sourceX + deltaX;
        container.position.y = sourceY + deltaY;
        updateEdges();
      }
    }

    this.addEvent(Events.NodePointerMove, dragPointerMoveFunction);

    container.on('pointermove', function (this: any, event: any) {
      if (dragLeader && dragging) {
        event.stopPropagation();
        const newPos = event.data.getLocalPosition(this.parent);
        const deltaX = newPos.x - clickX;
        const deltaY = newPos.y - clickY;
        nodeEventEmitter.emit(
          Events.NodePointerMove,
          context,
          deltaX,
          deltaY,
          moveAllHighlighted
        );
      }
    });

    return [];
  }

  private addContainerHitArea() {
    const container = this.container;

    container.interactive = true;
    container.buttonMode = true;
    if (container.hitArea?.destroy) {
      container.hitArea.destroy();
    }
    container.hitArea = new PIXI.Rectangle(0, 0, NODE_WIDTH, NODE_HEIGHT);

    return container;
  }

  runAdditionalDataUpdateActions(): void {
    const theme = this.getInteractionManager().getTheme();
    const container = this.container;

    if (this.additionalData.has('recipe')) {
      if (this.recipeText) {
        this.recipeText.text = this.translateFunction(
          this.additionalData.get('recipe')!
        );
      } else {
        this.recipeText = createWrappedText(
          this.translateFunction(this.additionalData.get('recipe')!),
          NODE_WIDTH,
          RECIPE_STYLE(NODE_WIDTH, theme),
          RECIPE_OFFSET_X,
          RECIPE_OFFSET_Y,
          'center',
          'top'
        );

        container.addChild(this.recipeText);
      }
    } else if (this.additionalData.has('extractedItem')) {
      let purity = '';
      if (this.additionalData.has('nodePurity')) {
        purity = this.translateFunction(
          getEnumValue(this.additionalData.get('nodePurity'), EResourcePurity)
        );
      }

      const item = this.translateFunction(
        this.additionalData.get('extractedItem')!
      );
      const stringParts = [purity, item];
      const extractedItemTextString = stringParts.join(' ');

      if (!this.extractedItemText) {
        this.extractedItemText = createWrappedText(
          extractedItemTextString,
          NODE_WIDTH,
          RECIPE_STYLE(NODE_WIDTH, theme),
          RECIPE_OFFSET_X,
          RECIPE_OFFSET_Y,
          'center',
          'top'
        );

        container.addChild(this.extractedItemText);
      } else {
        this.extractedItemText.text = extractedItemTextString;
      }
    }

    if (this.additionalData.has('overclock')) {
      const overclockValue = resolveMathValue(
        this.additionalData.get('overclock')
      );

      if (overclockValue === undefined)
        throw new Error('Could not resolve overclock ' + overclockValue);

      let overclockTextValue;

      if (typeOf(overclockValue) === 'Fraction') {
        const overclock = overclockValue as Fraction;
        if (overclock?.d === 1) {
          overclockTextValue = overclock.n * overclock.s;
        } else {
          overclockTextValue = `${overclock.n * overclock.s}/${overclock.d}`;
        }
      } else {
        throw new Error('Unknown overclock ' + overclockValue);
      }

      if (this.efficiencyText) {
        this.efficiencyText.text = `${overclockTextValue}%`;
      } else {
        this.efficiencyText = createText(
          `${overclockTextValue}%`,
          OVERCLOCK_STYLE(theme),
          EFFICIENCY_OFFSET_X,
          EFFICIENCY_OFFSET_Y,
          'right',
          'center',
          true
        );

        container.addChild(this.efficiencyText);
      }
    }

    if (this.additionalData.has('machineType')) {
      if (this.levelText) {
        this.levelText.text = getTierText(this.tier);
      } else {
        this.levelText = createText(
          getTierText(this.tier),
          NODE_TIER_STYLE(theme),
          TIER_OFFSET_X,
          TIER_OFFSET_Y,
          'left',
          'center',
          true
        );

        container.addChild(this.levelText);
      }

      const machineLabel = getBuildingName(this.machineName) as string;

      if (this.machineText) {
        this.machineText.text = machineLabel;
      } else {
        this.machineText = createText(
          machineLabel,
          MACHINE_STYLE(theme),
          MACHINE_NAME_OFFSET_X,
          MACHINE_NAME_OFFSET_Y,
          'center',
          'center',
          true
        );

        container.addChild(this.machineText);
      }

      const machineTextureImage = PIXI.utils.TextureCache[this.machineName];

      if (this.machineTexture) {
        const removedChild = container.removeChild(this.machineTexture);
        if (!removedChild)
          throw new Error('Did not remove child machine texture');
      }
      this.machineTexture = createImageIcon(
        machineTextureImage,
        MACHINE_SIZE,
        MACHINE_SIZE,
        MACHINE_OFFSET_X,
        MACHINE_OFFSET_Y
      );

      container.addChild(this.machineTexture);

      const recipeTextureImage =
        PIXI.utils.TextureCache[this.additionalData.get('extractedItem')];
      console.log(this.additionalData);
      console.log(PIXI.utils.TextureCache);

      if (this.recipeTexture) {
        const removedChild = container.removeChild(this.recipeTexture);
        if (!removedChild)
          throw new Error('Did not remove child recipe texture');
      }
      this.recipeTexture = createImageIcon(
        recipeTextureImage,
        RECIPE_ICON_SIZE,
        RECIPE_ICON_SIZE,
        RECIPE_ICON_OFFSET_X,
        RECIPE_ICON_OFFSET_Y
      );

      this.recipeTexture.filters = [
        new OutlineFilter(OUTLINE_THICKNESS, Colors.WHITE),
      ];

      container.addChild(this.recipeTexture);
    }
  }
}
