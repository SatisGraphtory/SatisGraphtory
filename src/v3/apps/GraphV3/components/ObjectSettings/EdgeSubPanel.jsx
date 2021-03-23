import { Button, ButtonGroup, Divider, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import FastForwardIcon from '@material-ui/icons/FastForward';
import FastRewindIcon from '@material-ui/icons/FastRewind';
import RemoveIcon from '@material-ui/icons/Remove';
import React from 'react';
import Scrollbar from 'react-scrollbars-custom';
import { deleteEdges } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/core/api/canvas/childrenApi';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';

function EdgeSubPanel(props) {
  const { pixiCanvasStateId } = React.useContext(PixiJSCanvasContext);

  const { classes, edges } = props;

  return (
    <Scrollbar>
      <div className={classes.tabContent}>
        <Typography variant="h5">All Belt Settings</Typography>
        <Divider className={classes.divider} />

        <Button
          color="secondary"
          variant="contained"
          onClick={() => {
            deleteEdges(pixiCanvasStateId, edges);
          }}
          startIcon={<DeleteIcon />}
          // fullwidth
        >
          Delete ALL selected belts
        </Button>
        <Divider className={classes.divider} />

        <Typography variant="h6">Set ALL Belt Tiers</Typography>
        <ButtonGroup fullWidth>
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
        {/* <Divider className={classes.divider} /> */}
      </div>
    </Scrollbar>
  );
}

export default EdgeSubPanel;
