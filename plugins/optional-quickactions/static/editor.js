(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

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

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var _Serverboards$2=Serverboards;
var React$2=_Serverboards$2.React;
function find_service(c,d){return d.find(function(e){return e.uuid==c})||{name:c}}function Action(c){var d=c.action;return React$2.createElement("div",{className:"card",style:{maxWidth:200},"data-tooltip":d.description},React$2.createElement("a",{className:"content",onClick:function onClick(){return c.onRunAction(d)},style:{textAlign:"center"}},React$2.createElement("div",{style:{paddingTop:20}},React$2.createElement("i",{className:"ui huge blue icon "+(d.icon||"hand pointer")})),React$2.createElement("div",{className:"ui small header"},d.name),React$2.createElement("div",null,d.service?React$2.createElement("span",{className:"ui meta"},find_service(d.service,c.services).name):null)),React$2.createElement("div",{className:"extra content",style:{justifyContent:"flex-end",display:"flex"}},React$2.createElement("a",{onClick:function onClick(e){e.preventDefault(),c.onConfigureAction(d)}},React$2.createElement("i",{className:"ui icon edit"}))))}function View$1(c){var d=(c.actions||[]).sort(function(e,f){return e.name.localeCompare(f.name)});return React$2.createElement("div",null,React$2.createElement("div",{className:"ui top secondary header menu"},React$2.createElement("h3",null,"Actions")),React$2.createElement("div",{className:"ui container",style:{paddingTop:30}},React$2.createElement("div",{className:"ui cards"},(d||[]).map(function(e){return React$2.createElement(Action,_extends({key:e.id,action:e},c))}))),React$2.createElement("a",{onClick:c.onOpenAddAction,className:"ui massive button _add icon floating yellow"},React$2.createElement("i",{className:"add icon"})))}

var React$4=Serverboards.React;
var {GenericForm:GenericForm}=Serverboards.Components;
var EditAction=React$4.createClass({displayName:"EditAction",componentDidMount:function componentDidMount(){var a=this;$(this.refs.star).checkbox({onChecked:function onChecked(){a.props.onStar(!0)},onUnchecked:function onUnchecked(){a.props.onUpdateConfirmation(!1)}}),$(this.refs.confirmation).checkbox({onChecked:function onChecked(){a.props.onUpdateConfirmation(!0)},onUnchecked:function onUnchecked(){a.props.onUpdateConfirmation(!1)}}),$(this.refs.form).find(".dropdown").dropdown()},render:function render(){var a=this.props,b=a.action;return React$4.createElement("div",{ref:"form"},React$4.createElement("div",{className:"ui top secondary header menu"},React$4.createElement("h3",null,"Edit ",b.name||"action"),React$4.createElement("div",{className:"right menu",style:{alignItems:"center",paddingRight:20}},React$4.createElement("div",{ref:"confirmation",className:"field ui toggle checkbox",style:{paddingRight:10}},React$4.createElement("input",{type:"checkbox",defaultChecked:b.confirmation,onChange:function onChange(c){return a.onUpdateConfirmation(c.target.value)}}),React$4.createElement("label",null,"Require confirmation")),React$4.createElement("div",{ref:"star",className:"field ui toggle checkbox"},React$4.createElement("input",{type:"checkbox",defaultChecked:b.star,onChange:function onChange(c){return a.onStar(c.target.value)}}),React$4.createElement("label",null,"Show at widget")))),React$4.createElement("div",{className:"ui text container"},React$4.createElement("div",{className:"ui form"},React$4.createElement("div",{className:"four fields"},React$4.createElement("div",{className:"field"},React$4.createElement("label",null,"Icon Name"),React$4.createElement("div",{style:{padding:40,textAlign:"center",border:"1px solid #aaa",margin:"auto",marginBottom:10}},React$4.createElement("i",{className:"ui huge blue icon "+(b.icon||"help")})),React$4.createElement("input",{type:"text",placeholder:"Icon name",defaultValue:b.icon,onChange:function onChange(c){return a.onUpdateIcon(c.target.value)}})),React$4.createElement("div",{className:"field"},React$4.createElement("label",{style:{paddingTop:20}},"Tip:"),React$4.createElement("div",{className:"ui meta"},"Visit ",React$4.createElement("a",{target:"_blank",href:"http://semantic-ui.com/elements/icon.html"},"Semantic UI icon","'","s selection")," and copy the name of your choice. Then paste it in the input bellow."))),React$4.createElement("div",{className:"two fields"},React$4.createElement("div",{className:"field"},React$4.createElement("label",null,"Name"),React$4.createElement("input",{type:"text",defaultValue:b.name,onChange:function onChange(c){return a.onUpdateName(c.target.value)}})),React$4.createElement("div",{className:"field"},React$4.createElement("label",null,"Description"),React$4.createElement("textarea",{style:{minHeight:"4em",height:"4em"},onChange:function onChange(c){return a.onUpdateDescription(c.target.value)}},b.description))),React$4.createElement("div",{className:"two fields"},React$4.createElement("div",{className:"field"},React$4.createElement("label",null,"Service"),React$4.createElement("select",{className:"ui dropdown search",defaultValue:b.service,onChange:function onChange(c){return a.onServiceChange(c.target.value)}},React$4.createElement("option",{value:"."},"No service selected"),a.services.map(function(c){return React$4.createElement("option",{key:c.uuid,value:c.uuid},c.name)}))),React$4.createElement("div",{className:"field"},React$4.createElement("label",null,"Action"),React$4.createElement("select",{className:"ui dropdown search",defaultValue:b.action,onChange:function onChange(c){return a.onActionChange(c.target.value)}},React$4.createElement("option",{value:"."},"No action selected"),a.actions.map(function(c){return React$4.createElement("option",{key:c.id,value:c.id},c.name)})))),React$4.createElement(GenericForm,{fields:a.form_fields,data:b.params,updateForm:a.onUpdateActionParams})),React$4.createElement("div",{className:"ui buttons",style:{marginTop:30}},React$4.createElement("button",{onClick:a.onAccept,className:"ui yellow button"},"Update quick action"),React$4.createElement("button",{onClick:a.onClose,className:"ui grey button"},"Cancel"))))}});

var _Serverboards$3=Serverboards;
var React$3=_Serverboards$3.React;
var cache=_Serverboards$3.cache;
var Loading=Serverboards.Components.Loading;
var merge$1=Serverboards.utils.merge;
var EditActionModel=React$3.createClass({displayName:'EditActionModel',getInitialState:function getInitialState(){console.log(this);var a=this.props.services,b=this.props.action.service,c=a.find(function(d){return d.uuid==b});return{actions:void 0,services:a,action:merge$1(this.props.action,{}),action_template:void 0,service:c,form_fields:[]}},componentDidMount:function componentDidMount(){var _this=this,a=this;cache.action_catalog().then(function(b){var c=a.props.action.action,d=b.find(function(e){return e.id==c});return a.setState({actions:b,action_template:d}),d}).then(function(b){a.updateFormFields(b,_this.state.service)})},handleActionChange:function handleActionChange(a){var b=this.findActionTemplate(a);this.setState({action_template:b,action:merge$1(this.state.action,{action:a})}),this.updateFormFields(b,this.state.service)},updateFormFields:function updateFormFields(a,b){if(!a)this.setState({form_fields:[]});else{var c=a.extra.call.params;void 0!=b&&function(){var d=b.fields.map(function(e){return e.name});c=c.filter(function(e){return 0>d.indexOf(e.name)})}();this.setState({form_fields:c})}},handleServiceChange:function handleServiceChange(a){var b=this.findService(a);this.setState({service:b,action:merge$1(this.state.action,{service:a})}),this.updateFormFields(this.state.action_template,b)},findActionTemplate:function findActionTemplate(a){return this.state.actions.find(function(b){return b.id==a})},findService:function findService(a){return this.state.services.find(function(b){return b.uuid==a})},handleAcceptChanges:function handleAcceptChanges(){console.log(this.state.action),this.props.onAccept(this.state.action)},updateAction:function updateAction(a){console.log(a),this.setState({action:merge$1(this.state.action,a)})},render:function render(){var _this2=this;return this.state.actions&&this.state.services?React$3.createElement(EditAction,_extends({},this.props,this.state,{onActionChange:this.handleActionChange,onServiceChange:this.handleServiceChange,onUpdateActionParams:function onUpdateActionParams(a){return _this2.updateAction({params:a})},onAccept:this.handleAcceptChanges,onUpdateDescription:function onUpdateDescription(a){return _this2.updateAction({description:a})},onUpdateName:function onUpdateName(a){return _this2.updateAction({name:a})},onUpdateConfirmation:function onUpdateConfirmation(a){return _this2.updateAction({confirmation:a})},onStar:function onStar(a){return _this2.updateAction({star:a})},onUpdateIcon:function onUpdateIcon(a){return _this2.updateAction({icon:a})}})):React$3.createElement(Loading,null,'Actions and services')}});

var _Serverboards$1=Serverboards;
var React$1=_Serverboards$1.React;
var plugin=_Serverboards$1.plugin;
var Flash=_Serverboards$1.Flash;
var {merge:merge}=Serverboards.utils;
var extra={empty_action:{id:void 0,action:void 0,description:'',params:{},name:'',confirmation:!1}};
var ListModel=React$1.createClass({displayName:'ListModel',getInitialState:function getInitialState(){return{edit:void 0,actions:void 0}},componentDidMount:function componentDidMount(){var _this=this;plugin.start_call_stop('serverboards.optional.quickactions/command','list_actions',{serverboard:this.props.serverboard}).then(function(b){console.log('got actions: %o',b),_this.setState({actions:b})})},handleRunAction:function handleRunAction(b){b.confirmation&&!confirm(b.name+'\n\n'+(b.description||b.confirm||'Are you sure?'))||plugin.start_call_stop('serverboards.optional.quickactions/command','run_action',[b.id]).then(function(){Flash.info('Sucefully run action '+b.name)}).catch(function(c){return Flash.error(c)})},handleConfigureAction:function handleConfigureAction(b){this.setState({edit:b})},handleAcceptEditAction:function handleAcceptEditAction(b){var _this2=this;plugin.start_call_stop('serverboards.optional.quickactions/command','update_action',[b]).then(function(c){var d=_this2.state.actions.map(function(f){return f.id==b.id?b:f});_this2.setState({edit:void 0,actions:d}),Flash.info('Action updated')}).catch(function(c){return Flash.error(c)})},handleCloseEditAction:function handleCloseEditAction(){this.setState({edit:void 0})},handleOpenAddAction:function handleOpenAddAction(){this.setState({edit:'add'})},handleAcceptAddAction:function handleAcceptAddAction(b){var _this3=this;plugin.start_call_stop('serverboards.optional.quickactions/command','add_action',[b]).then(function(c){Flash.info('Action added'),_this3.setState({actions:_this3.state.actions.concat(merge(b,{id:c})),edit:void 0})}).catch(function(c){return Flash.error(c)})},render:function render(){if(this.state.edit){if('add'==this.state.edit)return React$1.createElement(EditActionModel,{action:extra.empty_action,onAccept:this.handleAcceptAddAction,services:this.props.services,onClose:this.handleCloseEditAction});return React$1.createElement(EditActionModel,{action:this.state.edit,onAccept:this.handleAcceptEditAction,services:this.props.services,onClose:this.handleCloseEditAction})}return React$1.createElement(View$1,_extends({},this.props,this.state,{onRunAction:this.handleRunAction,onConfigureAction:this.handleConfigureAction,onOpenAddAction:this.handleOpenAddAction}))}});

var _Serverboards=Serverboards;
var rpc=_Serverboards.rpc;
var React=_Serverboards.React;
var plugin_id="serverboards.optional.quickactions";
function View(a){return React.createElement(ListModel,{serverboard:a.project.shortname,services:a.project.services})}function main(a,b){return Serverboards.ReactDOM.render(React.createElement(View,b),a),plugin_id=b.plugin,function(){Serverboards.ReactDOM.unmountComponentAtNode(a)}}Serverboards.add_screen(plugin_id+"/editor",main);

})));