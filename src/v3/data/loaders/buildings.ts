import lazyFunc from 'v3/utils/lazyFunc';
import memoize from 'fast-memoize';
import {
  EFactoryConnectionDirection,
  EPipeConnectionType,
  EResourceForm,
} from '.DataLanding/interfaces/enums';
import uuidGen from 'v3/utils/stringUtils';
import { EdgeAttachmentSide } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeAttachmentSide';
import ExternalInteractionManager from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/interfaces/ExternalInteractionManager';
import { SatisGraphtoryEdgeProps } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/types';

import ItemJson from '.DataWarehouse/main/Items.json';
import BuildingJson from '.DataWarehouse/main/Buildings.json';
import BuildingClasses from '.DataWarehouse/main/BuildingClasses.json';
import BuildingClassMap from '.DataWarehouse/main/BuildingClassMap.json';
import RecipeJson from '.DataWarehouse/main/Recipes.json';
import ConnectionsJson from '.DataWarehouse/main/Connections.json';
import { getImageFileFromSlug } from './images';

const getAllSubclasses = (baseClass: string) => {
  const allClasses = new Set<string>();
  allClasses.add(baseClass);
  for (const claz of (BuildingClassMap as any)[baseClass] || []) {
    for (const subclass of getAllSubclasses(claz)) {
      allClasses.add(subclass);
    }
  }

  return allClasses;
};

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

  const resourceExtractorSubclasses = getAllSubclasses(
    'AFGBuildableResourceExtractor'
  );

  const producerMachines = Object.entries(BuildingClasses)
    .filter(([, entry]) => {
      return resourceExtractorSubclasses.has('A' + entry);
    })
    .map((item) => item[0]);

  const processingMachines = [
    ...new Set(
      Object.values(RecipeJson)
        .map((recipe) => recipe?.mProducedIn)
        .flat()
        .map((producedIn) => producedIn?.slug)
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

export const getTiersForConnectionClass = (connectionClass: string) => {
  return getBuildableConnections().machineClassMap.get(connectionClass);
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
  resourceForm: EResourceForm,
  subTypeEnum: any
) {
  const outputObject = [] as EResourceForm[];
  for (const [type, numEntries] of Object.entries(
    building?.resourceFormMap[`${resourceForm}`] || {}
  )) {
    if (type === `${subTypeEnum}`) {
      for (let i = 0; i < (numEntries as number); i++) {
        outputObject.push(resourceForm);
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
    EResourceForm.RF_SOLID,
    EFactoryConnectionDirection.FCD_OUTPUT
  ).forEach((rf) => {
    outputObject.push({
      resourceForm: rf,
      id: uuidGen(),
      externalInteractionManager,
    });
  });

  getEdgeConnections(
    building,
    EResourceForm.RF_LIQUID,
    EPipeConnectionType.PCT_PRODUCER
  ).forEach((rf) => {
    outputObject.push({
      resourceForm: rf,
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
    EResourceForm.RF_SOLID,
    EFactoryConnectionDirection.FCD_INPUT
  ).forEach((rf) => {
    outputObject.push({
      resourceForm: rf,
      id: uuidGen(),
      externalInteractionManager,
    });
  });

  getEdgeConnections(
    building,
    EResourceForm.RF_LIQUID,
    EPipeConnectionType.PCT_CONSUMER
  ).forEach((rf) => {
    outputObject.push({
      resourceForm: rf,
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
        EResourceForm.RF_LIQUID,
        EPipeConnectionType.PCT_ANY
      ).forEach((rf) => {
        outputObject.push({
          biDirectional: true,
          resourceForm: rf,
          id: uuidGen(),
          externalInteractionManager,
        });
      });

      return outputObject;
  }

  getEdgeConnections(
    building,
    EResourceForm.RF_LIQUID,
    EPipeConnectionType.PCT_ANY
  ).forEach((rf, index) => {
    outputObject.push({
      resourceForm: rf,
      id: uuidGen(),
      biDirectional: true,
      targetNodeAttachmentSide: sides[index],
      sourceNodeAttachmentSide: sides[index],
      externalInteractionManager,
    });
  });

  return outputObject;
};

export const getSupportedResourceForm = (
  buildingSlug: string
): EResourceForm[] => {
  if (!buildingSlug) return [];

  const building = (BuildingJson as any)[buildingSlug];

  if (!building)
    throw new Error('Could not find entry for building slug ' + buildingSlug);

  if (building.mAllowedResourceForms) {
    return building.mAllowedResourceForms;
  }

  const buildingConnections = (ConnectionsJson as any)[buildingSlug];

  if (buildingConnections) {
    return Object.keys(buildingConnections.resourceFormMap).map((item) =>
      parseInt(item, 10)
    );
  }

  throw new Error(
    'Building ' + buildingSlug + ' does not support resourceForms'
  );
};

//@BROKEN
export const getConnectionsByResourceForm = (
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
