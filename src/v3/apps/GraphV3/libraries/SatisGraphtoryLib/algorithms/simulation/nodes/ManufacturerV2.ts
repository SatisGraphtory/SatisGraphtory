import SimulationManager, {
  Priority,
  SimulatableAction,
} from '../manager/SimulationManager';
import { getBuildingDefinition } from '../../../../../../../data/loaders/buildings';
import SimulatableNode from './SimulatableNode';
import { MachineNodeTemplate } from '../../../canvas/objects/Node/MachineNodeTemplate';
import Big from 'big.js';
import { OutputPacket } from '../SimulatableElement';
import { getRecipeDefinition } from '../../../../../../../data/loaders/recipes';
import { ConnectionTypeEnum } from '../../../../../../../../.DataWarehouse/enums/dataEnums';
import { getConnectionTypeNeededForItem } from '../../../../../../../data/loaders/items';
import resolveMathValue from '../../../../../components/Selectors/resolveMathValue';

export default class ManufacturerV2 extends SimulatableNode {
  resourcesNeededBySlug = new Map<string, number>();
  remainingResourcesNeedBySlug = new Map<string, number>();

  resourcesProducedBySlug = new Map<string, number>();
  remainingProducedResourcesNeedBySlug = new Map<string, number>();
  outputPacketByConnection: Map<ConnectionTypeEnum, OutputPacket> = new Map();
  cycleTime: Big = Big(-1);
  depositTimes: Big[] = [];
  //TODO: probably make it work for multiple RF's....
  outputSlot: (OutputPacket | null)[] = [null];
  callbackByResource = new Map<string, any>();
  inputQueue = [] as (OutputPacket | null)[];

  constructor(
    node: MachineNodeTemplate,
    buildingSlug: string,
    nodeOptions: Map<string, any>,
    simulationManager: SimulationManager
  ) {
    super(node, buildingSlug, simulationManager, nodeOptions);

    this.generateFromOptions(new Set(nodeOptions.keys()));
  }

  generateFromOptions(optionsKeys: Set<string>): void {
    const buildingDefinition = getBuildingDefinition(this.buildingSlug);

    if (this.cycleTime.lt(0) || optionsKeys.has('overclock')) {
      this.cycleTime = Big(buildingDefinition.mManufacturingSpeed * 1000); // TODO Overclock
    }

    if (optionsKeys.has('recipe')) {
      const recipe = getRecipeDefinition(this.objectOptions.get('recipe')!);

      for (const { ItemClass, Amount } of recipe.mIngredients) {
        this.resourcesNeededBySlug.set(ItemClass.slug, Amount);
      }

      for (const { ItemClass, Amount } of recipe.mProduct) {
        this.resourcesProducedBySlug.set(ItemClass.slug, Amount);
      }

      let overclock = 100;

      if (this.objectOptions.get('overclock')) {
        overclock = this.objectOptions.get('overclock');
      }

      this.cycleTime = Big(buildingDefinition.mManufacturingSpeed * 1000)
        .div(resolveMathValue(overclock))
        .mul(100)
        .mul(recipe.mManufactoringDuration);

      this.outputPacketByConnection.clear();

      for (const { ItemClass, Amount } of recipe.mProduct) {
        const connectionType = getConnectionTypeNeededForItem(ItemClass.slug);
        if (this.outputPacketByConnection.has(connectionType)) {
          throw new Error(
            'Recipe ' +
              this.objectOptions.get('recipe')! +
              ' has multiple connection types :('
          );
        }

        this.outputPacketByConnection.set(connectionType, {
          slug: ItemClass.slug,
          amount: Amount,
        });
      }
    }
  }

  updateDisplay(itemRate: number) {
    this.graphic.updateDisplay(itemRate);
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

  handleEvent(evt: SimulatableAction, time: Big, eventData: any) {
    if (evt === SimulatableAction.RESOURCE_AVAILABLE) {
      if (this.needsResource(eventData.resourceName)) {
        this.sendItemTransferRequest(time, eventData);
      } else {
        this.callbackByResource.set(eventData.resourceName, (time: Big) => {
          this.sendItemTransferRequest(time, eventData);
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

      this.notifyConnectorOfResourceDeposit(time, connectorId);
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

  private sendItemTransferRequest(time: Big, eventData: any) {
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
  }
}
