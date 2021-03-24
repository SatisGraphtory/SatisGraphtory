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
  cycleTime: Big = Big(-1);
  outputPacket: OutputPacket | null = null;
  outputSlot: (OutputPacket | null)[] = [null];
  depositCallback = false;

  constructor(
    node: NodeTemplate,
    buildingSlug: string,
    nodeOptions: Map<string, any>,
    simulationManager: SimulationManager
  ) {
    super(node, buildingSlug, simulationManager, nodeOptions);

    const buildingDefinition = getBuildingDefinition(buildingSlug);

    this.setDepositTrackingLength(
      buildingDefinition?.mNumCyclesForProductivity || 20
    );

    this.generateFromOptions(new Set(nodeOptions.keys()));
  }

  generateFromOptions(optionsKeys: Set<string>): void {
    const buildingDefinition = getBuildingDefinition(this.buildingSlug);

    if (this.cycleTime.lt(0) || optionsKeys.has('overclock')) {
      this.cycleTime = Big(buildingDefinition.mExtractCycleTime).mul(Big(1000));
    }

    if (optionsKeys.has('nodePurity')) {
      let purityMultiplier = 1;
      switch (this.objectOptions.get('nodePurity')) {
        case EResourcePurity.RP_Inpure:
          purityMultiplier = 0.5;
          break;
        case EResourcePurity.RP_Pure:
          purityMultiplier = 2;
          break;
      }

      if (!optionsKeys.has('extractedItem'))
        throw new Error('Must have extracted item!');

      this.outputPacket = {
        slug: this.objectOptions.get('extractedItem'),
        amount: buildingDefinition.mItemsPerCycle * purityMultiplier,
      };
    }
  }

  getIsOutputsBlocked() {
    return this.outputSlot[0] !== null;
  }

  updateDisplay(itemRate: number) {
    this.graphic.updateDisplay(itemRate);
  }

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
          for (let i = 0; i < freeSlotArray.length; i++) {
            if (freeSlotArray[i] === null) {
              //TODO: add a check to see if we didn't actually write.
              freeSlotArray[i] = {
                slug,
                amount: 1,
              };
            }
          }

          this.outputSlot[0] = {
            slug,
            amount: amount - 1,
          };

          if (this.outputPacket) {
            this.notifyOutputsOfItem(time, this.outputPacket.slug);
          }
        } else {
          freeSlotArray[0] = this.outputSlot[0];
          this.outputSlot[0] = null;
        }
        this.notifyConnectorOfResourceDeposit(time, connectorId);

        if (!this.getIsOutputsBlocked() && this.depositCallback) {
          this.depositCallback = false;
          this.notifyOutputsAndStartCycle(time);
        }
      }
    } else {
      throw new Error('Unhandled event: ' + event);
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

  private notifyOutputsAndStartCycle(time: Big) {
    if (this.outputPacket) {
      this.notifyOutputsOfItem(time, this.outputPacket.slug);

      this.outputSlot[0] = this.outputPacket;

      this.addDelayedSelfAction(
        SimulatableAction.DEPOSIT_OUTPUT,
        time.add(this.cycleTime),
        Priority.CRITICAL
      );
    }
  }
}
