import EventEmitter from 'eventemitter3';
import SimulationManager from '../../../algorithms/simulation/manager/SimulationManager';

class ExternalInteractionManager {
  private theme: any = {};
  private readonly eventEmitter: EventEmitter;
  private eventEmitterMap = new Map<string, boolean>();
  private simulationManager: SimulationManager;
  private readonly canvasId: string;

  constructor(
    eventEmitter: EventEmitter,
    canvasId: string,
    simulationManager: SimulationManager
  ) {
    this.eventEmitter = eventEmitter;
    this.canvasId = canvasId;
    this.simulationManager = simulationManager;
  }

  getSimulationManager() {
    return this.simulationManager;
  }

  getCanvasId() {
    return this.canvasId;
  }

  getEventEmitter() {
    // if (!this.eventEmitterIsEnabled) throw new Error("Cannot get event emitter when it is disabled")

    return this.eventEmitter;
  }

  eventEmitterEnabled(id: string) {
    return this.eventEmitterMap.get(id) || false;
  }

  enableEventEmitter(id: string) {
    this.eventEmitterMap.set(id, true);
  }

  disableEventEmitter(id: string) {
    this.eventEmitterMap.delete(id);
  }

  setTheme(theme: any) {
    this.theme = theme;
  }

  getTheme() {
    return this.theme;
  }
}

export default ExternalInteractionManager;
