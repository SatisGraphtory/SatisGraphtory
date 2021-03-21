import { getUnrealClassForBuilding } from 'v3/data/loaders/buildings';
import ResourceExtractorV2 from '../ResourceExtractorV2';
import ManufacturerV2 from '../ManufacturerV2';
import SimulationManager from '../../manager/SimulationManager';
import BeltV2 from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/edges/BeltV2';
import { NodeTemplate } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/NodeTemplate';

export const getSimulatableNode = (
  node: NodeTemplate,
  buildingSlug: string,
  buildingOptions: Map<string, any>,
  simulationManager: SimulationManager
) => {
  const unrealClass = getUnrealClassForBuilding(buildingSlug);
  switch (unrealClass) {
    case 'FGBuildableResourceExtractor':
      return new ResourceExtractorV2(
        node,
        buildingSlug,
        buildingOptions,
        simulationManager
      );
    case 'FGBuildableManufacturer':
      return new ManufacturerV2(
        node,
        buildingSlug,
        buildingOptions,
        simulationManager
      );
    default:
      throw new Error('Unimplemented class ' + unrealClass);
  }
};

export const getSimulatableEdge = (
  id: string,
  connectionSlug: string,
  beltOptions: Map<string, any>,
  simulationManager: SimulationManager
) => {
  const unrealClass = getUnrealClassForBuilding(connectionSlug);
  switch (unrealClass) {
    case 'FGBuildableConveyorBelt':
      return new BeltV2(id, connectionSlug, simulationManager);
    default:
      throw new Error('Unimplemented class ' + unrealClass);
  }
};
