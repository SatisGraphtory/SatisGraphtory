import { Button, Divider, Typography } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
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
      </div>
    </Scrollbar>
  );
}

export default EdgeSubPanel;
