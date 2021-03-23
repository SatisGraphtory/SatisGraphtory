// import {OutlinedInput,} from '@material-ui/core';
import Drawer from '@material-ui/core/Drawer';
import { makeStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import CategoryIcon from '@material-ui/icons/Category';
import DeviceHubIcon from '@material-ui/icons/DeviceHub';
import React from 'react';
import EdgeSubPanel from 'v3/apps/GraphV3/components/ObjectSettings/EdgeSubPanel';
import NodeSubPanel from 'v3/apps/GraphV3/components/ObjectSettings/NodeSubPanel';
import MouseState from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/enums/MouseState';
import EdgeTemplate from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Edge/EdgeTemplate';
import { NodeTemplate } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/objects/Node/NodeTemplate';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: theme.overrides.GraphDrawer.width,
    marginTop: theme.overrides.GraphAppBar.height,
    height: `calc(100% - ${theme.overrides.GraphAppBar.height}px)`,
  },
  drawerContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexGrow: 1,
  },
  tabContent: {
    padding: 20,
    pointerEvents: 'auto',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexGrow: 1,
  },
  fab: {
    position: 'fixed',
    bottom: '2em',
    right: '2em',
    zIndex: theme.zIndex.drawer + 1,
  },
  fabMobile: {
    position: 'fixed',
    bottom: '7em',
    right: '2em',
    zIndex: theme.zIndex.drawer + 1,
  },
  overclockTextField: {
    minWidth: 80,
  },
  divider: {
    marginTop: 10,
    marginBottom: 10,
  },
  expandPanel: {
    flexDirection: 'column',
  },
  tiers: {
    flexDirection: 'column',
  },
  buttonText: {
    // color: 'white',
  },
  root: {
    gridArea: 'sidebar',
    display: 'grid',
    // width: theme.overrides.GraphDrawer.width //TODO: DOCK
  },
}));

// const CustomOutlinedInput = ({
//   color,
//   disableElevation,
//   disableRipple,
//   disableFocusRipple,
//   ...otherProps
// }) => <OutlinedInput {...otherProps} />;
//
// const StyledInput = withStyles(() => ({
//   input: {
//     borderRadius: 0,
//     textAlign: 'center',
//     paddingLeft: 0,
//     paddingRight: 0,
//     width: 80,
//     height: '0em',
//   },
//   root: {
//     padding: 0,
//   },
// }))(CustomOutlinedInput);

function ObjectSettingPanel(props) {
  const classes = useStyles();
  const [tabValue, setTabValue] = React.useState(0);

  function handleChange(event, newValue) {
    setTabValue(newValue);
  }

  const { mouseState, selectedObjects, applicationLoaded } = React.useContext(
    PixiJSCanvasContext
  );

  const edges = selectedObjects?.filter((item) => {
    if (item instanceof EdgeTemplate) {
      return true;
    } else if (item instanceof NodeTemplate) {
      return false;
    }

    throw new Error('Not instance of something handled');
  });

  const nodes = selectedObjects?.filter((item) => {
    if (item instanceof EdgeTemplate) {
      return false;
    } else if (item instanceof NodeTemplate) {
      return true;
    }

    throw new Error('Not instance of something handled');
  });

  const numNodes = nodes?.length;
  const numEdges = edges?.length;

  React.useEffect(() => {
    if (numEdges && !numNodes) {
      setTabValue(1);
    }

    if (numNodes && !numEdges) {
      setTabValue(0);
    }
  }, [numEdges, numNodes]);

  if (!applicationLoaded) return null;

  return (
    <Drawer
      variant="permanent" //TODO: DOCK permanent
      anchor={'left'}
      open={mouseState === MouseState.SELECT && selectedObjects.length > 0}
      onClose={() => {}}
      classes={{
        paper: classes.drawer,
        root: classes.root,
      }}
    >
      <div className={classes.drawerContent}>
        <Tabs
          value={tabValue}
          onChange={handleChange}
          variant="fullWidth"
          centered
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label="Nodes"
            disabled={numNodes === 0}
            icon={<CategoryIcon />}
          />
          <Tab
            label="Edges"
            disabled={numEdges === 0}
            icon={<DeviceHubIcon />}
          />
        </Tabs>
        {tabValue === 0 && <NodeSubPanel classes={classes} nodes={nodes} />}
        {tabValue === 1 && <EdgeSubPanel classes={classes} edges={edges} />}
      </div>
    </Drawer>
  );
}

export default ObjectSettingPanel;
