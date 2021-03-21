import { gt } from 'semver';
import * as protobuf from 'protobufjs/light';

import {
  buildingEnums,
  itemEnums,
  recipeEnums,
} from '.DataWarehouse/enums/dataEnums';

const createEnumMap = (enumSource: any) => {
  const baseEnums: Record<string, number> = {};
  for (const enumValue in enumSource) {
    if (isNaN(Number(enumValue))) {
      baseEnums[enumValue] = enumSource[enumValue];
    }
  }

  return baseEnums;
};

export const getSchemaForVersion = (version: string) => {
  const Root = protobuf.Root,
    Type = protobuf.Type,
    Field = protobuf.Field,
    Enum = protobuf.Enum;

  const buildingEnumMappings = createEnumMap(buildingEnums);
  const BuildingEnums = new Enum('BuildingEnum', buildingEnumMappings, {
    allow_alias: true,
  });

  const itemEnumMappings = createEnumMap(itemEnums);
  const ItemEnums = new Enum('ItemEnum', itemEnumMappings, {
    allow_alias: true,
  });

  const recipeEnumMappings = createEnumMap(recipeEnums);
  const RecipeEnums = new Enum('RecipeEnum', recipeEnumMappings, {
    allow_alias: true,
  });

  // 2: ['recipeId', 'RecipeEnum'],
  const nodeAdditionalOptionsSchema: Record<number, any[]> = {
    1: ['recipe', 'RecipeEnum'],
    2: ['extractedItem', 'ItemEnum'],
    3: ['nodePurity', 'uint32'],
    4: ['overclock', 'uint32'],
  };

  const NodeAdditionalSettingsMessage = new Type(
    'NodeAdditionalSettingsMessage'
  );

  for (const [id, entry] of Object.entries(nodeAdditionalOptionsSchema)) {
    const [fieldName, fieldType, fieldRule] = entry;
    NodeAdditionalSettingsMessage.add(
      new Field(fieldName, parseInt(id, 10), fieldType, fieldRule || {})
    );
  }

  // 2: ['recipeId', 'RecipeEnum'],
  const baseNodeSchema: Record<number, any[]> = {
    1: ['id', 'uint32'],
    2: ['overclock', 'uint32'],
    3: ['inputs', 'uint32', 'repeated'],
    4: ['outputs', 'uint32', 'repeated'],
    5: ['any', 'uint32', 'repeated'],
    6: ['machineTypeId', 'BuildingEnum'],
    7: ['x', 'double'],
    8: ['y', 'double'],
    9: ['additionalData', 'NodeAdditionalSettingsMessage'],
    // TODO: Group?
  };

  const NodeMessage = new Type('Node');

  for (const [id, entry] of Object.entries(baseNodeSchema)) {
    const [fieldName, fieldType, fieldRule] = entry;
    NodeMessage.add(
      new Field(fieldName, parseInt(id, 10), fieldType, fieldRule || {})
    );
  }

  const baseEdgeSchema = {
    1: ['id', 'uint32'],
    2: ['connectionType', 'uint32'],
    3: ['sourceNodeId', 'uint32'],
    4: ['targetNodeId', 'uint32'],
    5: ['biDirectional', 'bool'],
    6: ['sourceNodeAttachmentSide', 'uint32'],
    7: ['targetNodeAttachmentSide', 'uint32'],
    8: ['connectorTypeId', 'BuildingEnum'],
  };

  const EdgeMessage = new Type('Edge');

  for (const [id, [fieldName, fieldType]] of Object.entries(baseEdgeSchema)) {
    EdgeMessage.add(new Field(fieldName, parseInt(id, 10), fieldType));
  }

  const SerializedDataMessage = new Type('SGSave');
  SerializedDataMessage.add(new Field('edges', 1, 'Edge', 'repeated'));
  SerializedDataMessage.add(new Field('nodes', 2, 'Node', 'repeated'));

  const root = new Root()
    .add(ItemEnums)
    .add(RecipeEnums)
    .add(BuildingEnums)
    .add(NodeAdditionalSettingsMessage)
    .add(NodeMessage)
    .add(EdgeMessage)
    .add(SerializedDataMessage);

  // The way to use semver to increment the schema.
  if (gt(version, '99.99.99')) {
    console.log('Something went wrong!');
  }

  return root;
};
