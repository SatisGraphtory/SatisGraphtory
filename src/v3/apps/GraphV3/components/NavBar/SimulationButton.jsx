import Collapse from '@material-ui/core/Collapse';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { CardContent, Typography, Slider } from '@material-ui/core';
import { debounce } from 'throttle-debounce';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import StopIcon from '@material-ui/icons/Stop';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import {
  DEFAULT_PING_RATE,
  DEFAULT_MAX_IDLE_PINGS,
} from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/simulation/manager/SimulationManager';
import { GlobalGraphAppStore } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStore';

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
    marginLeft: 10,
    marginRight: 10,
  },
  advancedPanel: {
    marginTop: 10,
  },
  showAdvanced: {
    marginTop: 5,
  },
}));

const speedMarks = [
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

function SimulationCard(props) {
  const classes = useStyles();

  const {
    playPauseAction,
    isPlaying,
    stopAction,
    stopDisabled,
    simulationSpeed,
    speedSliderCallback,
    simulationManager,
  } = props;

  const [checked, setChecked] = React.useState(false);
  const [pingRate, setPingRate] = React.useState(DEFAULT_PING_RATE);
  const [maxIdlePings, setMaxIdlePings] = React.useState(
    DEFAULT_MAX_IDLE_PINGS
  );

  const handleChange = () => {
    setChecked((prev) => !prev);
  };

  return (
    <Card className={classes.simulationCard}>
      <CardContent className={classes.cardContent}>
        <Typography className={classes.title} gutterBottom>
          Simulation Settings
        </Typography>
        <Button
          onClick={playPauseAction}
          startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          color="primary"
          variant="contained"
          className={classes.playPauseButton}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button
          onClick={stopAction}
          color="secondary"
          variant="contained"
          className={classes.stopButton}
          disabled={stopDisabled}
          startIcon={<StopIcon />}
        >
          Stop
        </Button>
        <div className={classes.showAdvanced}>
          <FormControlLabel
            control={<Switch checked={checked} onChange={handleChange} />}
            label="Show Advanced"
          />
        </div>
        <Collapse in={checked}>
          <div className={classes.advancedPanel}>
            <Typography gutterBottom>Simulation Speed</Typography>
            <div className={classes.slider}>
              <Slider
                onChange={(event, newValue) => {
                  speedSliderCallback(newValue);
                }}
                value={simulationSpeed}
                valueLabelDisplay="off"
                step={1}
                marks={speedMarks}
                min={0}
                max={3}
              />
            </div>
            <Typography id="range-slider" gutterBottom>
              Ping Rate (Seconds)
            </Typography>
            <div className={classes.slider}>
              <Slider
                onChange={(event, newValue) => {
                  debounce(10, false, () =>
                    simulationManager.setPingRate(newValue)
                  );
                  setPingRate(newValue);
                }}
                value={pingRate}
                step={10}
                min={50}
                max={200}
                valueLabelDisplay="auto"
              />
            </div>
            <Typography id="range-slider" gutterBottom>
              Max Idle Pings
            </Typography>
            <div className={classes.slider}>
              <Slider
                onChange={(event, newValue) => {
                  debounce(10, false, () =>
                    simulationManager.setMaxIdlePings(newValue)
                  );
                  setMaxIdlePings(newValue);
                }}
                value={maxIdlePings}
                defaultValue={10}
                step={1}
                min={2}
                max={20}
                valueLabelDisplay="auto"
              />
            </div>
          </div>
        </Collapse>
      </CardContent>
    </Card>
  );
}

function SimulationButton(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);

  const handleOpen = () => {
    setOpen(!open);
  };

  const { externalInteractionManager } = React.useContext(PixiJSCanvasContext);

  const numTicks = React.useRef(-1);
  const timeoutRef = React.useRef(0);

  const speedRef = React.useRef(0);

  const [simulationSpeed, setSimulationSpeed] = React.useState(3);

  const speedSliderCallback = React.useCallback((e) => {
    switch (e) {
      case 0:
        speedRef.current = 100;
        break;
      case 1:
        speedRef.current = 50;
        break;
      case 2:
        speedRef.current = 25;
        break;
      case 3:
      default:
        speedRef.current = 0;
        break;
    }
    setSimulationSpeed(e);
  }, []);

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

        function tick() {
          for (let x = 0; x < 10; x++) {
            simulationManager.tick();
          }
          numTicks.current += 10;
          if (numTicks.current < 10000000) {
            timeoutRef.current = setTimeout(tick, speedRef.current);
          } else {
            timeoutRef.current = 0;

            console.log('Simulation Ended at tick', numTicks.current);
          }
        }

        timeoutRef.current = setTimeout(tick, speedRef.current);
        GlobalGraphAppStore.update((state) => {
          state[props.id].simulationRunning = true;
        });
      } else if (actionName === 'Pause') {
        console.log('Paused Simulation');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = 0;
        GlobalGraphAppStore.update((state) => {
          state[props.id].simulationRunning = false;
        });
      } else if (actionName === 'Stop') {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = 0;
        numTicks.current = -1;
        simulationManager.resetAll();
        setIsPlaying(false);
        GlobalGraphAppStore.update((state) => {
          state[props.id].simulationRunning = false;
        });
      }
    },
    [externalInteractionManager, props.id]
  );

  const [isPlaying, setIsPlaying] = React.useState(false);

  const playPauseAction = React.useCallback(
    (e) => {
      setIsPlaying(!isPlaying);
      handleSimulation(e, isPlaying ? 'Pause' : 'Play');
    },
    [handleSimulation, isPlaying]
  );

  const stopAction = React.useCallback(
    (e) => {
      handleSimulation(e, 'Stop');
    },
    [handleSimulation]
  );

  const stopDisabled = numTicks.current < 0;

  return (
    <React.Fragment>
      {open ? (
        <SimulationCard
          playPauseAction={playPauseAction}
          isPlaying={isPlaying}
          stopAction={stopAction}
          stopDisabled={stopDisabled}
          simulationSpeed={simulationSpeed}
          speedSliderCallback={speedSliderCallback}
          simulationManager={externalInteractionManager.getSimulationManager()}
        />
      ) : null}
      <IconButton className={classes.icon} onClick={handleOpen}>
        <PlayCircleFilledIcon />
      </IconButton>
    </React.Fragment>
  );
}

export default SimulationButton;
