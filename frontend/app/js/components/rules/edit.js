import React from 'react'
import GenericForm from '../genericform'
import Modal from 'app/components/modal'
import ImageIcon from 'app/components/imageicon'
import { to_map, to_list, merge } from 'app/utils'
import ActionEdit from './actionedit'
import SelectService from './selectservice'
import TriggerSelect from './triggerselect'

const icon = require("../../../imgs/rules.svg")

const Details=React.createClass({
  getInitialState(){
    const service_uuid=this.props.rule.service
    const props=this.props
    let service={}
    if (service_uuid){
      service = this.props.services.find( (s) => s.uuid == service_uuid )
    }
    //console.log("service %o %o %o", this.props.rule, service_uuid, service)
    const location_state = this.props.location && this.props.location.state || {}
    const trigger_id = location_state.trigger || this.props.rule.trigger.trigger
    const trigger_fields = ((this.find_trigger(trigger_id) || {}).start || {}).params || []
    const states = (this.find_trigger(trigger_id) || {}).states

    return {
      is_active: props.rule.is_active,
      name: props.rule.name,
      description: props.rule.description,
      service: service,
      trigger: trigger_id,
      trigger_fields: trigger_fields,
      trigger_config: this.props.rule.trigger.params || location_state.params,
      actions: this.get_actions(states)
    }
  },
  find_trigger(id, triggers){
    if (!triggers)
      triggers=this.props.triggers
    return triggers.find( (t) => t.id == id )
  },
  get_actions(states){ // Check if knows some values from previous staes, and returns it all
    let actions=this.props.rule.actions
    console.log(this.props)
    return states.map( (s) => ({
      state: s,
      params: actions[s].params || {},
      action: actions[s].action || null
    }))
  },
  componentDidMount(){
    let self=this
    $(this.refs.el).find('.toggle').checkbox({
      onChecked: () => this.handleIsActiveChange(true),
      onUnchecked: () => this.handleIsActiveChange(false),
    });
  },
  handleTriggerChange(trigger){
    console.log("Selected trigger %o", trigger)
    if (!trigger)
      this.setState({trigger:null, trigger_fields:[], actions: []})
    else
      this.setState({
        trigger: trigger.id,
        trigger_fields: trigger.start.params,
        actions: trigger.states.map( (s) => ({
          state: s
        }))
      })
  },
  handleTriggerConfigChange(trigger_config){
    this.setState({trigger_config})
  },
  handleActionConfig(state, action_id, params){
    const actions = this.state.actions.map( (ac) => {
      if (ac.state == state)
        return { state: state, action: action_id, params: params }
      return ac
    })
    this.setState({ actions })
  },
  handleServiceChange(service){
    this.setState({service})
  },
  handleIsActiveChange(is_active){
    this.setState({is_active})
  },
  handleDescriptionChange(ev){
    this.setState({description: ev.target.value })
  },
  handleNameChange(ev){
    this.setState({name: ev.target.value })
  },
  handleSave(){
    let actions={}
    const state=this.state
    const props=this.props

    state.actions.map( (ac) => {
      actions[ac.state]={
        action: ac.action,
        params: ac.params
      }
    })

    let rule={
      uuid: props.rule.uuid,
      is_active: state.is_active,
      name: state.name,
      description: state.description,
      service: state.service && state.service.uuid,
      serverboard: props.serverboard,
      trigger: {
        trigger: state.trigger,
        params: state.trigger_config
      },
      actions: actions
    }
    this.props.onSave(rule)
  },
  render(){
    const props=this.props
    const triggers = props.triggers || []
    const services=props.services
    const state=this.state
    const actions = state.actions
    let defconfig=merge( this.state.service && this.state.service.config || {}, {service: this.state.service && this.state.service.uuid } )
    const trigger_params=state.trigger_fields.filter( (tf) => !(tf.name in defconfig) )
    //console.log("defconfig", this.state.service, defconfig, trigger_fields)
    return (
      <Modal>
        <div ref="el">
          <div className="ui top secondary menu">
            <a className="item">
              <i className="ui icon trash"/> Delete
            </a>
            <div className="right menu">
              <div className="item">
                <div className="ui checkbox toggle">
                  <label>{state.is_active ? "Enabled " : "Disabled"}</label>
                  <input type="checkbox" defaultChecked={state.is_active} name="is_active"/>
                </div>
              </div>
            </div>
          </div>

          <div className="ui medium header side header centered">
            <ImageIcon src={icon} name={state.name}/>
            <br/>
            <h3 className="ui header">{state.name}</h3>
          </div>

          <div className="ui form">
            <div>
              <div className="field">
                <label>Name:</label>
                <input type="text" defaultValue={state.name} name="name" onChange={this.handleNameChange}/>
              </div>
              <div className="field">
                <label>Description:</label>
                <textarea type="text" defaultValue={state.description} name="description" onChange={this.handleDescriptionChange}/>
              </div>
              <div className="field">
                <label>Service:</label>
                <SelectService defaultValue={state.service && state.service.uuid} services={services} onChange={this.handleServiceChange}/>
              </div>
            </div>

            <div>
              <h2 className="ui uppercase header">When</h2>
              <div className="field">
                <label>Trigger:</label>
                <TriggerSelect defaultValue={state.trigger} onChange={this.handleTriggerChange} triggers={triggers}/>
              </div>
              <GenericForm fields={trigger_params} data={state.trigger_config} updateForm={this.handleTriggerConfigChange}/>
            </div>

            {actions.length != 0 ? (
              <div>
                <h2 className="ui header uppercase">on</h2>

                {actions.map( (action) => (
                  <div key={action.state} >
                    <h3 className="ui header uppercase">{action.state}</h3>
                    <ActionEdit action={action} catalog={props.action_catalog} onUpdateAction={this.handleActionConfig} noparams={defconfig}/>
                  </div>
                ))}
              </div>
            ) : null }
          </div>

        </div>
        <div className="actions">
          <button className="ui yellow button" onClick={this.handleSave}>Save changes</button>
        </div>
      </Modal>
    )
  }
})
export default Details
