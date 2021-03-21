import SimulationManager from '../manager/SimulationManager';
import SimulatableElement from '../SimulatableElement';
import SimulatableNode from '../nodes/SimulatableNode';
import { getConnectionTypeForEdge } from 'v3/data/loaders/buildings';
import { ConnectionTypeEnum } from '.DataWarehouse/enums/dataEnums';

export default abstract class SimulatableLink extends SimulatableElement {
  inputs: SimulatableNode[] = [];
  outputs: SimulatableNode[] = [];
  anyConnections: SimulatableNode[] = [];
  supportedResourceForms = new Set<number>();

  public readonly connectionType: ConnectionTypeEnum;

  protected constructor(
    id: string,
    protected connectionName: string,
    simulationManager: SimulationManager
  ) {
    super(id, simulationManager);

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

  handleEvent(evt: any, time: number, eventData: any) {}
}
