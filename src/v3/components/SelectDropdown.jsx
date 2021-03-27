import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import Select from 'react-select';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import { emphasize } from '@material-ui/core/styles/colorManipulator';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  mainSelect: {
    margin: 3,
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    display: 'flex',
    // padding: 0,
    margin: 0,
    // height: 'auto',
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  chip: {
    margin: theme.spacing(0.5, 0.25),
  },
  chipFocused: {
    backgroundColor: emphasize(
      theme.palette.type === 'light'
        ? theme.palette.grey[300]
        : theme.palette.grey[700],
      0.08
    ),
  },
  noOptionsMessage: {
    padding: theme.spacing(1, 2),
  },
  singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    bottom: 6,
    fontSize: 16,
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
    boxShadow: '-5px 5px 10px #272727',
  },
  select: {
    margin: 0,
  },
  classProp: {},
  groupStyle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupBadge: {
    backgroundColor: '#EBECF0',
    borderRadius: '2em',
    color: '#172B4D',
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: '1',
    minWidth: 1,
    padding: '0.16666666666667em 0.5em',
    textAlign: 'center',
  },
}));

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

NoOptionsMessage.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object.isRequired,
};

function inputComponent({ inputRef, ...props }) {
  return <div ref={inputRef} {...props} />;
}

inputComponent.propTypes = {
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

function Control(props) {
  const {
    children,
    innerProps,
    innerRef,
    selectProps: { classes, TextFieldProps, helperText, label, value },
  } = props;

  const actualValue =
    value && value.value !== undefined && value.value !== null
      ? value.value
      : '';
  const [textValue, setTextValue] = React.useState('');
  React.useEffect(() => {
    setTextValue(actualValue);
  }, [actualValue]);
  return (
    <TextField
      fullWidth
      variant="outlined"
      label={label}
      helperText={helperText}
      value={actualValue}
      InputLabelProps={{
        shrink:
          (actualValue !== undefined &&
            actualValue !== null &&
            actualValue !== '') ||
          (textValue !== undefined && textValue !== null && textValue !== ''),
      }}
      InputProps={{
        onChange: (e) => {
          setTextValue(e.target.value);
        },
        inputComponent,
        inputProps: {
          className: classes.input,
          ref: innerRef,
          children,
          ...innerProps,
        },
      }}
      {...TextFieldProps}
      placeholder={null}
    />
  );
}

Control.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  selectProps: PropTypes.object.isRequired,
};

function Option(props) {
  return (
    <MenuItem
      ref={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

Option.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  isFocused: PropTypes.bool,
  isSelected: PropTypes.bool,
};

function Placeholder(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

Placeholder.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object.isRequired,
};

function SingleValue(props) {
  return (
    <Typography
      className={props.selectProps.classes.singleValue}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

SingleValue.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object.isRequired,
};

function ValueContainer(props) {
  return (
    <div className={props.selectProps.classes.valueContainer}>
      {props.children}
    </div>
  );
}

ValueContainer.propTypes = {
  children: PropTypes.node,
  selectProps: PropTypes.object.isRequired,
};

function Menu(props) {
  return (
    <Paper
      square
      className={props.selectProps.classes.paper}
      {...props.innerProps}
    >
      {props.children}
    </Paper>
  );
}

Menu.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object,
};

function SelectDropdown(props) {
  const classes = useStyles();
  const theme = useTheme();

  const scrollRef = React.useRef();

  const selectStyles = {
    input: (base) => ({
      ...base,
      color: theme.palette.text.primary,
      '& input': {
        font: 'inherit',
      },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    indicatorSeparator: (base) => ({
      ...base,
      marginTop: 0,
      marginBottom: 0,
    }),
  };

  const wrappedFunc = (propFunc) => {
    return (change) => {
      const actualChange = change.value;
      if (propFunc) {
        propFunc({ target: { value: actualChange } });
      }
    };
  };

  const customMenu = (props, scrollBarRef) => {
    return (
      <Scrollbars ref={scrollBarRef} autoHeight>
        {props.children}
      </Scrollbars>
    );
  };

  const components = {
    Control,
    Menu,
    NoOptionsMessage,
    Option,
    Placeholder,
    SingleValue,
    ValueContainer,
    MenuList: (props) => {
      return customMenu(props, scrollRef);
    },
  };

  const formatGroupLabel = (data) => (
    <div className={classes.groupStyle}>
      <span>{data.label}</span>
      <span className={classes.groupBadge}>{data.options.length}</span>
    </div>
  );

  return (
    <div className={classes.mainSelect}>
      <Select
        {...props}
        isDisabled={props.disabled || false}
        classes={classes}
        className={props.classProp}
        formatGroupLabel={formatGroupLabel}
        menuPortalTarget={document.body}
        styles={selectStyles}
        inputId={props.id}
        helperText={props.helperText}
        options={props.suggestions}
        label={props.label}
        components={components}
        value={props.value}
        onChange={wrappedFunc(props.onChange)}
        onKeyUp={wrappedFunc(props.onKeyUp)}
        onKeyDown={wrappedFunc(props.onKeyDown)}
        onKeyPress={wrappedFunc(props.onKeyPress)}
        placeholder={''}
      />
    </div>
  );
}

export default SelectDropdown;
