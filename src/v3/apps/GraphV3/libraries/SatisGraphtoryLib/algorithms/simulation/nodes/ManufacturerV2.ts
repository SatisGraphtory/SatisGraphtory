import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import SimulatableNode from './SimulatableNode';
import { NodeTemplate } from '../../../canvas/objects/Node/NodeTemplate';
import Big from 'big.js';
import { OutputPacket } from '../SimulatableElement';
import { getRecipeDefinition } from '../../../../../../../data/loaders/recipes';
import { ConnectionTypeEnum } from '../../../../../../../../.DataWarehouse/enums/dataEnums';
import { getConnectionTypeNeededForItem } from '../../../../../../../data/loaders/items';

export default class ManufacturerV2 extends SimulatableNode {
  expectedResourcesByConnectionType = new Map<
    ConnectionTypeEnum,
    Set<string>
  >();
  resourcesNeededBySlug = new Map<string, number>();

  remainingResourcesNeedBySlug = new Map<string, number>();
  constructor(
    node: NodeTemplate,
    buildingSlug: string,
    nodeOptions: Map<string, any>,
    simulationManager: SimulationManager
  ) {
    super(node, buildingSlug, simulationManager);
    const buildingDefinition = getBuildingDefinition(buildingSlug);
    this.cycleTime = Big(buildingDefinition.mManufacturingSpeed * 1000);

    if (nodeOptions.has('recipe')) {
      const recipe = getRecipeDefinition(nodeOptions.get('recipe')!);
      for (const { ItemClass, Amount } of recipe.mIngredients) {
        const connectorClassRequired = getConnectionTypeNeededForItem(
          ItemClass.slug
        );
        if (
          !this.expectedResourcesByConnectionType.has(connectorClassRequired)
        ) {
          this.expectedResourcesByConnectionType.set(
            connectorClassRequired,
            new Set()
          );
        }

        this.resourcesNeededBySlug.set(ItemClass.slug, Amount);

        this.expectedResourcesByConnectionType
          .get(connectorClassRequired)!
          .add(ItemClass.slug);
      }
      this.cycleTime = this.cycleTime.mul(recipe.mManufactoringDuration);

      for (const { ItemClass, Amount } of recipe.mProduct) {
        const connectionType = getConnectionTypeNeededForItem(ItemClass.slug);
        if (this.outputPacketByConnection.has(connectionType)) {
          throw new Error(
            'Recipe ' +
              nodeOptions.get('recipe')! +
              ' has multiple connection types :('
          );
        }

        this.outputPacketByConnection.set(connectionType, {
          slug: ItemClass.slug,
          amount: Amount,
        });
      }
    }

    this.runPreSimulationActions();
  }

  outputPacketByConnection: Map<ConnectionTypeEnum, OutputPacket> = new Map();

  cycleTime: Big;

  depositTimes: Big[] = [];

  updateDisplay(itemRate: number) {
    this.graphic.updateDisplay(itemRate);
  }

  reset() {
    this.graphic.resetDisplay();
  }

  needsResource(resourceSlug: string) {
    const remaining = this.remainingResourcesNeedBySlug.get(resourceSlug);
    if (this.resourcesNeededBySlug.get(resourceSlug) === undefined)
      throw new Error('Manufacturer does not need ' + resourceSlug);
    if (remaining === undefined) return false;
    return remaining > 0;
  }

  decreaseResourceByN(resourceSlug: string, n = 1) {
    const remaining = this.remainingResourcesNeedBySlug.get(resourceSlug);
    if (remaining === undefined)
      throw new Error('Manufacturer does not need ' + resourceSlug);
    if (!remaining)
      throw new Error('Could not decrease resource as it was not needed');
    if (remaining - n < 0)
      throw new Error('Could not decrease resource as it would go negative');
    if (remaining - n === 0) {
      this.remainingResourcesNeedBySlug.delete(resourceSlug);
    } else {
      this.remainingResourcesNeedBySlug.set(resourceSlug, remaining - n);
    }
  }

  //TODO: probably make it work for multiple RF's....
  outputSlot: (OutputPacket | null)[] = [null];

  callbackByResource = new Map<string, any>();

  inputQueue = [] as (OutputPacket | null)[];

  handleEvent(evt: SimulatableAction, time: Big, eventData: any) {
    if (evt === SimulatableAction.RESOURCE_AVAILABLE) {
      if (this.needsResource(eventData.resourceName)) {
        this.inputQueue.push(null);
        this.simulationManager.addTimerEvent({
          time: time,
          priority: Priority.VERY_HIGH,
          event: {
            target: eventData.target,
            eventName: SimulatableAction.TRANSFER_ITEM_TO_NEXT,
            eventData: {
              connectorId: this.id,
              freeSlotArray: this.inputQueue,
            },
          },
        });
      } else {
        this.callbackByResource.set(eventData.resourceName, (time: Big) => {
          this.inputQueue.push(null);
          this.simulationManager.addTimerEvent({
            time: time,
            priority: Priority.VERY_HIGH,
            event: {
              target: eventData.target,
              eventName: SimulatableAction.TRANSFER_ITEM_TO_NEXT,
              eventData: {
                connectorId: this.id,
                freeSlotArray: this.inputQueue,
              },
            },
          });
        });
      }
    } else if (evt === SimulatableAction.RESOURCE_DEPOSITED) {
      for (let i = 0; i < this.inputQueue.length; i++) {
        const item = this.inputQueue[i];

        if (item !== null) {
          this.decreaseResourceByN(item.slug, item.amount);
          this.inputQueue.splice(i, 1);

          if (!this.remainingResourcesNeedBySlug.size) {
            if (this.inputQueue.filter((item) => item !== null).length) {
              throw new Error('Why do we still have an inputQueue?');
            }

            this.addDelayedSelfAction(
              SimulatableAction.DEPOSIT_OUTPUT,
              time.add(this.cycleTime),
              Priority.CRITICAL
            );
          }
          break;
        }
      }
    } else if (evt === SimulatableAction.DEPOSIT_OUTPUT) {
      this.trackDepositEvent(time, (rate: number) => {
        this.updateDisplay(rate);
      });

      //TODO: IF BLOCKED, DO SHIT
      this.resetRemainingResourcesNeeded();

      // this.outputSlot[0] =
      for (const [key, callback] of this.callbackByResource) {
        this.callbackByResource.delete(key);

        callback(time);
      }
    } else {
      throw new Error('Unhandled event: ' + evt);
    }
  }

  runPreSimulationActions(): void {
    super.runPreSimulationActions();

    this.resetRemainingResourcesNeeded();
  }

  resetRemainingResourcesNeeded() {
    for (const [key, entry] of this.resourcesNeededBySlug.entries()) {
      this.remainingResourcesNeedBySlug.set(key, entry);
    }
  }
}
