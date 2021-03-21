import PriorityQueue from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/datastructures/priorityqueue/PriorityQueue';
import SimulatableElement from '../SimulatableElement';

export enum Priority {
  CRITICAL = -1000000, //deposit events
  VERY_HIGH = -100000, // pull events
  HIGH = -10000, //process events
  NORMAL = 0,
  LOW = 10000,
  VERY_LOW = 100000,
  ONLY_IF_NOTHING_ELSE = 1000000,
}

type ScheduledTask = {
  time: number;
  priority?: number | Priority;
  event: {
    target: string;
    eventName: SimulatableAction;
    eventData?: any;
  };
};

export enum SimulatableAction {
  DEPOSIT_OUTPUT,
  RESOURCE_AVAILABLE,
  TRANSFER_ITEM,
  RESOURCE_DEPOSITED,
}

export default class SimulationManager {
  // The tickspeed is set based on 60/ MAX_BELT_SPEED
  private readonly tickSpeed = 50;

  private simulationTimeline: PriorityQueue<ScheduledTask>;
  private objectMap = new Map<string, SimulatableElement>();

  constructor() {
    this.simulationTimeline = new PriorityQueue<any>({
      comparator: (a, b) => {
        if (a.time === b.time) {
          return (
            (a.priority === undefined ? 1000000000 : a.priority) -
            (b.priority === undefined ? 1000000000 : b.priority)
          );
        }
        return a.time - b.time;
      },
    });
  }

  register(obj: SimulatableElement) {
    this.objectMap.set(obj.id, obj);
  }

  prepare() {
    Array.from(this.objectMap.values()).forEach((connection) => {
      connection.runPreSimulationActions();
    });
  }

  private currentTick = 0;

  tick() {
    while (true) {
      if (!this.simulationTimeline.length) break;
      if (this.simulationTimeline.peek().time >= this.currentTick) {
        break;
      }
      const current = this.simulationTimeline.dequeue();
      const { target, eventName, eventData } = current.event;
      // console.log('Processing ', current, 'at', this.currentTick);
      this.objectMap
        .get(target)
        ?.handleEvent(eventName, current.time, eventData);
    }

    this.currentTick += this.tickSpeed;
  }

  addTimerEvent(evt: ScheduledTask) {
    this.simulationTimeline.queue(evt);
  }

  resetAll() {
    for (const object of this.objectMap.values()) {
      object.reset();
    }

    this.simulationTimeline.clear();
  }
}
