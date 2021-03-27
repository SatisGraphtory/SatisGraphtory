import { MachineNodeTemplate } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/MachineNodeTemplate';
import EdgeTemplate from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';
import { GraphObjectProps } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/interfaces/GraphObject';
import { EdgeAttachmentSide } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeAttachmentSide';
import { ConnectionTypeEnum } from '.DataWarehouse/enums/dataEnums';

export interface SatisGraphtoryNodeProps extends GraphObjectProps {
  id: string;
  inputConnections?: EdgeTemplate[];
  outputConnections?: EdgeTemplate[];
  anyConnections?: EdgeTemplate[];
  machineName: string;
  position: SatisGraphtoryCoordinate;
  additionalData?: Record<string, any>;
  translateFunction: (inputString: string) => string;
}

export interface SatisGraphtoryEdgeProps extends GraphObjectProps {
  id: string;
  connectionType?: ConnectionTypeEnum;
  sourceNode?: MachineNodeTemplate;
  targetNode?: MachineNodeTemplate;
  sourceNodeAttachmentSide?: EdgeAttachmentSide;
  targetNodeAttachmentSide?: EdgeAttachmentSide;
  useProvidedAttachmentSides?: boolean;
  connectorName?: string;
  connectorLabel?: string;
  biDirectional?: Boolean;
  ignoreLinking?: Boolean;
}

export interface SatisGraphtoryCoordinate {
  x: number;
  y: number;
}
