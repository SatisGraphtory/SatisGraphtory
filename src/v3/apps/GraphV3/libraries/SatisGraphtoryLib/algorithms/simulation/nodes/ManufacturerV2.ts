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
  resourcesNeededBySlug = new Map<string, number>();
  remainingResourcesNeedBySlug = new Map<string, number>();

  resourcesProducedBySlug = new Map<string, number>();
  remainingProducedResourcesNeedBySlug = new Map<string, number>();

  tracked = false;
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
      if (recipe.mIngredients.length === 2) {
        this.tracked = true;
      }

      for (const { ItemClass, Amount } of recipe.mIngredients) {
        this.resourcesNeededBySlug.set(ItemClass.slug, Amount);
      }

      for (const { ItemClass, Amount } of recipe.mProduct) {
        this.resourcesProducedBySlug.set(ItemClass.slug, Amount);
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

      this.resetResourcesProduced();

      //////// EXPERIMENTAL /////////////////
      if (this.outputs.length) {
        for (const resource of this.remainingProducedResourcesNeedBySlug.keys()) {
          //TODO: make this into its own function
          const getOutputIdsNeededForItem = this.getOutputIdsNeededForItem(
            resource
          );
          for (const outputId of getOutputIdsNeededForItem) {
            this.simulationManager.addTimerEvent({
              time: time,
              priority: Priority.HIGH,
              event: {
                target: outputId,
                eventName: SimulatableAction.RESOURCE_AVAILABLE,
                eventData: {
                  target: this.id,
                  resourceName: resource,
                },
              },
            });
          }
        }
      } else {
        //TODO: IF BLOCKED, DO SHIT
        this.resetRemainingResourcesNeeded();

        //Callback to fetch more stuff?
        for (const [key, callback] of this.callbackByResource) {
          this.callbackByResource.delete(key);
          callback(time);
        }
      }
    } else if (evt === SimulatableAction.TRANSFER_ITEM_TO_NEXT) {
      const { freeSlotArray, connectorId, resourceName } = eventData;
      const slug = resourceName;
      const amount = this.remainingProducedResourcesNeedBySlug.get(slug) || 0;
      for (let i = 0; i < freeSlotArray.length; i++) {
        if (freeSlotArray[i] === null) {
          freeSlotArray[i] = {
            slug,
            amount: 1,
          };
        }
      }
      if (amount > 1) {
        this.remainingProducedResourcesNeedBySlug.set(slug, amount - 1);

        const getOutputIdsNeededForItem = this.getOutputIdsNeededForItem(slug);

        for (const outputId of getOutputIdsNeededForItem) {
          this.simulationManager.addTimerEvent({
            time: time,
            priority: Priority.HIGH,
            event: {
              target: outputId,
              eventName: SimulatableAction.RESOURCE_AVAILABLE,
              eventData: {
                target: this.id,
                resourceName: slug,
              },
            },
          });
        }
      } else {
        this.remainingProducedResourcesNeedBySlug.delete(slug);

        //TODO: IF BLOCKED, DO SHIT
        this.resetRemainingResourcesNeeded();

        //Callback to fetch more stuff?
        for (const [key, callback] of this.callbackByResource) {
          this.callbackByResource.delete(key);
          callback(time);
        }
      }

      this.simulationManager.addTimerEvent({
        time: time,
        priority: Priority.CRITICAL,
        event: {
          target: connectorId,
          eventName: SimulatableAction.RESOURCE_DEPOSITED,
        },
      });
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

  resetResourcesProduced() {
    for (const [key, entry] of this.resourcesProducedBySlug.entries()) {
      this.remainingProducedResourcesNeedBySlug.set(key, entry);
    }
  }
}
