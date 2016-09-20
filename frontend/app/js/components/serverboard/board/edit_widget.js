import React from 'react'
import Loading from 'app/components/loading'
import GenericForm from 'app/components/genericform'
import rpc from 'app/rpc'
import Modal from 'app/components/modal'
import HoldButton from 'app/components/holdbutton'
import Flash from 'app/flash'

const AddWidget = React.createClass({
  getInitialState(){
    return {
      widget: undefined,
      config: this.props.widget.config
    }
  },
  componentDidMount(){
    rpc.call("serverboard.widget.catalog", [this.props.serverboard]).then( (catalog) => {
      const widget_id = this.props.widget.widget
      const widget = catalog.find( (w) => w.id == widget_id )
      if (widget)
        this.setState({widget})
      this.setState({
        widget: { name: widget_id },
        error: "There was an error loading the widget description. Maybe the plugin that provides it was uninstalled? We suggest to remove it."
      })
    })
  },
  updateWidget(){
    const state=this.state
    const props=this.props
    const data={
      uuid: props.widget.uuid,
      widget: props.widget.widget,
      serverboard: this.props.serverboard,
      config: state.config
    }
    rpc.call("serverboard.widget.update", data).then( () => {
      this.props.onClose()
    })
  },
  removeWidget(){
    console.log("remove")
    rpc.call("serverboard.widget.remove", [this.props.widget.uuid]).then(() => {
      Flash.info("Removed widget")
      this.props.onClose()
    })
  },
  setFormData(config){
    this.setState({config})
  },
  render(){
    const widget=this.state.widget
    if (!widget){
      return (
        <Modal>
          <Loading>Widget description</Loading>
        </Modal>
      )
    }
    return (
      <Modal>
        <div className="ui top secondary menu">
          <div className="right menu">
            <HoldButton className="item" onHoldClick={this.removeWidget}>Remove <i className="ui icon trash"/></HoldButton>
          </div>
        </div>
        <div className="ui form" ref="form">
          <h2 className="ui header">{widget.name}</h2>
          {this.state.error ? (
            <div className="ui message visible error">
              <div className="header">Error</div>
              <p>{this.state.error}</p>
            </div>
          ) : (
            <div>
              <div className="ui meta" style={{marginBottom:30}}>{widget.description}</div>
              <GenericForm fields={widget.params} data={this.state.config} updateForm={this.setFormData}/>
              <button className="ui button yellow" style={{marginTop:20}} onClick={this.updateWidget}>
                Update widget
              </button>
            </div>
          )}
        </div>
      </Modal>
    )
  }
})

export default AddWidget
