import Simulatable from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/Simulatable';
import SimulationManager, {
  SimulatableAction,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/manager/SimulationManager';

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

  runPreSimulationActions(): void {
    // noop.
  }

  //TODO: make this abstract?
  reset() {}

  abstract handleEvent(evt: any, time: number, eventData: any): any;

  addDelayedSelfAction(
    action: SimulatableAction,
    delay: number,
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

  eventDispatch = new Map<SimulatableAction, any[]>();
}
