import React from 'react'
import Loading from 'app/components/loading'
import GenericForm from 'app/components/genericform'
import rpc from 'app/rpc'
import Modal from 'app/components/modal'
import HoldButton from 'app/components/holdbutton'
import Flash from 'app/flash'
import {set_modal} from 'app/utils/store'
import i18n from 'app/utils/i18n'

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
    rpc.call("project.widget.update", data).then( () => {
      set_modal(null)
    })
  },
  removeWidget(){
    console.log("remove")
    rpc.call("project.widget.remove", [this.props.widget.uuid]).then(() => {
      set_modal(null)
    })
  },
  setFormData(config){
    this.setState({config})
  },
  render(){
    const widget=this.props.template
    if (!widget){
      return (
        <Modal>
          <Loading>{i18n("Widget description")}</Loading>
        </Modal>
      )
    }
    return (
      <Modal>
        <div className="ui top secondary menu">
          <h3 className="ui header">{widget.name}</h3>
          <div className="right menu">
            <HoldButton className="item" onHoldClick={this.removeWidget}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
          </div>
        </div>
        <div className="ui form" ref="form">
          {this.state.error ? (
            <div className="ui message visible error">
              <div className="header">{i18n("Error")}</div>
              <p>{this.state.error}</p>
            </div>
          ) : (
            <div>
              <div className="ui meta" style={{marginBottom:30}}>{widget.description}</div>
              <GenericForm fields={widget.params} data={this.state.config} updateForm={this.setFormData}/>
              <button className="ui button yellow" style={{marginTop:20}} onClick={this.updateWidget}>
                {i18n("Update widget")}
              </button>
            </div>
          )}
        </div>
      </Modal>
    )
  }
})

export default AddWidget
