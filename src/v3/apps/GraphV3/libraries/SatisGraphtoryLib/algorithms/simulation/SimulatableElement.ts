import Simulatable from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/Simulatable';
import SimulationManager, {
  SimulatableAction,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/manager/SimulationManager';
import Big from 'big.js';

export type OutputPacket = {
  slug: string;
  amount: number;
};

export default abstract class SimulatableElement implements Simulatable {
  simulationManager: SimulationManager;

  public readonly id: string;

  constructor(id: string, simulationManager: SimulationManager) {
    this.id = id;
    this.simulationManager = simulationManager;
    simulationManager.register(this);
  }

  //TODO: make this abstract?
  reset() {}

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

  depositDelta: Big[] = [];
  lastTime = Big(-1);
  timeSum = Big(0);
  trackingLength = 20;

  setDepositTrackingLength(length: number) {
    this.trackingLength = length;
  }

  runPreSimulationActions(): void {
    this.depositDelta = [];
    this.lastTime = Big(-1);
    this.timeSum = Big(0);
  }

  private negativeOneBig = Big(-1);

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
}
