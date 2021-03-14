import SimulatableConnection from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/SimulatableConnection';

export default class Belt extends SimulatableConnection {
  constructor(beltSpeed: number) {
    super();
    this.cycleTime = (60 * 1000) / beltSpeed;
    this.outputSlot.push([]);
  }

  blocked = false;
  unblockCallback = (null as unknown) as any;

  handleEvent(evt: any, time: number, eventData: any) {
    console.log('Handling belt event ');
    switch (evt) {
      case 'PULL':
        if (!this.blocked) {
          this.pushFunction(time);
        } else {
          this.unblockCallback = (time: number) => {
            this.pushFunction(time);
          };
        }
        break;
      case 'UNBLOCK':
        if (this.blocked) {
          if (this.outputSlot[0].length === 0) {
            this.blocked = false;
            if (this.unblockCallback) {
              this.unblockCallback(time);
              this.unblockCallback = null;
            }
          }
        }
        break;
      case 'PUSH':
        this.outputSlot[0].push(...eventData);
        if (this.outputSlot[0].length > 1) {
          throw new Error('Why is this more than 1');
        }
        this.outputs.forEach((output) => {
          this.simulationManager?.addTimerEvent({
            // TODO: should this be more? or less? +1?
            time: time,
            event: {
              target: output.id,
              eventName: 'PULL',
              eventData: this.id,
            },
          });
        });
        break;
      default:
        throw new Error('Unhandled event ' + evt);
    }
  }

  private pushFunction(time: number) {
    const itemsRetrieved = this.inputs
      .map((input) => {
        const outputSlot = input.getOutputSlot(this.id);

        if (outputSlot.length) {
          return outputSlot.shift();
        }

        return null;
      })
      .filter((item) => item);

    if (itemsRetrieved.length === 0) {
      throw new Error('Push was called but no item to get ' + this.id);
    }

    this.simulationManager?.addTimerEvent({
      time: time + this.cycleTime,
      event: {
        target: this.id,
        eventName: 'PUSH',
        eventData: itemsRetrieved,
      },
    });
    this.inputs.forEach((input) => {
      this.simulationManager?.addTimerEvent({
        time: time,
        event: {
          target: input.id,
          eventName: 'UNBLOCK',
          eventData: this.id,
        },
      });
    });
    this.blocked = true;
  }
}
