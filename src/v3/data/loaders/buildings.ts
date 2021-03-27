import lazyFunc from 'v3/utils/lazyFunc';
import memoize from 'fast-memoize';
import {
  EFactoryConnectionDirection,
  EPipeConnectionType,
  EResourceForm,
  EResourcePurity,
} from '.DataLanding/interfaces/enums';
import uuidGen from 'v3/utils/stringUtils';
import { EdgeAttachmentSide } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeAttachmentSide';
import ExternalInteractionManager from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/interfaces/ExternalInteractionManager';
import { SatisGraphtoryEdgeProps } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/types';

import BuildingClasses from '.DataWarehouse/main/BuildingClasses.json';
import BuildingClassMap from '.DataWarehouse/main/BuildingClassMap.json';
import ConnectionsJson from '.DataWarehouse/main/Connections.json';
import { getImageFileFromSlug } from './images';
import { ConnectionTypeEnum } from '.DataWarehouse/enums/dataEnums';
import { getRecipesByMachineClass } from './recipes';
import { getEnumDisplayNames, getEnumValues } from './enums';

import { EResourcePurityDisplayName } from '.DataLanding/interfaces/enums/EResourcePurity';
import { getResourcesByForm } from './items';
import { getAlternateRecipes } from './schematics';

import { unpack } from 'jsonpack';

import raw from 'raw.macro';
import {
  UFGBuildingDescriptor,
  UFGItemDescriptor,
  UFGRecipe,
} from '../../../.DataLanding/interfaces/classes';

const ItemJsonRaw = raw('../../../.DataWarehouse/main_compressed/Items.cjson');
const ItemJson = unpack(ItemJsonRaw) as Record<string, UFGItemDescriptor>;

const BuildingJsonRaw = raw(
  '../../../.DataWarehouse/main_compressed/Buildings.cjson'
);
const BuildingJson = unpack(BuildingJsonRaw) as Record<
  string,
  UFGBuildingDescriptor
>;

const RecipeJsonRaw = raw(
  '../../../.DataWarehouse/main_compressed/Recipes.cjson'
);
const RecipeJson = unpack(RecipeJsonRaw) as Record<string, UFGRecipe>;

export const getUnrealClassForBuilding = (buildingSlug: string) => {
  return (BuildingClasses as any)[buildingSlug];
};

const getAllSubclassesFn = (baseClass: string) => {
  const allClasses = new Set<string>();
  allClasses.add(baseClass);
  for (const claz of (BuildingClassMap as any)[baseClass] || []) {
    for (const subclass of getAllSubclasses(claz)) {
      allClasses.add(subclass);
    }
  }

  return allClasses;
};

const getAllSubclasses = memoize(getAllSubclassesFn);

function generateClassMap(allMachines: Set<string>) {
  const machineClassMap = new Map<string, string[]>();
  const reverseMachineClassMap = new Map<string, string>();

  for (const machine of allMachines) {
    let machineBaseName = machine;
    if (/^(.*)-mk[0-9]+$/.test(machine)) {
      const markRegex = /^(.*)-mk[0-9]+$/;
      machineBaseName = markRegex.exec(machine)![1]!;
    }

    if (!machineClassMap.has(machineBaseName)) {
      machineClassMap.set(machineBaseName, []);
    }
    machineClassMap.get(machineBaseName)!.push(machine);

    reverseMachineClassMap.set(machine, machineBaseName);
  }

  for (const entry of machineClassMap.values()) {
    entry.sort();
  }

  const imageMap = new Map<string, string>();

  for (const [key, entry] of machineClassMap.entries()) {
    imageMap.set(key, entry[0]);
  }

  return { machineClassMap, reverseMachineClassMap, imageMap };
}

const resourceExtractorSubclasses = getAllSubclasses(
  'AFGBuildableResourceExtractor'
);

const toUnrealClassName = (classSlug: string) => {
  return 'A' + classSlug;
};

const getBuildableMachinesFnV2 = () => {
  // Technically we should be using the connections from this?
  // const buildables = new Set(Object.keys(ConnectionsJsonV2));

  const blacklistedMachines = new Set([
    'building-equipment-descriptor-build-gun',
    'building-work-bench-integrated',
    'building-automated-work-bench',
    'building-workshop',
    'building-converter',
  ]);

  const whitelistedSinkMachines = new Set(['AFGBuildableSpaceElevator']);

  const producerMachines = Object.entries(BuildingClasses)
    .filter(([, entry]) => {
      return resourceExtractorSubclasses.has(toUnrealClassName(entry));
    })
    .map((item) => item[0]);

  const processingMachines = [
    ...new Set(
      Object.values(RecipeJson)
        .map((recipe) => recipe?.mProducedIn)
        .flat()
        .map((producedIn: any) => producedIn?.slug)
        .filter((item) => item)
    ),
  ];

  const sinkMachines = Object.entries(BuildingClasses)
    .filter(([, entry]) => {
      return whitelistedSinkMachines.has('A' + entry);
    })
    .map((item) => item[0]);

  const allMachines = new Set([
    ...producerMachines,
    ...processingMachines,
    ...sinkMachines,
  ]);

  for (const machine of blacklistedMachines) {
    allMachines.delete(machine);
  }

  const {
    machineClassMap,
    reverseMachineClassMap,
    imageMap,
  } = generateClassMap(allMachines);

  return {
    machineClassMap,
    reverseMachineClassMap,
    imageMap,
  };
};

