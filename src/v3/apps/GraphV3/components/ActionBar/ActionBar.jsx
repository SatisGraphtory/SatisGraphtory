import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { makeStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import AddIcon from '@material-ui/icons/Add';
import CropFreeIcon from '@material-ui/icons/CropFree';
import LinkIcon from '@material-ui/icons/Link';
import OpenWithIcon from '@material-ui/icons/OpenWith';
import { motion, useAnimation } from 'framer-motion';
import React from 'react';
import MouseState from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/enums/MouseState';
import { GlobalGraphAppStore } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStore';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';

const useStyles = makeStyles((theme) => ({
  default: {
    zIndex: theme.zIndex.drawer,
  },
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: theme.zIndex.drawer + 1,
  },
  navigation: {
    borderRadius: 5,
    pointerEvents: 'auto',
  },
  simulationDisabledButtons: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
}));

const blacklistedSimulationRunningMouseStates = new Set([
  MouseState.ADD,
  MouseState.LINK,
]);

function ActionBar() {
  const classes = useStyles();
  const domRef = React.useRef();

  const {
    mouseState,
    pixiCanvasStateId,
    canvasReady: loaded,
    applicationLoaded,
    simulationRunning,
  } = React.useContext(PixiJSCanvasContext);

  React.useEffect(() => {
    if (!domRef.current) return;
    if (!applicationLoaded) return;

    GlobalGraphAppStore.update((t) => {
      const s = t[pixiCanvasStateId];

      // TODO: find out why this is happening
      if (!s?.aliasCanvasObjects) {
        window.location.reload();
      }

      s.aliasCanvasObjects.add(domRef.current);
    });

    const thisRef = domRef.current;

    return () => {
      GlobalGraphAppStore.update((t) => {
        const s = t[pixiCanvasStateId];
        if (s.aliasCanvasObjects) {
          s.aliasCanvasObjects.delete(thisRef);
        }
      });
    };
  }, [applicationLoaded, domRef, pixiCanvasStateId]);

  const handleModeChange = React.useCallback(
    (event, value) => {
      GlobalGraphAppStore.update((s) => {
        if (value !== s[pixiCanvasStateId].mouseMode) {
          s[pixiCanvasStateId].mouseState = value;
        }
      });
    },
    [pixiCanvasStateId]
  );

  React.useEffect(() => {
    if (
      simulationRunning &&
      blacklistedSimulationRunningMouseStates.has(mouseState)
    ) {
      GlobalGraphAppStore.update((s) => {
        s[pixiCanvasStateId].mouseState = MouseState.MOVE;
      });
    }
  }, [mouseState, pixiCanvasStateId, simulationRunning]);

  const controls = useAnimation();

  React.useEffect(() => {
    if (loaded) {
      controls.start('visible');
    }
  }, [controls, loaded]);

  const simulationRunningClasses = simulationRunning
    ? {
        wrapper: classes.simulationDisabledButtons,
      }
    : {};

  return (
    <div className={classes.root}>
      <motion.div
        animate={controls}
        initial="hidden"
        variants={{
          visible: { y: 0 },
          hidden: { y: 200 },
        }}
      >
        <BottomNavigation
          value={mouseState}
          onChange={handleModeChange}
          className={classes.navigation}
          ref={domRef}
          component={TooltipEnabledBottomNav}
          disabledByRunningSimulation={simulationRunning}
        >
          <BottomNavigationAction
            label="Move"
            value={MouseState.MOVE}
            icon={<OpenWithIcon />}
          />
          <BottomNavigationAction
            label="Select"
            value={MouseState.SELECT}
            icon={<CropFreeIcon />}
          />
          <BottomNavigationAction
            label="Add"
            value={MouseState.ADD}
            icon={<AddIcon />}
            classes={simulationRunningClasses}
            disabled={simulationRunning}
          />
          <BottomNavigationAction
            label="Link"
            value={MouseState.LINK}
            icon={
              <Tooltip title={'WAHOOO'} placement="top" arrow>
                <LinkIcon />
              </Tooltip>
            }
            classes={simulationRunningClasses}
            disabled={simulationRunning}
          />
        </BottomNavigation>
      </motion.div>
    </div>
  );
}

function BottomNavCustomComponent({
  innerRef,
  disabledByRunningSimulation,
  ...props
}) {
  return (
    <Tooltip
      arrow
      open={disabledByRunningSimulation}
      title={'Add and Link are disabled when simulation is running'}
    >
      <div ref={innerRef} {...props} />
    </Tooltip>
  );
}

const TooltipEnabledBottomNav = React.forwardRef((props, ref) => (
  <BottomNavCustomComponent innerRef={ref} {...props} />
));

export default React.memo(ActionBar);
