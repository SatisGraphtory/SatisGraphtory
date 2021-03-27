import { OutputPacket } from '../SimulatableElement';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import SimulatableNode from './SimulatableNode';
import { MachineNodeTemplate } from '../../../canvas/objects/Node/MachineNodeTemplate';
import Big from 'big.js';
import { EResourcePurity } from '../../../../../../../../.DataLanding/interfaces/enums';
import resolveMathValue from '../../../../../components/Selectors/resolveMathValue';

export default class ResourceExtractorV2 extends SimulatableNode {
  cycleTime: Big = Big(-1);
  outputPacket: OutputPacket | null = null;
  outputSlot: (OutputPacket | null)[] = [null];
  depositCallback = false;

  constructor(
    node: MachineNodeTemplate,
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
    super.generateFromOptions(optionsKeys);

    const buildingDefinition = getBuildingDefinition(this.buildingSlug);

    if (
      this.cycleTime.lt(0) ||
      optionsKeys.has('overclock') ||
      optionsKeys.has('nodePurity')
    ) {
      let overclock = 100;

      if (this.objectOptions.get('overclock')) {
        overclock = this.objectOptions.get('overclock');
      }

      const oldCycleTime = this.cycleTime;

      let purityMultiplier = 1;
      switch (this.objectOptions.get('nodePurity')) {
        case EResourcePurity.RP_Inpure:
          purityMultiplier = 0.5;
          break;
        case EResourcePurity.RP_Pure:
          purityMultiplier = 2;
          break;
      }

      this.cycleTime = Big(buildingDefinition.mExtractCycleTime)
        .div(resolveMathValue(overclock))
        .div(purityMultiplier)
        .mul(100)
        .mul(Big(1000));

      const timeChange = oldCycleTime.minus(this.cycleTime);

      this.simulationManager.editEvents(
        this.id,
        SimulatableAction.DEPOSIT_OUTPUT,
        timeChange
      );

      this.resetDepositTracking();
    }

    if (optionsKeys.has('extractedItem')) {
      this.outputPacket = {
        slug: this.objectOptions.get('extractedItem'),
        amount: buildingDefinition.mItemsPerCycle,
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
    if (event === SimulatableAction.PING) {
      this.trackDepositEvent(
        time,
        (rate: number) => {
          this.updateDisplay(rate * (this.outputPacket?.amount || 1));
        },
        true
      );

      this.sendPing(time);
    } else if (event === SimulatableAction.DEPOSIT_OUTPUT) {
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
