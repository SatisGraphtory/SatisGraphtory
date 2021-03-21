import { OutputPacket } from '../SimulatableElement';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import SimulatableNode from './SimulatableNode';
import { NodeTemplate } from '../../../canvas/objects/Node/NodeTemplate';
import Big from 'big.js';

export default class ResourceExtractorV2 extends SimulatableNode {
  cycleTime: Big = Big(0);
  outputPacket: OutputPacket | null = null;

  constructor(
    node: NodeTemplate,
    buildingSlug: string,
    nodeOptions: Map<string, any>,
    simulationManager: SimulationManager
  ) {
    super(node, buildingSlug, simulationManager);

    const buildingDefinition = getBuildingDefinition(buildingSlug);
    this.cycleTime = Big(buildingDefinition.mExtractCycleTime).mul(Big(1000));
    if (nodeOptions.has('extractedItem')) {
      this.outputPacket = {
        slug: nodeOptions.get('extractedItem'),
        amount: buildingDefinition.mItemsPerCycle,
      };
    }
    //TODO: factor in overclock AND purity.
  }

  outputSlot: OutputPacket | null = null;

  getIsOutputsBlocked() {
    return this.outputSlot !== null;
  }

  depositTimes: number[] = [];

  updateDisplay(itemRate: number) {
    this.graphic.updateDisplay(itemRate);
  }

  reset() {
    this.graphic.resetDisplay();
  }

  trackDepositEvent(time: number) {
    if (this.depositTimes.length === 21) {
      this.depositTimes.shift();
    }

    this.depositTimes.push(time);

    if (this.depositTimes.length === 21) {
      const firstTime = this.depositTimes[0];
      const lastTime = this.depositTimes[this.depositTimes.length - 1];
      const timeDelta = lastTime - firstTime;
      const itemRate = (20 / (timeDelta / 1000)) * 60;
      this.updateDisplay(itemRate);
    }
  }

  handleEvent(evt: SimulatableAction, time: Big, eventData: any) {
    if (evt === SimulatableAction.DEPOSIT_OUTPUT) {
      this.trackDepositEvent(time.toNumber());
      if (this.getIsOutputsBlocked()) {
        console.log('BLOCKED');
        // wait until output unblocked.
        // Then, send the pull event to the consumers and
        // INSTANTLY submit a delayed DEPOSIT_OUTPUT event.
      } else {
        if (!this.outputs.length) {
          // how to handle this?
          //TODO? Is this something we should make fill up?
          //for now just ignore and whistle on. Don't bother doing anything
        } else {
          if (this.outputPacket) {
            const getOutputIdsNeededForItem = this.getOutputIdsNeededForItem(
              this.outputPacket.slug
            );
            for (const outputId of getOutputIdsNeededForItem) {
              this.simulationManager.addTimerEvent({
                time: time,
                priority: Priority.VERY_HIGH,
                event: {
                  target: outputId,
                  eventName: SimulatableAction.RESOURCE_AVAILABLE,
                  eventData: this.id,
                },
              });
            }
            this.outputSlot = this.outputPacket;
          }
        }
        // Then, send the pull event to the consumers and BLOCK our output.
        // Instantly submit a delayed DEPOSIT_OUTPUT event.
      }
    } else if (evt === SimulatableAction.TRANSFER_ITEM) {
      if (this.outputSlot) {
        const { freeSlotArray, connectorId } = eventData;
        freeSlotArray[0] = this.outputSlot;
        this.outputSlot = null;
        this.simulationManager.addTimerEvent({
          time: time,
          priority: Priority.CRITICAL, // should this be critical?
          event: {
            target: connectorId,
            eventName: SimulatableAction.RESOURCE_DEPOSITED,
          },
        });
        this.addDelayedSelfAction(
          SimulatableAction.DEPOSIT_OUTPUT,
          time.add(this.cycleTime),
          Priority.CRITICAL
        );
      }
    }
  }

  runPreSimulationActions(): void {
    if (this.outputs.length > 1)
      throw new Error('Improper resource extractor with multiple outputs');

    this.depositTimes = [];
    this.outputSlot = null;

    if (true) {
      this.addDelayedSelfAction(
        SimulatableAction.DEPOSIT_OUTPUT,
        this.cycleTime,
        Priority.CRITICAL
      );
    }
  }
}
