import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import { withStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import CategoryIcon from '@material-ui/icons/Category';

import DomainIcon from '@material-ui/icons/Domain';
import React from 'react';
import MouseState from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/canvas/enums/MouseState';
import { PixiJSCanvasContext } from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/stores/GlobalGraphAppStoreProvider';
import { LocaleContext } from 'v3/components/LocaleProvider';
import { getBuildableMachineClassNames } from 'v3/data/loaders/buildings';
import DrawerButton from './DrawerButton';
import TabContainer from './TabContainer';

const styles = (theme) => ({
  default: {
    zIndex: theme.zIndex.drawer,
  },
  root: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  navigation: {
    borderRadius: 5,
    pointerEvents: 'auto',
  },
  tabContainer: {
    padding: 0,
    display: 'flex',
    overflowX: 'auto',
  },
  expandPanel: {
    display: 'flex',
    flexDirection: 'column',
  },
  drawer: {
    gridArea: 'bottomActions',
    position: 'relative',
    overflow: 'hidden',
  },
  noDisplay: {
    display: 'none',
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <React.Fragment>{children}</React.Fragment>}
    </div>
  );
}

function NodeDrawer(props) {
  const { classes } = props;
  const [value, setValue] = React.useState(0);

  const { nodeStampOptions, mouseState } = React.useContext(
    PixiJSCanvasContext
  );

  const { translate } = React.useContext(LocaleContext);

  const drawerOpen = mouseState === MouseState.ADD;

  const placeableMachineClasses = getBuildableMachineClassNames().sort(
    (a, b) => {
      return translate(a).localeCompare(translate(b));
    }
  );

  const [expanded, setExpanded] = React.useState(true);

  function handleChange(event, newValue) {
    setValue(newValue);
  }

  const usedClass = drawerOpen ? classes.drawer : classes.noDisplay;

  let selectedText;

  if (nodeStampOptions && Object.keys(nodeStampOptions).length > 0) {
    // Handling extractors
    let newSelectedTextParts = [];
    if (nodeStampOptions.nodePurity) {
      newSelectedTextParts.push(nodeStampOptions.nodePurity.label);
      if (nodeStampOptions.machineType) {
        newSelectedTextParts.push(nodeStampOptions.machineType.label);
      }
      if (nodeStampOptions.extractedItem) {
        newSelectedTextParts.push(
          '(' + nodeStampOptions.extractedItem.label + ')'
        );
      }
      selectedText = newSelectedTextParts.join(' ');
    } else {
      if (nodeStampOptions.machineType) {
        newSelectedTextParts.push(nodeStampOptions.machineType.label);
      }
      if (nodeStampOptions.recipe) {
        newSelectedTextParts.push(nodeStampOptions.recipe.label);
      }

      selectedText = newSelectedTextParts.join(' - ');
    }
  } else {
    selectedText = translate('selected_none');
  }

  return (
    <Drawer
      anchor="bottom"
      open={drawerOpen}
      onClose={() => {}}
      classes={{ paper: usedClass }}
      variant="persistent"
    >
      <Accordion
        expanded={expanded}
        onChange={(event, expanded) => {
          setExpanded(expanded);
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={drawerOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        >
          <Typography>
            {`${translate('currently_selected')} `}
            <span className={classes.current}>{selectedText}</span>
          </Typography>
        </AccordionSummary>

        <AccordionDetails className={classes.expandPanel}>
          <TabPanel value={value} index={0}>
            <TabContainer {...props} classes={classes}>
              {placeableMachineClasses.map((buildingSlug) => {
                return (
                  <DrawerButton
                    nodeClass={buildingSlug}
                    key={buildingSlug}
                    label={translate(buildingSlug)}
                    closeDrawerFunction={setExpanded}
                    type={'building'}
                  />
                );
              })}
            </TabContainer>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <TabContainer classes={classes}>
              <TextField id="resource-search" label="Find Resource" fullWidth />
              <Button>Add...</Button>
            </TabContainer>
          </TabPanel>
          <Tabs
            variant="fullWidth"
            scrollButtons="auto"
            value={value}
            onChange={handleChange}
            centered
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="By Machine" icon={<DomainIcon />} />
            <Tab disabled label="By Resource" icon={<CategoryIcon />} />
          </Tabs>
        </AccordionDetails>
      </Accordion>
    </Drawer>
  );
}

export default withStyles(styles)(NodeDrawer);
