import SimulatableNode from './SimulatableNode';
import Big from 'big.js';
import { MachineNodeTemplate } from '../../../canvas/objects/Node/MachineNodeTemplate';
import SimulationManager from '../manager/SimulationManager';

export default class DebugNode extends SimulatableNode {
  constructor(
    node: MachineNodeTemplate,
    buildingSlug: string,
    nodeOptions: Map<string, any>,
    simulationManager: SimulationManager
  ) {
    super(node, buildingSlug, simulationManager, nodeOptions);
  }

  handleEvent(evt: any, time: Big, eventData: any): any {}
}
