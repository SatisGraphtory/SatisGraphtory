import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import SimulatableLink from './SimulatableLink';
import SimulatableNode from '../nodes/SimulatableNode';
import { OutputPacket } from '../SimulatableElement';

export default class BeltV2 extends SimulatableLink {
  constructor(
    id: string,
    beltSlug: string,
    simulationManager: SimulationManager
  ) {
    super(id, beltSlug, simulationManager);

    // const buildingDefintion = getBuildingDefinition(beltSlug)

    this.cycleTime = 60 * 1000; //????
    // / beltSpeed;
  }

  cycleTime: number;

  inputSlots: (OutputPacket | null)[] = [];
  outputSlots: (OutputPacket | null)[] = [];
  anyConnectionSlots: (OutputPacket | null)[] = [];

  addLink(
    sourceSimulatable: SimulatableNode,
    targetSimulatable: SimulatableNode,
    connectorName: string
  ) {
    sourceSimulatable.outputs.push(this);
    this.inputs.push(sourceSimulatable);
    targetSimulatable.inputs.push(this);
    this.outputs.push(sourceSimulatable);
  }

  runPreSimulationActions(): void {
    this.outputSlots = this.outputs.map(() => null);
    this.inputSlots = this.inputs.map(() => null);
  }

  getFreeInputSlots() {
    const freeInputSlots = this.inputSlots.filter((item) => item === null);
    if (!freeInputSlots.length)
      throw new Error('Not possible, no input slots!');
    return freeInputSlots;
  }

  handleEvent(evt: SimulatableAction, time: number, eventData: any) {
    if (evt === SimulatableAction.RESOURCE_AVAILABLE) {
      this.simulationManager.addTimerEvent({
        time: time,
        priority: Priority.VERY_HIGH,
        event: {
          target: eventData,
          eventName: SimulatableAction.TRANSFER_ITEM,
          eventData: {
            connectorId: this.id,
            freeSlotArray: this.getFreeInputSlots(),
          },
        },
      });
    }
  }
}
