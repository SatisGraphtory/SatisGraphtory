import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import SimulatableLink from './SimulatableLink';
import SimulatableNode from '../nodes/SimulatableNode';
import { OutputPacket } from '../SimulatableElement';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import Big from 'big.js';

export default class BeltV2 extends SimulatableLink {
  constructor(
    id: string,
    beltSlug: string,
    simulationManager: SimulationManager
  ) {
    super(id, beltSlug, simulationManager);

    const buildingDefinition = getBuildingDefinition(beltSlug);

    this.cycleTime = Big(60 * 1000).div(Big(buildingDefinition.mSpeed / 2));
  }

  cycleTime: Big;

  addLink(
    sourceSimulatable: SimulatableNode,
    targetSimulatable: SimulatableNode,
    connectorName: string
  ) {
    sourceSimulatable.outputs.push(this);
    this.inputs.push(sourceSimulatable);
    targetSimulatable.inputs.push(this);
    this.outputs.push(sourceSimulatable);
  }

  runPreSimulationActions(): void {
    this.inputSlot = this.inputs.map(() => null);
  }

  inputSlot: (OutputPacket | null)[] = [];
  outputSlot: (OutputPacket | null)[] = [];

  getIsOutputsBlocked() {
    return this.outputSlot[0] !== null;
  }

  handleEvent(evt: SimulatableAction, time: Big, eventData: any) {
    if (evt === SimulatableAction.RESOURCE_AVAILABLE) {
      this.simulationManager.addTimerEvent({
        time: time,
        priority: Priority.VERY_HIGH,
        event: {
          target: eventData,
          eventName: SimulatableAction.TRANSFER_ITEM,
          eventData: {
            connectorId: this.id,
            freeSlotArray: this.inputSlot,
          },
        },
      });
    } else if (SimulatableAction.RESOURCE_DEPOSITED) {
      console.log('DEPOSITED');
    }
  }
}
