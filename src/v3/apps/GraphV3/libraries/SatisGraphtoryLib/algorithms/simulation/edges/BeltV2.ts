import SimulationManager, {
  Priority,
  SimulatableAction,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/manager/SimulationManager';
import SimulatableLink from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/edges/SimulatableLink';
import SimulatableNode from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/nodes/SimulatableNode';
import { OutputPacket } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/SimulatableElement';
import { getBuildingDefinition } from 'v3/data/loaders/buildings';
import Big from 'big.js';
import EdgeTemplate from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';

export default class BeltV2 extends SimulatableLink {
  constructor(
    edge: EdgeTemplate,
    beltSlug: string,
    simulationManager: SimulationManager
  ) {
    super(edge, beltSlug, simulationManager);

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
    this.outputs.push(targetSimulatable);
  }

  runPreSimulationActions(): void {
    super.runPreSimulationActions();

    this.inputSlot = [null];
    this.outputSlot = [null];
  }

  inputSlot: (OutputPacket | null)[] = [null];
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

  sendCallbackGet = false;
  callbackData = null as any;

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
            target: eventData,
            eventName: SimulatableAction.TRANSFER_ITEM_TO_NEXT,
            eventData: {
              connectorId: this.id,
              freeSlotArray: this.inputSlot,
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
      this.inputSlot[0] = null;
      for (const outputId of this.outputs.map((output) => output.id)) {
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
    } else if (evt === SimulatableAction.TRANSFER_ITEM_TO_NEXT) {
      if (this.getIsOutputsBlocked()) {
        const { freeSlotArray, connectorId } = eventData;
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
        //TODO: Move this to when the thing actually gets deposited elsewhere
        if (this.sendCallbackGet) {
          this.sendCallbackGet = false;
          this.simulationManager.addTimerEvent({
            time: time,
            priority: Priority.VERY_HIGH,
            event: {
              target: this.callbackData,
              eventName: SimulatableAction.TRANSFER_ITEM_TO_NEXT,
              eventData: {
                connectorId: this.id,
                freeSlotArray: this.inputSlot,
              },
            },
          });
        }
      } else {
        // console.warn("What should we do when something tells us to transfer something we don't have?")
      }
    } else {
      throw new Error('Unhandled event: ' + evt);
    }
  }
}
