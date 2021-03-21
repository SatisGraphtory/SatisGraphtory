import SimulationManager from '../manager/SimulationManager';
import SimulatableElement from '../SimulatableElement';
import SimulatableLink from '../edges/SimulatableLink';
import { getConnectionTypeNeededForItem } from 'v3/data/loaders/items';
import { NodeTemplate } from '../../../canvas/objects/Node/NodeTemplate';

export default abstract class SimulatableNode extends SimulatableElement {
  inputs: SimulatableLink[] = [];
  outputs: SimulatableLink[] = [];
  anyConnections: SimulatableLink[] = [];
  graphic: NodeTemplate;

  getOutputIdsNeededForItem(itemSlug: string) {
    const connectionTypeNeededForItem = getConnectionTypeNeededForItem(
      itemSlug
    );

    return this.outputs
      .filter((output) => output.connectionType === connectionTypeNeededForItem)
      .map((item) => item.id);
  }

  protected constructor(
    node: NodeTemplate,
    protected buildingSlug: string,
    simulationManager: SimulationManager
  ) {
    super(node.id, simulationManager);
    this.graphic = node;
  }
}
