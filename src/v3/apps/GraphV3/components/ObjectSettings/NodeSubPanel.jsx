import { Button, Divider } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import React from 'react';
import Scrollbar from 'react-scrollbars-custom';
import MachineClassGroupSubPanel from 'v3/apps/GraphV3/components/ObjectSettings/MachineClassGroupSubPanel';
import { deleteNodes } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/canvas/childrenApi';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';
import { getClassNameForBuildableMachine } from 'v3/data/loaders/buildings';

function calculateMachineMap(nodes) {
  const machineMap = new Map();
  for (const node of nodes) {
    const className = getClassNameForBuildableMachine(node.machineName);
    if (!machineMap.has(className)) {
      machineMap.set(className, new Set());
    }

    machineMap.get(className).add(node.machineName);
  }

  const sortedMachineMap = new Map();

  for (const [key, entry] of machineMap) {
    sortedMachineMap.set(key, [...entry].sort());
  }

  return {
    sortedMachineMap,
    machineClassNames: [...machineMap.keys()].sort(),
  };
}

function NodeSubPanel(props) {
  const { pixiCanvasStateId } = React.useContext(PixiJSCanvasContext);

  const { classes, nodes } = props;

  const machineMap = calculateMachineMap(nodes);

  return (
    <Scrollbar>
      <div className={classes.tabContent}>
        <Button
          onClick={() => {
            deleteNodes(pixiCanvasStateId, nodes);
          }}
          color="secondary"
          variant="contained"
          startIcon={<DeleteIcon />}
        >
          Delete ALL selected nodes
        </Button>
        <Divider className={classes.divider} />
        {machineMap.machineClassNames.map((machineClassName, index) => {
          const machineNames = new Set(
            machineMap.sortedMachineMap.get(machineClassName)
          );
          return (
            <React.Fragment key={machineClassName}>
              <MachineClassGroupSubPanel
                machineClassName={machineClassName}
                machineNames={[...machineNames]}
                nodes={nodes.filter((node) =>
                  machineNames.has(node.machineName)
                )}
              />
              {index !== machineMap.machineClassNames.length - 1 ? (
                <Divider className={classes.divider} />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </Scrollbar>
  );
}

export default NodeSubPanel;
