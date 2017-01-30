(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var _Serverboards=Serverboards;
var rpc=_Serverboards.rpc;
var React=_Serverboards.React;
var plugin=_Serverboards.plugin;
var store=_Serverboards.store;
var plugin_id="serverboards.optional.quickactions";
var {Loading:Loading}=Serverboards.Components;
var style={a:{display:"block",padding:"10px 10px",cursor:"pointer",borderBottom:"1px solid #eee"},span:{color:"#666",paddingLeft:"10px"},list:{padding:"0 10px"}};
var Widget=React.createClass({displayName:"Widget",getInitialState:function getInitialState(){return{actions:void 0,loading:!0}},componentDidMount:function componentDidMount(){var _this=this;plugin.start_call_stop("serverboards.optional.quickactions/command","list_actions",{}).then(function(b){_this.setState({actions:b,loading:!1})})},runAction:function runAction(b){b.confirmation&&!confirm(b.name+"\n\n"+(b.description||b.confirm||"Are you sure?"))||plugin.start_call_stop("serverboards.optional.quickactions/command","run_action",[b.id]).then(function(){Flash.info("Sucefully run action "+b.name)}).catch(function(c){return Flash.error(c)})},render:function render(){var _this2=this;if(this.state.loading)return React.createElement(Loading,null,"Quick Actions");var b=this.state.actions.filter(function(c){return c.star});return 0==b.length?React.createElement("div",null,"There are no Quick Actions yet. Create and star some",React.createElement("a",{onClick:function onClick(){return store.goto("/serverboard/"+_this2.props.serverboard+"/serverboards.optional.quickactions/editor/")}}," here")):React.createElement("div",{className:"ui list",style:style.list},b.map(function(c){return React.createElement("a",{onClick:function onClick(){return _this2.runAction(c)},style:style.a},React.createElement("i",{className:"ui icon "+(c.icon||"play")}),React.createElement("span",{style:style.span},c.name))}))}});
function main(b,c){return Serverboards.ReactDOM.render(React.createElement(Widget,c),b),plugin_id=c.plugin,function(){Serverboards.ReactDOM.unmountComponentAtNode(b)}}Serverboards.add_widget(plugin_id+"/widget",main);

})));
//# sourceMappingURL=widget.js.map
