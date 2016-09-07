'use strict';

var React$2 = Serverboards.React;

var SQLTextInput = React$2.createClass({
  displayName: 'SQLTextInput',
  componentDidMount: function componentDidMount() {
    var _this = this;

    $(this.refs.textarea).on('keyup', function (e) {
      if (e.ctrlKey && e.keyCode == 13) {
        _this.handleExecute($(_this.refs.textarea).val());
      }
      if (e.keyCode == 27) {
        _this.clearTextArea();
      }
    });
  },
  handleExecute: function handleExecute() {
    this.props.onExecute($(this.refs.textarea).val());
  },
  clearTextArea: function clearTextArea() {
    $(this.refs.textarea).val('');
  },
  render: function render() {
    return React$2.createElement(
      'div',
      { className: 'ui form' },
      React$2.createElement(
        'textarea',
        { ref: 'textarea', className: 'ui input', placeholder: 'Write your SQL query and press Crtl+Enter' },
        'SELECT * FROM auth_user;'
      ),
      React$2.createElement(
        'div',
        { className: 'ui buttons', style: { marginTop: 10 } },
        React$2.createElement(
          'button',
          { className: 'ui button yellow', onClick: this.handleExecute, style: { paddingTop: 10 } },
          'Execute query (Crtl+Enter)'
        ),
        React$2.createElement(
          'button',
          { className: 'ui button', onClick: this.clearTextArea, style: { paddingTop: 10 } },
          'Clear area (ESC)'
        )
      )
    );
  }
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var React$3 = Serverboards.React;

function DataGrid(props) {
  function to_string(c) {
    if ((typeof c === "undefined" ? "undefined" : _typeof(c)) == 'object') return JSON.stringify(c);
    return c;
  }

  return React$3.createElement(
    "div",
    { style: { height: "60vh", overflow: "scroll" } },
    React$3.createElement(
      "table",
      { className: "ui celled unstackable table" },
      React$3.createElement(
        "thead",
        null,
        props.headers.map(function (h) {
          return React$3.createElement(
            "th",
            null,
            h
          );
        })
      ),
      React$3.createElement(
        "tbody",
        null,
        props.data.map(function (row) {
          return React$3.createElement(
            "tr",
            null,
            row.map(function (cell) {
              return React$3.createElement(
                "td",
                null,
                to_string(cell)
              );
            })
          );
        })
      )
    )
  );
}

var React$1 = Serverboards.React;
var rpc = Serverboards.rpc;
var Flash = Serverboards.Flash;

var Console = React$1.createClass({
  displayName: 'Console',
  getInitialState: function getInitialState() {
    return {
      data: [],
      columns: ["", "", ""],
      databases: ['template1'],
      tables: [],
      plugin_id: undefined
    };
  },
  componentDidMount: function componentDidMount() {
    var _this = this;

    var plugin_id = void 0;
    rpc.call("plugin.start", ["serverboards.remotesql/daemon"]).then(function (pid) {
      plugin_id = pid;
      console.log("plugin id %o", plugin_id);
      _this.setState({ plugin_id: plugin_id });
      return _this.openConnection("template1", plugin_id);
    }).then(function () {
      console.log("plugin id %o", plugin_id);
      return rpc.call(plugin_id + '.databases').then(function (databases) {
        _this.setState({ databases: databases });
      });
    }).catch(function (e) {
      console.error(e);
      Flash.error(String(e));
    });

    $(this.refs.el).find('.ui.dropdown').dropdown();
  },
  componentWillUnmount: function componentWillUnmount() {
    console.log("Stop database connection? %o", this.state.plugin_id);
    if (this.state.plugin_id) {
      console.log("Stop database connection");
      rpc.call("plugin.stop", [this.state.plugin_id]);
    }
  },
  openConnection: function openConnection(database, plugin_id) {
    var _this2 = this;

    if (!plugin_id) plugin_id = this.state.plugin_id;
    var c = this.props.service.config;
    return rpc.call(plugin_id + '.open', {
      via: c.via,
      type: c.type,
      hostname: c.hostname,
      port: c.port,
      username: c.username,
      password_pw: c.password_pw,
      database: database
    }).then(function () {
      return rpc.call(plugin_id + '.tables');
    }).then(function (tables) {
      _this2.setState({ tables: tables });
    });
  },
  handleExecute: function handleExecute(sql, plugin_id) {
    var _this3 = this;

    if (!plugin_id) plugin_id = this.state.plugin_id;
    console.log("Execute at %s: %s", plugin_id, sql);
    rpc.call(plugin_id + '.execute', [sql]).then(function (res) {
      console.log("Got response: %o", res);
      _this3.setState({ data: res.data, columns: res.columns });
    }).catch(function (e) {
      console.error(e);
      Flash.error(String(e));
    });
  },
  render: function render() {
    var _this4 = this;

    var props = this.props;
    var state = this.state;
    var service = props.service || {};
    console.log(this);
    return React$1.createElement(
      'div',
      { ref: 'el', className: 'ui container' },
      React$1.createElement(
        'h2',
        { className: 'ui header' },
        'SQL Console for ',
        React$1.createElement(
          'i',
          null,
          service.name
        )
      ),
      React$1.createElement(
        'select',
        { name: 'database', defaultValue: 'template1', className: 'ui dropdown', onChange: function onChange(ev) {
            return _this4.openConnection(ev.target.value);
          } },
        state.databases.map(function (db) {
          return React$1.createElement(
            'option',
            { value: db },
            db
          );
        })
      ),
      React$1.createElement(
        'select',
        { name: 'tables', className: 'ui dropdown', onChange: function onChange(ev) {
            return _this4.handleExecute('SELECT * FROM ' + ev.target.value);
          } },
        state.tables.map(function (db) {
          return React$1.createElement(
            'option',
            { value: db },
            db
          );
        })
      ),
      React$1.createElement(DataGrid, { data: state.data, headers: state.columns }),
      React$1.createElement(SQLTextInput, { onExecute: this.handleExecute })
    );
  }
});

var React = Serverboards.React;
function main(_ref, settings) {
  var _ref2 = slicedToArray(_ref, 1);

  var el = _ref2[0];

  var MyConsole = function MyConsole(props) {
    return React.createElement(Console, { service: settings.service });
  };

  Serverboards.ReactDOM.render(React.createElement(MyConsole, null), el);

  return function () {
    Serverboards.ReactDOM.unmountComponentAtNode(el);
  };
}

Serverboards.add_screen("serverboards.remotesql/console", main);