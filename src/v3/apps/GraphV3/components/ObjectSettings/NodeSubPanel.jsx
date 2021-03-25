import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
  ButtonGroup,
  Divider,
  Typography,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FastForwardIcon from '@material-ui/icons/FastForward';
import FastRewindIcon from '@material-ui/icons/FastRewind';
import RemoveIcon from '@material-ui/icons/Remove';
import SelectDropdown from 'common/react/SelectDropdown';
import React from 'react';
import Scrollbar from 'react-scrollbars-custom';
import { deleteNodes } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/canvas/childrenApi';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';
import {
  getClassNameForBuildableMachine,
  getTiersForMachineClass,
} from 'v3/data/loaders/buildings';

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
    machineNames: [...machineMap.keys()].sort(),
  };
}

function NodeSubPanel(props) {
  const { pixiCanvasStateId } = React.useContext(PixiJSCanvasContext);

  const { classes, nodes } = props;

  const machineMap = calculateMachineMap(nodes);

  // console.log(machineMap)

  if (nodes.length === 1) {
    // const derp = getTiersForMachineClass(nodes[0].);
    const machineClass = getClassNameForBuildableMachine(nodes[0].machineName);
    const tiers = getTiersForMachineClass(machineClass);
    console.log(machineClass, tiers);
  }

  // Tiers: Set to Max, Set to Min
  // Set Overclocks

  return (
    <Scrollbar>
      <div className={classes.tabContent}>
        <Typography variant="h5">All Node Settings</Typography>
        <Divider className={classes.divider} />
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
        {machineMap.machineNames.map((name) => {
          console.log(machineMap.sortedMachineMap.get(name));
          return null;
        })}
        <Divider className={classes.divider} />

        {/*<QuantitySelector*/}
        {/*  fullWidth*/}
        {/*  readonlyInput*/}
        {/*  setAmountFunctionFastBackward={() => {*/}
        {/*    tierSelector(-100);*/}
        {/*  }}*/}
        {/*  setAmountFunctionBackward={() => {*/}
        {/*    tierSelector(-1);*/}
        {/*  }}*/}
        {/*  setAmountFunctionForward={() => {*/}
        {/*    tierSelector(1);*/}
        {/*  }}*/}
        {/*  setAmountFunctionFastForward={() => {*/}
        {/*    tierSelector(100);*/}
        {/*  }}*/}
        {/*  amount={translate('tier-selector-' + selectedEdgeTier)}*/}
        {/*  buttonColor={{*/}
        {/*    fastBackwardColor: 'secondary',*/}
        {/*    backwardColor: 'secondary',*/}
        {/*    forwardColor: 'primary',*/}
        {/*    fastForwardColor: 'primary',*/}
        {/*  }}*/}
        {/*  styledInputClass={classes.markSelectorInput}*/}
        {/*  styledRootClass={classes.inputRoot}*/}
        {/*  // styledInputClass={classes.styledInput}*/}
        {/*/>*/}

        <Divider className={classes.divider} />
        <Typography variant="h5">By Machine Class</Typography>
        <Accordion square>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Miners</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.expandPanel}>
            <Typography variant="body1">Recipe</Typography>
            <SelectDropdown fullWidth />
            <Divider className={classes.divider} />

            {/* <div className={classes.tiers}> */}
            <Typography variant="body1">Machine Level</Typography>
            <ButtonGroup fullWidth disableElevation>
              <Button color="secondary" className={classes.iconButton}>
                <FastRewindIcon />
              </Button>
              <Button color="secondary" className={classes.iconButton}>
                <RemoveIcon />
              </Button>
              <Button
                disableRipple
                disableFocusRipple
                disableTouchRipple
                className={classes.buttonText}
              >
                Mark 1
              </Button>
              <Button color="primary" className={classes.iconButton}>
                <AddIcon />
              </Button>
              <Button color="primary" className={classes.iconButton}>
                <FastForwardIcon />
              </Button>
            </ButtonGroup>
            <Divider className={classes.divider} />

            <Typography variant="body1">
              Miner Efficiency (Overclock %)
            </Typography>
            <div className={classes.overclockRow}>
              <ButtonGroup disableElevation fullWidth>
                <Button color="secondary" className={classes.iconButton}>
                  <FastRewindIcon />
                </Button>
                <Button color="secondary" className={classes.iconButton}>
                  <RemoveIcon />
                </Button>
                <Button color="primary" className={classes.iconButton}>
                  <AddIcon />
                </Button>
                <Button color="primary" className={classes.iconButton}>
                  <FastForwardIcon />
                </Button>
              </ButtonGroup>
            </div>
          </AccordionDetails>
          <AccordionActions>
            <Button color="secondary" variant="contained">
              <DeleteIcon />
            </Button>
          </AccordionActions>
        </Accordion>
        <Accordion square>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Constructors</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1">Recipe</Typography>
          </AccordionDetails>
          <AccordionActions>
            <Button color="secondary" variant="contained">
              <DeleteIcon />
            </Button>
          </AccordionActions>
        </Accordion>
      </div>
    </Scrollbar>
  );
}

export default NodeSubPanel;
