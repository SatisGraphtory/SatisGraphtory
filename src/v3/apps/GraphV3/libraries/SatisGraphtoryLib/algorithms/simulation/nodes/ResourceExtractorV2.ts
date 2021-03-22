import { OutputPacket } from '../SimulatableElement';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import SimulatableNode from './SimulatableNode';
import { NodeTemplate } from '../../../canvas/objects/Node/NodeTemplate';
import Big from 'big.js';
import { EResourcePurity } from '../../../../../../../../.DataLanding/interfaces/enums';

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
      let purityMultiplier = 1;

      if (nodeOptions.has('nodePurity')) {
        switch (nodeOptions.get('nodePurity')) {
          case EResourcePurity.RP_Inpure:
            purityMultiplier = 0.5;
            break;
          case EResourcePurity.RP_Pure:
            purityMultiplier = 2;
            break;
        }
      }

      this.outputPacket = {
        slug: nodeOptions.get('extractedItem'),
        amount: buildingDefinition.mItemsPerCycle * purityMultiplier,
      };
    }

    this.setDepositTrackingLength(
      buildingDefinition?.mNumCyclesForProductivity || 20
    );
  }

  outputSlot: (OutputPacket | null)[] = [null];

  getIsOutputsBlocked() {
    return this.outputSlot[0] !== null;
  }

  updateDisplay(itemRate: number) {
    this.graphic.updateDisplay(itemRate);
  }

  reset() {
    this.graphic.resetDisplay();
  }

  depositCallback = false;

  handleEvent(event: SimulatableAction, time: Big, eventData: any) {
    if (event === SimulatableAction.DEPOSIT_OUTPUT) {
      this.trackDepositEvent(time, (rate: number) => {
        this.updateDisplay(rate * (this.outputPacket?.amount || 1));
      });
      if (this.getIsOutputsBlocked()) {
        this.depositCallback = true;
      } else if (this.outputs.length) {
        this.notifyOutputsAndStartCycle(time);
      }
    } else if (event === SimulatableAction.TRANSFER_ITEM_TO_NEXT) {
      if (this.outputSlot[0]) {
        const { freeSlotArray, connectorId } = eventData;
        const { slug, amount } = this.outputSlot[0];
        if (amount > 1) {
          freeSlotArray[0] = {
            slug,
            amount: 1,
          };
          this.outputSlot[0] = {
            slug,
            amount: amount - 1,
          };

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
          }
        } else {
          freeSlotArray[0] = this.outputSlot[0];
          this.outputSlot[0] = null;
        }
        this.simulationManager.addTimerEvent({
          time: time,
          priority: Priority.CRITICAL,
          event: {
            target: connectorId,
            eventName: SimulatableAction.RESOURCE_DEPOSITED,
          },
        });

        if (!this.getIsOutputsBlocked() && this.depositCallback) {
          this.depositCallback = false;
          this.notifyOutputsAndStartCycle(time);
        }
      }
    } else {
      throw new Error('Unhandled event: ' + event);
    }
  }

  private notifyOutputsAndStartCycle(time: Big) {
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

      this.outputSlot[0] = this.outputPacket;

      this.addDelayedSelfAction(
        SimulatableAction.DEPOSIT_OUTPUT,
        time.add(this.cycleTime),
        Priority.CRITICAL
      );
    }
  }

  runPreSimulationActions(): void {
    super.runPreSimulationActions();

    this.outputSlot = [null];

    this.addDelayedSelfAction(
      SimulatableAction.DEPOSIT_OUTPUT,
      this.cycleTime,
      Priority.CRITICAL
    );
  }
}
