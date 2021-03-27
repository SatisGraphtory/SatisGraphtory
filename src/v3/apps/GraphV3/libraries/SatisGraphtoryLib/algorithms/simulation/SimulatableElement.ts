import Simulatable from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/Simulatable';
import SimulationManager, {
  Priority,
  SimulatableAction,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/manager/SimulationManager';
import Big from 'big.js';
import { GraphObject } from '../../canvas/objects/interfaces/GraphObject';

export type OutputPacket = {
  slug: string;
  amount: number;
};

export default abstract class SimulatableElement implements Simulatable {
  simulationManager: SimulationManager;
  graphic: GraphObject;

  public readonly id: string;

  objectOptions = new Map<string, any>();
  depositDelta: Big[] = [];
  lastTime = Big(-1);
  timeSum = Big(0);
  trackingLength = 20;
  private negativeOneBig = Big(-1);

  constructor(
    id: string,
    simulationManager: SimulationManager,
    graphic: GraphObject,
    objectOptions: Map<string, any>
  ) {
    this.id = id;
    this.graphic = graphic;
    this.simulationManager = simulationManager;
    simulationManager.register(this);
    this.objectOptions = new Map(objectOptions);
  }

  updateObjectOptions(newOptions: Map<string, any>) {
    const updateMap = new Map<string, any>();
    for (const [key, entry] of newOptions.entries()) {
      if (this.objectOptions.get(key) !== entry) {
        updateMap.set(key, entry);
        this.objectOptions.set(key, entry);
      }
    }

    // TODO: make this less crufty because we can pass it everything?
    // Or only what matters maybe
    this.generateFromOptions(new Set(newOptions.keys()));
  }

  abstract generateFromOptions(newOptions: Set<string>): void;

  reset() {
    this.graphic.resetDisplay();
  }

  abstract handleEvent(evt: any, time: Big, eventData: any): any;

  addDelayedSelfAction(
    action: SimulatableAction,
    delay: Big,
    priority?: number,
    eventData?: any
  ) {
    this.simulationManager.addTimerEvent({
      time: delay,
      priority,
      event: {
        target: this.id,
        eventName: action,
        eventData,
      },
    });
  }

  abstract getOutputIdsNeededForItem(itemSlug: string): string[];

  setDepositTrackingLength(length: number) {
    this.trackingLength = length;
  }

  runPreSimulationActions(): void {
    this.depositDelta = [];
    this.lastTime = Big(-1);
    this.timeSum = Big(0);
  }

  trackDepositEvent(time: Big, callback: any) {
    if (this.lastTime.eq(this.negativeOneBig)) {
      this.lastTime = time;
    } else {
      const deltaTime = time.minus(this.lastTime);
      this.depositDelta.push(deltaTime);
      this.timeSum = this.timeSum.add(deltaTime);
      this.lastTime = time;

      if (this.depositDelta.length === this.trackingLength + 1) {
        this.timeSum = this.timeSum.minus(this.depositDelta.shift()!);
        if (callback) {
          callback(
            Big(this.trackingLength)
              .div(this.timeSum)
              .mul(60 * 1000)
              .toNumber()
          );
        }
      }
    }
  }

  protected notifyOutputsOfItem(time: Big, item: string) {
    const getOutputIdsNeededForItem = this.getOutputIdsNeededForItem(item);

    for (const outputId of getOutputIdsNeededForItem) {
      this.simulationManager.addTimerEvent({
        time: time,
        priority: Priority.VERY_HIGH,
        event: {
          target: outputId,
          eventName: SimulatableAction.RESOURCE_AVAILABLE,
          eventData: {
            target: this.id,
            resourceName: item,
          },
        },
      });
    }
  }

  protected notifyConnectorOfResourceDeposit(time: Big, connectorId: string) {
    this.simulationManager.addTimerEvent({
      time: time,
      priority: Priority.CRITICAL,
      event: {
        target: connectorId,
        eventName: SimulatableAction.RESOURCE_DEPOSITED,
      },
    });
  }
}