const getBuildableConnectionsFnV2 = () => {
  const beltSubclasses = getAllSubclasses('AFGBuildableConveyorBelt');

  const belts = Object.entries(BuildingClasses)
    .filter(([, entry]) => {
      return beltSubclasses.has('A' + entry);
    })
    .map((item) => item[0]);

  const pipeSubclasses = getAllSubclasses('AFGBuildablePipeline');

  const pipes = Object.entries(BuildingClasses)
    .filter(([, entry]) => {
      return pipeSubclasses.has('A' + entry);
    })
    .map((item) => item[0]);

  const allMachines = new Set([...belts, ...pipes]);

  const {
    machineClassMap,
    reverseMachineClassMap,
    imageMap,
  } = generateClassMap(allMachines);

  return {
    machineClassMap,
    reverseMachineClassMap,
    imageMap,
  };
};

export const getBuildableConnections = memoize(getBuildableConnectionsFnV2);

const getBuildableConnectionClassesFn = () => {
  return [...getBuildableConnections().machineClassMap.keys()];
};

export const getBuildableConnectionClasses = memoize(
  getBuildableConnectionClassesFn
);

export const getTiersForConnectorClass = (connectorClass: string) => {
  return getBuildableConnections().machineClassMap.get(connectorClass);
};

export const getTiersForMachineClass = (machineClass: string) => {
  return getBuildableMachines().machineClassMap.get(machineClass);
};

export const getBuildableMachines = memoize(getBuildableMachinesFnV2);

export const getBuildableMachineClassNames = lazyFunc(() => {
  return [...getBuildableMachines().machineClassMap.keys()];
});

const getBuildableMachinesFromClassNameFn = (name: string) => {
  return getBuildableMachines().machineClassMap.get(name);
};

export const getBuildableMachinesFromClassName = memoize(
  getBuildableMachinesFromClassNameFn
);

export const getClassNameForBuildableMachine = (() => {
  const reverseClassListMap = getBuildableMachines().reverseMachineClassMap;
  return (name: string) => {
    return reverseClassListMap.get(name);
  };
})();

const getAllBuildableMachinesFn = () => {
  const classListMap = getBuildableMachines().machineClassMap;
  return [...classListMap.values()].flat();
};

export const getAllBuildableMachines = memoize(getAllBuildableMachinesFn);

export const getBuildableMachineClassIcon = (() => {
  const classImageMap = getBuildableMachines().imageMap;
  return (name: string) => {
    return classImageMap.get(name);
  };
})();

//TODO:LOCALIZE
export const getBuildingName = (slug: string) => {
  return (
    (BuildingJson as any)[slug]?.mDisplayName?.sourceString ||
    `Missing building name: ${slug}`
  );
};

export const getBuildingImageName = (slug: string) => {
  const itemSlug = slug.replace(/^building/g, 'item');

  return (ItemJson as any)[itemSlug]?.mSmallIcon?.slug;
};

export const getBuildingIcon = (slug: string, size: number) => {
  const itemSlug = slug.replace(/^building/g, 'item');

  const itemImageSlug = getBuildingImageName(itemSlug);

  return getImageFileFromSlug(itemImageSlug, size);
};

export const getBuildingDefinition = (buildingSlug: string) => {
  return (BuildingJson as any)[buildingSlug];
};

export const getTier = (buildingSlug: string) => {
  const base = getBuildableMachines();
  const map = base.reverseMachineClassMap;
  if (map.get(buildingSlug)) {
    const mainClass = map.get(buildingSlug)!;
    return base.machineClassMap.get(mainClass)!.indexOf(buildingSlug) + 1;
  } else {
    const connectionBase = getBuildableConnections();
    const connectionBaseMap = connectionBase.reverseMachineClassMap;
    if (connectionBaseMap.get(buildingSlug)) {
      const mainClass = connectionBaseMap.get(buildingSlug)!;
      return (
        connectionBase.machineClassMap.get(mainClass)!.indexOf(buildingSlug) + 1
      );
    } else {
      return 0;
    }
  }
};

