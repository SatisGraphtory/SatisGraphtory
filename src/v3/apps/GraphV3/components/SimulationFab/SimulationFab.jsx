import { makeStyles } from '@material-ui/core/styles';

import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
// import ReplayIcon from '@material-ui/icons/Replay';
import StopIcon from '@material-ui/icons/Stop';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import { motion, useAnimation } from 'framer-motion';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';

const useStyles = makeStyles((theme) => ({
  fab: {
    position: 'absolute',
    bottom: '2em',
    left: '2em',
    zIndex: theme.zIndex.drawer + 1,
  },
  fabMobile: {
    position: 'absolute',
    bottom: '7em',
    left: '2em',
    zIndex: theme.zIndex.drawer + 1,
  },
  fabMotion: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
}));

function SimulationFab() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleOpen = (evt, source) => {
    if (source === 'toggle') {
      setOpen(true);
    }
  };

  const handleClose = (evt, source) => {
    if (source === 'toggle') {
      setOpen(false);
    }
  };

  const controls = useAnimation();

  const { canvasReady: loaded, externalInteractionManager } = React.useContext(
    PixiJSCanvasContext
  );

  React.useEffect(() => {
    if (loaded) {
      const promise = controls.start('visible');
      promise.then(() => {
        setOpen(true);
      });
    }
  }, [controls, loaded]);

  const numTicks = React.useRef(-1);
  const timeoutRef = React.useRef(null);

  // This is to clean up the timeout refs
  React.useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const ref = timeoutRef.current;
      if (ref) {
        clearTimeout(ref);
      }
    };
  }, []);

  const handleSimulation = React.useCallback(
    (e, actionName) => {
      const simulationManager = externalInteractionManager.getSimulationManager();
      if (actionName === 'Play') {
        if (numTicks.current === -1) {
          simulationManager.prepare();
          numTicks.current = 0;
        }

        console.log('Simulation manager working!');

        timeoutRef.current = setTimeout(() => {});

        function tick() {
          for (let x = 0; x < 10; x++) {
            simulationManager.tick();
          }
          numTicks.current += 10;
          if (numTicks.current < 100000) {
            timeoutRef.current = setTimeout(tick);
          } else {
            timeoutRef.current = null;
          }
        }

        timeoutRef.current = setTimeout(tick);

        console.log('Simulation manager Ended!');
      } else if (actionName === 'Pause') {
        console.log('Paused Simulation');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      } else if (actionName === 'Stop') {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        numTicks.current = -1;
        setIsPlaying(false);
        simulationManager.resetAll();
      }
    },
    [externalInteractionManager]
  );

  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    // <Fab
    //   color="primary"
    //   className={isMobile ? classes.fabMobile : classes.fab}
    //   onClick={fabAction}
    // >
    //   <SettingsApplicationsIcon />
    // </Fab>
    <div className={classes.root}>
      <motion.div
        className={classes.fabMotion}
        animate={controls}
        initial="hidden"
        variants={{
          visible: { x: 0 },
          hidden: { x: -200 },
        }}
      >
        <SpeedDial
          ariaLabel="Simulation"
          className={isMobile ? classes.fabMobile : classes.fab}
          icon={<PlayCircleFilledIcon />}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
        >
          <SpeedDialAction
            icon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            tooltipTitle={isPlaying ? 'Pause' : 'Play'}
            tooltipOpen
            tooltipPlacement="right"
            onClick={(e) => {
              setIsPlaying(!isPlaying);
              handleSimulation(e, isPlaying ? 'Pause' : 'Play');
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          />
          {numTicks.current < 0 ? null : (
            <SpeedDialAction
              icon={<StopIcon />}
              disabled
              tooltipTitle={'Stop'}
              tooltipOpen
              tooltipPlacement="right"
              onClick={(e) => {
                handleSimulation(e, 'Stop');
              }}
              title={'Stop'}
            />
          )}
        </SpeedDial>
      </motion.div>
    </div>
  );
}

export default React.memo(SimulationFab);
