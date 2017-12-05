import React from 'react'
import {Loading, GenericForm, Modal, Tip, Selector, Error} from 'app/components'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import plugin from 'app/utils/plugin'

class SetupWidget extends React.Component{
  constructor(props){
    super(props)
    this.state= {
      config: {}
    }
  }
  handleAddWidget(){
    return this.props.onAddWidget(this.state.config)
  }
  render(){
    const props = this.props
    const widget=props.widget
    console.log(widget)
    return (
      <div className="ui padding">
        <h2 className="ui centered header">{widget.name}</h2>
        <div className="" style={{marginBottom:30}}>{widget.description}</div>
        <GenericForm fields={widget.params} updateForm={(config) => this.setState({config})}/>
        <div className="ui right buttons" style={{marginTop:20}}>
          <button type="button" className="ui basic button" onClick={this.props.cancelSetup}>
            {i18n("Back")}
          </button>
          { props.saveButtons ? (
              props.saveButtons.map( sb => (
                <button type="button" className={`ui button ${sb.className}`}
                    onClick={() => this.handleAddWidget().then( (data) => sb.onClick && sb.onClick(data) )}
                    >
                  {sb.label}
                </button>
              ))
          ) : (
            <button type="button" className="ui button teal" onClick={this.handleAddWidget.bind(this)}>
              {i18n("Add widget")}
            </button>
          )}
        </div>
      </div>
    )
  }
}


function get_widget_market_catalog(){
  return Promise.all([
      plugin.start_call_stop(
            "serverboards.optional.update/catalog",
            "component_filter",
            {type: "widget"}
          )
      , cache.plugins()
    ]).then( (cp) => {
      const catalog = cp[0]
      const plugin_list = cp[1]

      console.log("Got catalog %o // %o", catalog, plugin_list)
      return catalog.filter( c => !plugin_list[c.plugin] )
    })
}

class SelectWidget extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      tab: 1
    }
  }
  handleInstallWidget(w){
    this.setState({tab:3})
    plugin.install(w.giturl).then(() => {
      w = {...w, type: w.id} // I need the component id in the type field.
      this.props.onSelectWidget(w)
    }).catch((e) => {
      console.error(e)
      this.setState({tab:2})
      Flash.error(i18n("Error installing *{plugin}*. Please try again or check logs.", {plugin:w.name}))
    })
  }
  render(){
    const {state, props} = this
    const {tab} = state

    return (
      <div className="extend">
        <div className="ui attached top form">
          <div className="ui input seamless white">
            <i className="icon search"/>
            <input
              type="text"
              onChange={(ev) => {
                this.setState({filter:ev.target.value.toLocaleLowerCase().split(' ')})
              }}
              placeholder={i18n("Filter...")}
              />
          </div>
        </div>
        <div className="ui padding">
          <h2 className="ui centered header">
            <i className={`icon cloud`}/>
            {i18n("Add a widget to this dashboard")}
          </h2>
          <div>
            {i18n("Select the widget you want to add to the dashboard. If you can not find what you are looking for, check the marketplace.")}
          </div>
        </div>
        <div className="ui separator" style={{height:10}}/>
        <div className="ui pointing secondary menu">
          <a className={`item ${tab==1 ? "active" : ""}`} onClick={() => this.setState({tab:1})}>
            {i18n("Available services")}
          </a>
          <a className={`item ${tab==2 ? "active" : ""}`} onClick={() => this.setState({tab:2})}>
            {i18n("Marketplace")}
          </a>
        </div>
        {tab == 1 ? (
          <Selector
            key="installed"
            get_items={cache.widget_catalog}
            onSelect={props.onSelectWidget}
            current={(props.widget || {}).id}
            show_filter={false}
            filter={state.filter}
            skip_label={props.skip_label}
            onSkip={props.onSkip}
            prev_label={props.prev_label}
            prevStep={props.prevStep}
          />
        ) : (tab==2) ? (
          <Selector
            key="marketplace"
            get_items={get_widget_market_catalog}
            onSelect={this.handleInstallWidget.bind(this)}
            current={(props.widget || {}).id}
            show_filter={false}
            filter={state.filter}
            skip_label={props.skip_label}
            onSkip={props.onSkip}
            prev_label={props.prev_label}
            prevStep={props.prevStep}
          />
        ) : (
          <Loading>
            {i18n("Installing plugin")}
          </Loading>
        ) }
      </div>
    )
  }
}


class AddWidget extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      step: 0
    }
  }
  handleSelectWidget(widget){
    if (!this.props.saveButtons && (!widget.params || widget.params.length==0)){
      // no more config
      this.props.addWidget( widget.id, this.props.dashboard_uuid, {} )
    }
    else
      this.setState({widget, step: 1})
  }
  handleAddWidget(config){
    return this.props.addWidget( this.state.widget.id, this.props.dashboard_uuid, config )
  }
  render(){
    let section=null
    switch(this.state.step){
      case 0:
        section = (
          <SelectWidget
            onSelectWidget={this.handleSelectWidget.bind(this)}
            widget={this.state.widget}
            {...this.props}
            />
        )
        break;
      case 1:
        section = (
          <SetupWidget
            widget={this.state.widget}
            cancelSetup={() => this.setState({step: 0})}
            onAddWidget={this.handleAddWidget.bind(this)}
            {...this.props}
            />
        )
        break;
      default:
        section = (
          <Error>
            {i18n("Unknown section")}
          </Error>
        )
        break;
    }

    return (
      <div className="ui expand two column grid grey background" style={{margin:0}}>
        <div className="ui column">
          <Tip
            className="ui round pane white background with padding"
            top_img={require("imgs/024-illustration-addaddons.svg")}
            title={i18n("Add widgets to your dashboards.")}
            middle_img={require("imgs/019-illustration-tips.svg")}
            subtitle={i18n("Dashboards allow to have a fast graphic view of your system.")}
            description={i18n(`
Select a widget type from your left to be able to configure it.
`)}
              />
        </div>

        <div className="ui column">
          <div className="ui round pane white background">
            {section}
          </div>
        </div>
      </div>
    )
  }
}

export default AddWidget