function getEdgeConnections(
  building: any,
  connectionType: ConnectionTypeEnum,
  subTypeEnum: any
) {
  const outputObject = [] as ConnectionTypeEnum[];
  for (const [type, numEntries] of Object.entries(
    building?.connectionMap[`${connectionType}`] || {}
  )) {
    if (type === `${subTypeEnum}`) {
      for (let i = 0; i < (numEntries as number); i++) {
        outputObject.push(connectionType);
      }
    }
  }

  return outputObject;
}

export const getOutputsForBuilding = (
  buildingSlug: string,
  externalInteractionManager: ExternalInteractionManager
) => {
  const building = (ConnectionsJson as any)[buildingSlug];
  const outputObject: SatisGraphtoryEdgeProps[] = [];

  getEdgeConnections(
    building,
    ConnectionTypeEnum.AFGBuildableConveyorBelt,
    EFactoryConnectionDirection.FCD_OUTPUT
  ).forEach((ct) => {
    outputObject.push({
      connectionType: ct,
      id: uuidGen(),
      externalInteractionManager,
    });
  });

  getEdgeConnections(
    building,
    ConnectionTypeEnum.AFGBuildablePipeline,
    EPipeConnectionType.PCT_PRODUCER
  ).forEach((ct) => {
    outputObject.push({
      connectionType: ct,
      id: uuidGen(),
      externalInteractionManager,
    });
  });

  return outputObject;
};

export const getInputsForBuilding = (
  buildingSlug: string,
  externalInteractionManager: ExternalInteractionManager
) => {
  const building = (ConnectionsJson as any)[buildingSlug];
  const outputObject: SatisGraphtoryEdgeProps[] = [];

  getEdgeConnections(
    building,
    ConnectionTypeEnum.AFGBuildableConveyorBelt,
    EFactoryConnectionDirection.FCD_INPUT
  ).forEach((ct) => {
    outputObject.push({
      connectionType: ct,
      id: uuidGen(),
      externalInteractionManager,
    });
  });

  getEdgeConnections(
    building,
    ConnectionTypeEnum.AFGBuildablePipeline,
    EPipeConnectionType.PCT_CONSUMER
  ).forEach((ct) => {
    outputObject.push({
      connectionType: ct,
      id: uuidGen(),
      externalInteractionManager,
    });
  });

  return outputObject;
};

export const getAnyConnectionsForBuilding = (
  buildingSlug: string,
  externalInteractionManager: ExternalInteractionManager
) => {
  const building = (ConnectionsJson as any)[buildingSlug];
  const outputObject: SatisGraphtoryEdgeProps[] = [];

  let sides: EdgeAttachmentSide[] = [];

  switch (building.anyPipes) {
    case 4:
      sides.push(
        EdgeAttachmentSide.TOP,
        EdgeAttachmentSide.RIGHT,
        EdgeAttachmentSide.BOTTOM,
        EdgeAttachmentSide.LEFT
      );
      break;
    case 3:
      sides.push(
        EdgeAttachmentSide.RIGHT,
        EdgeAttachmentSide.BOTTOM,
        EdgeAttachmentSide.LEFT
      );
      break;
    case 2:
      sides.push(EdgeAttachmentSide.RIGHT, EdgeAttachmentSide.LEFT);
      break;
    case 1:
      sides.push(EdgeAttachmentSide.LEFT);
      break;
    default:
      getEdgeConnections(
        building,
        ConnectionTypeEnum.AFGBuildablePipeline,
        EPipeConnectionType.PCT_ANY
      ).forEach((ct) => {
        outputObject.push({
          biDirectional: true,
          connectionType: ct,
          id: uuidGen(),
          externalInteractionManager,
        });
      });

      return outputObject;
  }

  getEdgeConnections(
    building,
    ConnectionTypeEnum.AFGBuildablePipeline,
    EPipeConnectionType.PCT_ANY
  ).forEach((ct, index) => {
    outputObject.push({
      connectionType: ct,
      id: uuidGen(),
      biDirectional: true,
      targetNodeAttachmentSide: sides[index],
      sourceNodeAttachmentSide: sides[index],
      externalInteractionManager,
    });
  });

  return outputObject;
};

export const getSupportedConnectionTypes = (
  buildingSlug: string
): ConnectionTypeEnum[] => {
  if (!buildingSlug) return [];

  const building = (BuildingJson as any)[buildingSlug];

  if (!building)
    throw new Error('Could not find entry for building slug ' + buildingSlug);

  const buildingConnections = (ConnectionsJson as any)[buildingSlug];

  if (buildingConnections) {
    return Object.keys(buildingConnections.connectionMap).map((item) =>
      parseInt(item, 10)
    );
  }

  throw new Error(
    'Building ' + buildingSlug + ' does not support resourceForms'
  );
};

