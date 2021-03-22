import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import SimulatableNode from './SimulatableNode';
import { NodeTemplate } from '../../../canvas/objects/Node/NodeTemplate';
import Big from 'big.js';
import { OutputPacket } from '../SimulatableElement';

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

  inputSlot: (OutputPacket | null)[] = [null];
  outputSlot: (OutputPacket | null)[] = [null];

  depositTimes: Big[] = [];

  updateDisplay(itemRate: number) {
    this.graphic.updateDisplay(itemRate);
  }

  reset() {
    this.graphic.resetDisplay();
  }

  trackDepositEvent(time: Big) {
    if (this.depositTimes.length === 21) {
      this.depositTimes.shift();
    }

    this.depositTimes.push(time);

    if (this.depositTimes.length === 21) {
      const firstTime = this.depositTimes[0];
      const lastTime = this.depositTimes[this.depositTimes.length - 1];
      const timeDelta = lastTime.minus(firstTime);
      const itemRate = Big(20 * 60 * 1000).div(timeDelta);
      this.updateDisplay(itemRate.toNumber());
    }
  }

  handleEvent(evt: SimulatableAction, time: Big, eventData: any) {
    if (evt === SimulatableAction.RESOURCE_AVAILABLE) {
      this.simulationManager.addTimerEvent({
        time: time,
        priority: Priority.VERY_HIGH,
        event: {
          target: eventData,
          eventName: SimulatableAction.TRANSFER_ITEM_TO_NEXT,
          eventData: {
            connectorId: this.id,
            freeSlotArray: this.inputSlot,
          },
        },
      });
    } else if (evt === SimulatableAction.RESOURCE_DEPOSITED) {
    } else {
      throw new Error('Unhandled event: ' + evt);
    }
  }

  runPreSimulationActions(): void {
    this.depositTimes = [];
    this.inputSlot = [null];
    this.outputSlot = [null];
  }
}
