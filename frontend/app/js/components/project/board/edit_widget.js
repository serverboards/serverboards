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
import Widget from 'app/containers/project/board/widget'

const AddWidget = React.createClass({
  getInitialState(){
    return {
      widget: undefined,
      config: this.props.widget.config
    }
  },
  updateWidget(){
    const state=this.state
    const props=this.props
    const data={
      uuid: props.widget.uuid,
      widget: props.widget.widget,
      project: this.props.project,
      config: state.config
    }
    rpc.call("dashboard.widget.update", data).then( () => {
      set_modal(null)
    })
  },
  removeWidget(){
    // console.log("remove", this.props.widget_id, this.props.widget.uuid)
    rpc.call("dashboard.widget.remove", [this.props.widget.uuid]).then(() => {
      set_modal(null)
      Flash.success("Widet removed")
    }).catch( e => {
      console.error(e)
      Flash.error("Could not remove widget.")
    })
  },
  setFormData(config){
    this.setState({config})
  },
  render(){
    const template=this.props.template
    const widget=this.props.widget
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
    layout.width = layout.w
    layout.height = layout.h

    if (template=="not-found"){
      return (
        <Modal className="wide">
          <div className="ui top serverboards secondary menu">
            <h3 className="ui header">{this.props.widget_id}</h3>
            <div className="right menu">
              <HoldButton className="item" onHoldClick={this.removeWidget}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
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
    return (
      <Modal className="wide">
        <div className="ui top serverboards secondary menu">
          <h3 className="ui header">{template.name}</h3>
          <div className="right menu">
            <HoldButton className="item" onHoldClick={this.removeWidget}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
          </div>
        </div>
        <div className="ui expand two column grid grey background">
          <div className="ui column with scroll">
            <div className="ui board">
              <div className="ui cards" style={{margin: 0, padding: "1em", justifyContent: "center"}}>
                <div className="ui card" style={{maxHeight: 280*layout.h, maxWidth: 240*layout.w, minHeight: 280*layout.h, minWidth: 240*layout.w }}>
                  <Widget
                    key={widget.uuid}
                    widget={widget.widget}
                    config={this.state.config}
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
                {this.state.error ? (
                  <div className="ui message visible error">
                    <div className="header">{i18n("Error")}</div>
                    <p>{this.state.error}</p>
                  </div>
                ) : (
                  <div>
                    <div className="ui meta" style={{marginBottom:30}}>{template.description}</div>
                    {template.params && (
                      <GenericForm fields={template.params} data={this.state.config} updateForm={this.setFormData}/>
                    )}
                    <button className="ui button yellow" style={{marginTop:20}} onClick={this.updateWidget}>
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
})

export default AddWidget
