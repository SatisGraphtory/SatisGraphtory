import SimulationManager, {
  Priority,
  SimulatableAction,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/manager/SimulationManager';
import SimulatableLink from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/edges/SimulatableLink';
import { OutputPacket } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/SimulatableElement';
import { getBuildingDefinition } from 'v3/data/loaders/buildings';
import Big from 'big.js';
import EdgeTemplate from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';
let numtrack = 0;

export default class BeltV2 extends SimulatableLink {
  cycleTime = Big(-1);
  inputSlot: (OutputPacket | null)[] = [null];
  outputSlot: (OutputPacket | null)[] = [null];
  sendCallbackGet = false;
  callbackData = null as any;
  numTrack = 0;

  constructor(
    edge: EdgeTemplate,
    beltSlug: string,
    simulationManager: SimulationManager,
    edgeOptions: Map<string, any>
  ) {
    super(edge, beltSlug, simulationManager, edgeOptions);
    this.numTrack = numtrack++;
    this.generateFromOptions(new Set(edgeOptions.keys()));
  }

  generateFromOptions(optionsKeys: Set<string>): void {
    if (this.cycleTime.lt(0) || optionsKeys.has('overclock')) {
      const buildingDefinition = getBuildingDefinition(this.connectionName);

      // TODO: set the ovcerclock
      this.cycleTime = Big(60 * 1000).div(Big(buildingDefinition.mSpeed / 2));
    }
  }

  runPreSimulationActions(): void {
    super.runPreSimulationActions();

    this.inputSlot = [null];
    this.outputSlot = [null];
  }

  getIsOutputsBlocked() {
    return this.outputSlot[0] !== null;
  }

  updateDisplay(itemRate: number) {
    this.graphic.updateDisplay(itemRate);
  }

  getIsInputsBlocked() {
    return this.inputSlot[0] !== null;
  }

  handleEvent(evt: SimulatableAction, time: Big, eventData: any) {
    if (evt === SimulatableAction.RESOURCE_AVAILABLE) {
      if (this.getIsInputsBlocked()) {
        this.sendCallbackGet = true;
        this.callbackData = eventData;
      } else {
        this.simulationManager.addTimerEvent({
          time: time,
          priority: Priority.VERY_HIGH,
          event: {
            target: eventData.target,
            eventName: SimulatableAction.TRANSFER_ITEM_TO_NEXT,
            eventData: {
              connectorId: this.id,
              freeSlotArray: this.inputSlot,
              resourceName: eventData.resourceName,
            },
          },
        });
      }
    } else if (evt === SimulatableAction.RESOURCE_DEPOSITED) {
      this.addDelayedSelfAction(
        SimulatableAction.DEPOSIT_OUTPUT,
        time.add(this.cycleTime),
        Priority.CRITICAL
      );
    } else if (evt === SimulatableAction.DEPOSIT_OUTPUT) {
      this.trackDepositEvent(time, (rate: number) => {
        this.updateDisplay(rate);
      });

      this.outputSlot[0] = this.inputSlot[0];
      for (const outputId of this.outputs.map((output) => output.id)) {
        this.simulationManager.addTimerEvent({
          time: time,
          priority: Priority.VERY_HIGH,
          event: {
            target: outputId,
            eventName: SimulatableAction.RESOURCE_AVAILABLE,
            eventData: {
              target: this.id,
              resourceName: this.outputSlot[0]?.slug,
            },
          },
        });
      }
    } else if (evt === SimulatableAction.TRANSFER_ITEM_TO_NEXT) {
      if (this.getIsOutputsBlocked()) {
        const { freeSlotArray, connectorId } = eventData;
        if (freeSlotArray[0] !== null) {
          throw new Error(
            'You dingus, you forgot about the free slot array problem'
          );
        }
        freeSlotArray[0] = this.outputSlot[0];
        this.outputSlot[0] = null;
        this.simulationManager.addTimerEvent({
          time: time,
          priority: Priority.CRITICAL, // should this be critical?
          event: {
            target: connectorId,
            eventName: SimulatableAction.RESOURCE_DEPOSITED,
          },
        });

        this.inputSlot[0] = null;

        //TODO: Move this to when the thing actually gets deposited elsewhere
        if (this.sendCallbackGet) {
          this.sendCallbackGet = false;
          this.simulationManager.addTimerEvent({
            time: time,
            priority: Priority.VERY_HIGH,
            event: {
              target: this.callbackData.target,
              eventName: SimulatableAction.TRANSFER_ITEM_TO_NEXT,
              eventData: {
                connectorId: this.id,
                freeSlotArray: this.inputSlot,
                resourceName: this.callbackData.resourceName,
              },
            },
          });
        }
      }
    } else {
      throw new Error('Unhandled event: ' + evt);
    }
  }
}
