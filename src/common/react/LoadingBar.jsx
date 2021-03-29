import { makeStyles } from '@material-ui/core/styles';
import anvil from 'common/images/anvil.gif';
import { Stripe } from 'common/react/LoadingScreen';
import React from 'react';

const STROKE_WIDTH = 40;
const DIV_HEIGHT = 20;

const useStyles = makeStyles(() => ({
  canvasContainer: {
    overflow: 'hidden',
    display: 'grid',
    gridTemplateAreas: `"spacerTop"
       "topText"
       "loader"
       "spacerBottom"`,
    gridTemplateRows: 'minmax(0, 1fr) min-content min-content minmax(0, 1fr)',
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
  canvas: {
    gridArea: 'loader',
  },
  loadingTopText: {
    gridArea: 'topText',
  },
  loadingTopImage: {
    display: 'block',
    margin: 'auto',
    paddingLeft: 20,
  },
  fullscreen: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D303D',
  },
  centerText: {
    height: DIV_HEIGHT,
    width: '100%',
    color: 'white',
    fontFamily: 'Roboto Mono, monospace',
  },
  loaderSpinner: {
    position: 'absolute',
    width: '100%',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
  },
  textContainer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stripeTop: {
    flexGrow: 0,
    height: 20,
    width: '200%',
    animation: `$topBar 0.5s linear infinite`,
  },
  stripeBottom: {
    height: 20,
    flexGrow: 0,
    width: '200%',
    animation: `$bottomBar 0.5s linear infinite`,
  },
  '@keyframes bottomBar': {
    '100%': {
      transform: `translateX(-${DIV_HEIGHT}px)`,
    },
    '0%': {
      transform: `translateX(-${DIV_HEIGHT + STROKE_WIDTH * Math.sqrt(2)}px)`,
    },
  },
  '@keyframes topBar': {
    '100%': {
      transform: `translateX(-${STROKE_WIDTH * Math.sqrt(2)}px)`,
    },
    '0%': {
      transform: `translateX(-${2 * STROKE_WIDTH * Math.sqrt(2)}px)`,
    },
  },
}));

const LoadingBar = () => {
  const classes = useStyles();
  return (
    <div className={classes.canvasContainer} style={{ overflow: 'hidden' }}>
      <div className={classes.loadingTopText}>
        <img className={classes.loadingTopImage} alt={'loading'} src={anvil} />
        <div className={classes.loaderSpinner}>
          <div className={classes.stripeTop}>
            <Stripe />
          </div>
          <div className={classes.stripeBottom}>
            <Stripe />
          </div>
          <div className={classes.textContainer}>
            <div className={classes.centerText}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingBar;
