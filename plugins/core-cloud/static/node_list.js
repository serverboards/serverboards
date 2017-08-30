(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var _Serverboards$2=Serverboards;
var React$2=_Serverboards$2.React;
var i18n$2=_Serverboards$2.i18n;
var colorize=Serverboards.utils.colorize;function CloudCard(a){var b=a.item;return React$2.createElement("div",{className:"ui narrow card"},React$2.createElement("div",{className:"header"},React$2.createElement("div",{className:"right"},React$2.createElement("span",{className:"ui text label"},b.state,"\xA0",React$2.createElement("i",{className:"ui rectangular label "+colorize(b.state)})))),React$2.createElement("div",{className:"ui padding"},React$2.createElement("h3",{className:"ui header"},b.name),React$2.createElement("div",{className:"ui meta"},b.description),b.type))}function ListView(a){var b=this,c=a.items;return React$2.createElement("div",{className:"ui expand two column grid grey background",style:{flexGrow:1,margin:0}},React$2.createElement("div",{className:"ui column"},React$2.createElement("div",{className:"ui round pane white background"},React$2.createElement("div",{className:"ui attached top form"},React$2.createElement("div",{className:"ui input seamless white"},React$2.createElement("i",{className:"icon search"}),React$2.createElement("input",{type:"text",onChange:function onChange(a){return b.setFilter(a.target.value)},placeholder:i18n$2("Filter...")}))),React$2.createElement("div",{className:"ui scroll extend with padding"},0==c.length?React$2.createElement("div",{className:"ui meta"},"No items"):React$2.createElement("div",{className:"ui cards"},c.map(function(a){return React$2.createElement(CloudCard,{item:a})}))))),React$2.createElement("div",{className:"ui column"},React$2.createElement("div",{className:"ui round pane white background"})))}

var babelHelpers = {};




var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};





















babelHelpers;

var _Serverboards$1=Serverboards;
var plugin=_Serverboards$1.plugin;
var i18n$1=_Serverboards$1.i18n;
var React$1=_Serverboards$1.React;
var Loading=Serverboards.Components.Loading;var List=function(a){function b(a){classCallCheck(this,b);var c=possibleConstructorReturn(this,(b.__proto__||Object.getPrototypeOf(b)).call(this,a));return c.state={loading:!0,items:void 0},c}return inherits(b,a),createClass(b,[{key:"componentDidMount",value:function componentDidMount(){var a=this;plugin.start_call_stop("serverboards.core.cloud/daemon","list",{project:this.props.project}).then(function(b){a.setState({items:b,loading:!1});});}},{key:"render",value:function render(){return this.state.loading?React$1.createElement(Loading,null,i18n$1("Cloud nodes")):React$1.createElement(ListView,{items:this.state.items})}}]),b}(React$1.Component);

var _Serverboards=Serverboards;
var React=_Serverboards.React;
var plugin_id="serverboards.core.cloud";
var component_id="node_list";function main(a,b){return console.log("Component is %o",List,b),Serverboards.ReactDOM.render(React.createElement(List,{project:b.project.shortname}),a),function(){Serverboards.ReactDOM.unmountComponentAtNode(a);}}Serverboards.add_screen(plugin_id+"/"+component_id,main);

})));
//# sourceMappingURL=node_list.js.map
