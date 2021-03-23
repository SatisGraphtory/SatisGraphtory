import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { CardContent, Typography, Slider } from '@material-ui/core';

import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import StopIcon from '@material-ui/icons/Stop';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';

const useStyles = makeStyles((theme) => ({
  simulationCard: {
    top: `calc(2em + ${theme.overrides.GraphAppBar.height}px)`,
    right: '2em',
    position: 'absolute',
  },
  title: {
    fontSize: 18,
  },
  icon: {
    color: '#333',
  },
  playPauseButton: {
    minWidth: 110,
  },
  stopButton: {
    marginLeft: 5,
    minWidth: 110,
  },
  cardContent: {
    minWidth: 100,
  },
  slider: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
  },
}));

const marks = [
  {
    value: 0,
    label: '0.5x',
  },
  {
    value: 1,
    label: '1x',
  },
  {
    value: 2,
    label: '2x',
  },
  {
    value: 3,
    label: 'Max',
  },
];

function SimulationButton() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleOpen = (evt, source) => {
    setOpen(!open);
  };

  const { externalInteractionManager } = React.useContext(PixiJSCanvasContext);

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
        simulationManager.resetAll();
        setIsPlaying(false);
      }
    },
    [externalInteractionManager]
  );

  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <React.Fragment>
      {open ? (
        <Card className={classes.simulationCard}>
          <CardContent className={classes.cardContent}>
            <Typography className={classes.title} gutterBottom>
              Simulation Settings
            </Typography>
            <div className={classes.slider}>
              <Slider
                defaultValue={1}
                aria-labelledby="discrete-slider"
                valueLabelDisplay="off"
                step={1}
                marks={marks}
                min={0}
                max={3}
              />
            </div>
            <Button
              onClick={(e) => {
                setIsPlaying(!isPlaying);
                handleSimulation(e, isPlaying ? 'Pause' : 'Play');
              }}
              startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              color="primary"
              variant="contained"
              className={classes.playPauseButton}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              onClick={(e) => {
                handleSimulation(e, 'Stop');
              }}
              color="secondary"
              variant="contained"
              className={classes.stopButton}
              disabled={numTicks.current < 0 ? true : false}
              startIcon={<StopIcon />}
            >
              Stop
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <IconButton className={classes.icon} onClick={handleOpen}>
        <PlayCircleFilledIcon />
      </IconButton>
    </React.Fragment>
  );
}

export default SimulationButton;
