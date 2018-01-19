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

class AddWidget extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      widget: undefined,
      config: this.props.widget.config,
    }
  }
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
    this.setState({config})
  }
  hasQuery(){
    return true
  }
  updateQueryParams(params){
    return params.map( p => {
      if (p.type=='query'){
        return {...p, type: "textarea"} // TODO data for autocomplete and so on.
      }
      return p
    })
  }
  handleSetServices(services){
    this.setState({ services })
  }
  render(){
    const widget = this.props.template
    const state = this.state
    if (!widget){
      return (
        <Modal>
          <Loading>{i18n("Widget description")}</Loading>
        </Modal>
      )
    }
    if (widget=="not-found"){
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
    return (
      <Modal className="wide">
        <div className="ui top serverboards secondary menu">
          <h3 className="ui header">{widget.name}</h3>
          <div className="right menu">
            <HoldButton className="item" onHoldClick={this.removeWidget.bind(this)}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
          </div>
        </div>
        <div className="ui text container">
          <div className="ui form" ref="form">
            {this.state.error ? (
              <div className="ui message visible error">
                <div className="header">{i18n("Error")}</div>
                <p>{this.state.error}</p>
              </div>
            ) : (
              <div>
                <div className="ui meta" style={{marginBottom:30}}>{widget.description}</div>
                {this.hasQuery() && (
                  <div className="">
                    <QueryServiceSelect
                      services={state.services}
                      onSetServices={this.handleSetServices.bind(this)}
                      />
                  </div>
                )}

                <GenericForm fields={this.updateQueryParams(widget.params)} data={this.state.config} updateForm={this.setFormData.bind(this)}/>
                <button className="ui button yellow" style={{marginTop:20}} onClick={this.updateWidget.bind(this)}>
                  {i18n("Update widget")}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    )
  }
}

export default AddWidget
