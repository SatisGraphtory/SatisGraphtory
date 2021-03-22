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
  graphic: EdgeTemplate;

  public readonly connectionType: ConnectionTypeEnum;

  protected constructor(
    edge: EdgeTemplate,
    protected connectionName: string,
    simulationManager: SimulationManager
  ) {
    super(edge.id, simulationManager);
    this.graphic = edge;
    this.connectionType = getConnectionTypeForEdge(connectionName);

    // const buildingDefinition = getBuildingDefinition(connectionName);
  }

  abstract addLink(
    sourceSimulatable: SimulatableElement,
    targetSimulatable: SimulatableElement,
    connectorName: string
  ): void;

  getOutputIdsNeededForItem(itemSlug: string) {
    return this.outputs.map((item) => item.id);
  }

  handleEvent(evt: any, time: Big, eventData: any) {}
}
