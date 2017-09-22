import React from 'react'
import {Loading, GenericForm, Modal, Tip, Selector, Error} from 'app/components/export'
import rpc from 'app/rpc'
import {set_modal} from 'app/utils/store'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'

class SetupWidget extends React.Component{
  constructor(props){
    super(props)
    this.state= {
      config: {}
    }
  }
  handleAddWidget(){
    this.props.onAddWidget(this.state.config)
  }
  render(){
    const widget=this.props.widget
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
          <button type="button" className="ui button teal" onClick={this.handleAddWidget.bind(this)}>
            {i18n("Add widget")}
          </button>
        </div>
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
    if (!widget.params || widget.params.length==0){
      // no more config
      this.props.addWidget( widget.id, this.props.dashboard_uuid, {} )
    }
    else
      this.setState({widget, step: 1})
  }
  handleAddWidget(config){
    this.props.addWidget( this.state.widget.id, this.props.dashboard_uuid, config )
  }
  render(){
    let section=null
    switch(this.state.step){
      case 0:
        section = (
          <Selector
            title={i18n("Add a widget")}
            description={i18n("Select the widget to add to the {name} dashboard", {name: this.props.dashboard.name})}
            get_items={cache.widget_catalog}
            onSelect={this.handleSelectWidget.bind(this)}
            current={(this.state.widget || {}).id}
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
