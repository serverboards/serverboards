import React from 'react'
import Loading from 'app/components/loading'
import GenericForm from 'app/components/genericform'
import rpc from 'app/rpc'
import Modal from 'app/components/modal'
import Error from 'app/components/error'
import HoldButton from 'app/components/holdbutton'
import Flash from 'app/flash'
import {set_modal} from 'app/utils/store'
import i18n from 'app/utils/i18n'
import QueryServiceSelect from 'app/containers/project/board/queryserviceselect'
import Widget from 'app/containers/project/board/widget'

class AddWidget extends React.Component{
  constructor(props){
    super(props)
    const config = this.props.widget.config || {}
    this.state = {
      widget: undefined,
      extractors: config.extractors || [],
      config: this.props.widget.config,
      delayed_config: this.props.widget.config,
      delayed_config_timer: undefined,
    }
  }
  updateWidget(){
    const state=this.state
    const props=this.props
    const data={
      uuid: props.widget.uuid,
      widget: props.widget.widget,
      project: this.props.project,
      config: {...state.config, extractors: state.extractors}
    }
    rpc.call("dashboard.widget.update", data).then( () => {
      set_modal(null)
    })
  }
  removeWidget(){
    // console.log("remove", this.props.widget_id, this.props.widget.uuid)
    rpc.call("dashboard.widget.remove", [this.props.widget.uuid]).then(() => {
      set_modal(null)
      Flash.success("Widet removed")
    }).catch( e => {
      console.error(e)
      Flash.error("Could not remove widget.")
    })
  }
  setFormData(config){
    let delayed_config_timer = this.state.delayed_config_timer
    if (delayed_config_timer)
      clearTimeout(delayed_config_timer)
    delayed_config_timer = setTimeout(
      () => this.setState({delayed_config: config, delayed_config_timer: undefined}),
      300 )
    this.setState({config, delayed_config_timer})
  }
  hasQuery(){
    return this.props.template && this.props.template.params && this.props.template.params.find( t => t.type == "query" ) != undefined
  }
  updateQueryParams(params){
    if (!params)
      return
    return params.map( p => {
      if (p.type=='query'){
        return {...p, type: "textarea"} // TODO data for autocomplete and so on.
      }
      return p
    })
  }
  handleSetExtractors(extractors){
    this.setState({ extractors })
  }
  render(){
    const template = this.props.template


    if (template=="not-found"){
      return (
        <Modal className="wide">
          <div className="ui top serverboards secondary menu">
            <h3 className="ui header">{this.props.widget_id}</h3>
            <div className="right menu">
              <HoldButton className="item" onHoldClick={this.removeWidget.bind(this)}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
            </div>
          </div>
          <div className="ui text container">
            <Error>
              {i18n("Could not load information about this widget. Maybe the plugin was deleted?\n\nTry to install it again, or remove the widget.")}
            </Error>
          </div>
        </Modal>
      )
    }

    const widget = this.props.widget
    const state = this.state
    let layout={x:0, y:0, h: 2, w: 2, minW: 1, minH: 1}

    if (!template){
      return (
        <Modal>
          <Loading>{i18n("Widget description")}</Loading>
        </Modal>
      )
    }
    if (template.traits && template.traits.minH){
      layout={...layout, ...template.traits}
    }
    layout = {...layout, ...widget.ui}
    const wwidth = layout.w*283
    const wheight = (layout.h*130)+((layout.h-1)*28)
    console.log("Layout: %o", layout)

    return (
      <Modal className="wide">
        <div className="ui top serverboards secondary menu">
          <h3 className="ui header">{template.name}</h3>
          <div className="right menu">
            <HoldButton className="item" onHoldClick={this.removeWidget.bind(this)}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
          </div>
        </div>
        <div className="ui expand two column grid grey background">
          <div className="ui column with scroll with padding">
            <div className="ui board">
              <div className="ui cards" style={{margin: 0, padding: "1em", justifyContent: "center"}}>
                <div className="ui card" style={{maxHeight: wheight, minHeight: wheight, maxWidth: wwidth, minWidth: wwidth }}>
                  <Widget
                    key={widget.uuid}
                    widget={widget.widget}
                    config={state.delayed_config}
                    uuid={widget.uuid}
                    project={this.props.project}
                    layout={layout}
                    />
                </div>
              </div>
            </div>
          </div>
          <div className="ui column">
            <div className="ui round pane white background with padding and scroll">
              <div className="ui form" ref="form">
                {state.error ? (
                  <div className="ui message visible error">
                    <div className="header">{i18n("Error")}</div>
                    <p>{state.error}</p>
                  </div>
                ) : (
                  <div>
                    <div className="ui meta" style={{marginBottom:30}}>{widget.description}</div>
                    {this.hasQuery() && (
                      <div className="">
                        <QueryServiceSelect
                          extractors={state.extractors}
                          onSetExtractors={this.handleSetExtractors.bind(this)}
                          />
                      </div>
                    )}

                    <GenericForm fields={this.updateQueryParams(template.params)} data={state.config} updateForm={this.setFormData.bind(this)}/>
                    <button className="ui button yellow" style={{marginTop:20}} onClick={this.updateWidget.bind(this)}>
                      {i18n("Update widget")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}

export default AddWidget
