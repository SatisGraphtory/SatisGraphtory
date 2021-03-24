import SimulationManager from '../manager/SimulationManager';
import SimulatableElement from '../SimulatableElement';
import SimulatableNode from '../nodes/SimulatableNode';
import { getConnectionTypeForEdge } from 'v3/data/loaders/buildings';
import { ConnectionTypeEnum } from '.DataWarehouse/enums/dataEnums';
import Big from 'big.js';
import EdgeTemplate from '../../../canvas/objects/Edge/EdgeTemplate';

export default abstract class SimulatableLink extends SimulatableElement {
  inputs: SimulatableNode[] = [];
  outputs: SimulatableNode[] = [];
  anyConnections: SimulatableNode[] = [];
  supportedResourceForms = new Set<number>();

  public readonly connectionType: ConnectionTypeEnum;

  protected constructor(
    edge: EdgeTemplate,
    protected connectionName: string,
    simulationManager: SimulationManager,
    edgeOptions: Map<string, any>
  ) {
    super(edge.id, simulationManager, edge, edgeOptions);
    this.connectionType = getConnectionTypeForEdge(connectionName);
  }

  addLink(
    sourceSimulatable: SimulatableNode,
    targetSimulatable: SimulatableNode,
    connectorName: string
  ) {
    sourceSimulatable.outputs.push(this);
    this.inputs.push(sourceSimulatable);
    targetSimulatable.inputs.push(this);
    this.outputs.push(targetSimulatable);
  }

  removeLinks() {
    for (const sourceSimulatable of this.inputs) {
      const occurrences = sourceSimulatable.outputs.filter(
        (item) => item === this
      ).length;
      for (let j = 0; j < occurrences; j++) {
        for (let i = 0; i < sourceSimulatable.outputs.length; i++) {
          if (sourceSimulatable.outputs[i] === this) {
            sourceSimulatable.outputs.splice(i, 1);
            break;
          }
        }
      }
    }

    for (const targetSimulatable of this.outputs) {
      const occurrences = targetSimulatable.inputs.filter(
        (item) => item === this
      ).length;
      for (let j = 0; j < occurrences; j++) {
        for (let i = 0; i < targetSimulatable.inputs.length; i++) {
          if (targetSimulatable.inputs[i] === this) {
            targetSimulatable.inputs.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  getOutputIdsNeededForItem(itemSlug: string) {
    return this.outputs.map((item) => item.id);
  }

  handleEvent(evt: any, time: Big, eventData: any) {}
}