export const getConnectionTypeForEdge = (
  buildingSlug: string
): ConnectionTypeEnum => {
  if (!buildingSlug) throw new Error('buildingSlug not provided!');

  const buildingConnections = (ConnectionsJson as any)[buildingSlug];

  if (buildingConnections) {
    const connectionTypes = Object.keys(
      buildingConnections.connectionMap
    ).map((item) => parseInt(item, 10));

    if (connectionTypes.length === 1) {
      return connectionTypes[0];
    } else if (connectionTypes.length > 1) {
      throw new Error(
        'Building ' +
          buildingSlug +
          ' supports too many resourceForms, possibly not an edge'
      );
    }
  }

  throw new Error(
    'Building ' + buildingSlug + ' does not support resourceForms'
  );
};

function checkIfSameConnections(machineTypes: string[]) {
  const allConnections = [] as any[];
  for (const type of machineTypes) {
    const inputs = getInputsForBuilding(type, null as any).length;
    const outputs = getOutputsForBuilding(type, null as any).length;
    const anys = getAnyConnectionsForBuilding(type, null as any).length;
    allConnections.push(`${inputs},${outputs},${anys}`);
  }

  return allConnections.every((item) => item === allConnections[0]);
}

const waterPumpSubclasses = getAllSubclasses('AFGBuildableWaterPump');

const getConfigurableOptionsByMachineClassFn = (classSlug: string) => {
  const machineTypes = getBuildableMachinesFromClassName(classSlug)!;
  const machineTypeHaveSameConnections = checkIfSameConnections(machineTypes);

  const recipes = getRecipesByMachineClass(classSlug)!;

  const alternateRecipes = getAlternateRecipes();

  let hasAlternateRecipe = false;

  for (const recipe of recipes) {
    if (alternateRecipes.has(recipe)) {
      hasAlternateRecipe = true;
      break;
    }
  }

  let recipesOption = recipes as any;
  let recipesGrouped = false;

  if (hasAlternateRecipe) {
    const alternatives = new Set();
    const regular = new Set();
    recipesGrouped = true;
    for (const recipe of recipes) {
      if (alternateRecipes.has(recipe)) {
        alternatives.add(recipe);
      } else {
        regular.add(recipe);
      }
    }

    recipesOption = [
      {
        label: 'label-selector-alternate-recipes',
        options: [...alternatives],
      },
      {
        label: 'label-selector-normal-recipes',
        options: [...regular],
      },
    ];
  }

  const baseTypes = {
    machineType: {
      options: machineTypes,
      mutable: machineTypeHaveSameConnections,
    },
    recipe: {
      options: recipesOption,
      grouped: recipesGrouped,
      mutable: false,
    },
  } as Record<string, any>;

  const sampleMachine = machineTypes[0]!;
  const classType = toUnrealClassName(
    (BuildingClasses as any)[sampleMachine as string]
  );

  const buildingDefinition = getBuildingDefinition(sampleMachine);

  if (resourceExtractorSubclasses.has(classType)) {
    if (waterPumpSubclasses.has(classType)) {
      baseTypes.nodePurity = {
        options: [EResourcePurity.RP_Normal],
        translations: [EResourcePurityDisplayName[EResourcePurity.RP_Normal]],
      };
    } else {
      const purityNames = getEnumDisplayNames(
        EResourcePurity,
        EResourcePurityDisplayName
      );
      const purityValues = getEnumValues(EResourcePurity).slice(
        0,
        purityNames.length
      );
      baseTypes.nodePurity = {
        options: purityValues,
        translations: purityNames,
      };
    }

    if (buildingDefinition.mOnlyAllowCertainResources) {
      baseTypes.extractedItem = {
        options: (buildingDefinition.mAllowedResources || []).map(
          (item: any) => item.slug
        ),
        mutable: false,
      };
    } else {
      const allowedResources = (buildingDefinition.mAllowedResourceForms || [])
        .map((rf: number) => {
          return getResourcesByForm(rf);
        })
        .flat();
      baseTypes.extractedItem = {
        options: allowedResources,
        mutable: false,
      };
    }
  }

  if (buildingDefinition.mCanChangePotential) {
    baseTypes.overclock = {
      mathExpression: true,
      minValue: 0,
      maxValue: 250,
      defaultValue: 100,
      type: 'number',
    };
  }

  return baseTypes;
};

export const getConfigurableOptionsByMachineClass = memoize(
  getConfigurableOptionsByMachineClassFn
);

//@BROKEN
export const getConnectionsByConnectionType = (
  resourceForm: EResourceForm
): string[] => {
  const supportedBuildings = [];

  const whitelistedConnections = [
    ...getBuildableConnections().reverseMachineClassMap.keys(),
  ];
  for (const connection of whitelistedConnections) {
    const building = (BuildingJson as any)[connection];

    if (new Set(building.mAllowedResourceForms || []).has(resourceForm)) {
      supportedBuildings.push(connection);
    }
  }

  return supportedBuildings;
};
