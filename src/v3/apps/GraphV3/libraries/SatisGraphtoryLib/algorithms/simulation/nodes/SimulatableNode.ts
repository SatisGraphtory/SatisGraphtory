import SimulationManager from '../manager/SimulationManager';
import SimulatableElement from '../SimulatableElement';
import SimulatableLink from '../edges/SimulatableLink';
import { getConnectionTypeNeededForItem } from 'v3/data/loaders/items';
import { MachineNodeTemplate } from '../../../canvas/objects/Node/MachineNodeTemplate';

export default abstract class SimulatableNode extends SimulatableElement {
  inputs: SimulatableLink[] = [];
  outputs: SimulatableLink[] = [];
  anyConnections: SimulatableLink[] = [];

  protected constructor(
    node: MachineNodeTemplate,
    protected buildingSlug: string,
    simulationManager: SimulationManager,
    nodeOptions: Map<string, any>
  ) {
    super(node.id, simulationManager, node, nodeOptions);
  }

  getOutputIdsNeededForItem(itemSlug: string) {
    const connectionTypeNeededForItem = getConnectionTypeNeededForItem(
      itemSlug
    );

    return this.outputs
      .filter((output) => output.connectionType === connectionTypeNeededForItem)
      .map((item) => item.id);
  }
}
