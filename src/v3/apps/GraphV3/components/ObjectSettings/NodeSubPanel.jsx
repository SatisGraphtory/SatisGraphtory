import { Button } from '@material-ui/core';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import React from 'react';
import Scrollbar from 'react-scrollbars-custom';
import MachineClassGroupSubPanel from 'v3/apps/GraphV3/components/ObjectSettings/MachineClassGroupSubPanel';
import { deleteNodes } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/canvas/childrenApi';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';
import { LocaleContext } from 'v3/components/LocaleProvider';
import { getClassNameForBuildableMachine } from 'v3/data/loaders/buildings';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

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

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    marginTop: 20,
  },
  deleteButtonSpacer: {
    flexGrow: 1,
  },
  tabContent: {
    padding: 20,
    pointerEvents: 'auto',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
}));

function NodeSubPanel(props) {
  const { pixiCanvasStateId } = React.useContext(PixiJSCanvasContext);
  const { translate } = React.useContext(LocaleContext);
  const { nodes } = props;

  const classes = useStyles();

  const machineMap = calculateMachineMap(nodes);

  const [expanded, setExpanded] = React.useState(
    machineMap.machineClassNames[0]
  );

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : '');
  };

  const firstMachineName = machineMap.machineClassNames[0];

  React.useEffect(() => {
    setExpanded(firstMachineName);
  }, [firstMachineName, nodes]);

  return (
    <Scrollbar>
      <div className={classes.tabContent}>
        {machineMap.machineClassNames.map((machineClassName, index) => {
          const machineNames = new Set(
            machineMap.sortedMachineMap.get(machineClassName)
          );
          return (
            <Accordion
              TransitionProps={{ unmountOnExit: true }}
              key={machineClassName}
              expanded={expanded === machineClassName}
              onChange={handleChange(machineClassName)}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1bh-content"
                id="panel1bh-header"
              >
                <Typography variant="h6">
                  {translate(machineClassName)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MachineClassGroupSubPanel
                  machineClassName={machineClassName}
                  machineNames={[...machineNames]}
                  nodes={nodes.filter((node) =>
                    machineNames.has(node.machineName)
                  )}
                />
                {/*{index !== machineMap.machineClassNames.length - 1 ? (*/}
                {/*  <Divider className={classes.divider} />*/}
                {/*) : null}*/}
              </AccordionDetails>
            </Accordion>
          );
        })}
        <div className={classes.deleteButtonSpacer} />
        <Button
          onClick={() => {
            deleteNodes(pixiCanvasStateId, nodes);
          }}
          className={classes.deleteButton}
          color="secondary"
          variant="contained"
          startIcon={<DeleteIcon />}
        >
          Delete ALL selected nodes
        </Button>
      </div>
    </Scrollbar>
  );
}

export default NodeSubPanel;
