import SimulationManager from '../manager/SimulationManager';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import SimulatableNode from './SimulatableNode';
import { NodeTemplate } from '../../../canvas/objects/Node/NodeTemplate';
import Big from 'big.js';

export default class ManufacturerV2 extends SimulatableNode {
  constructor(
    node: NodeTemplate,
    buildingSlug: string,
    nodeOptions: Map<string, any>,
    simulationManager: SimulationManager
  ) {
    super(node, buildingSlug, simulationManager);
    const buildingDefinition = getBuildingDefinition(buildingSlug);
    console.log(buildingDefinition);
  }

  handleEvent(evt: any, time: Big, eventData: any) {}

  runPreSimulationActions(): void {}
}
