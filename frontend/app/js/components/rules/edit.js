import React from 'react'
import GenericForm from '../genericform'
import Modal from 'app/components/modal'
import ImageIcon from 'app/components/imageicon'
import { to_map, to_list, merge } from 'app/utils'
import SelectService from './selectservice'
import TriggerSelect from './triggerselect'
import RuleActions from './ruleactions'
import {i18n} from 'app/utils/i18n'
import {match_traits} from 'app/utils'
import HoldButton from '../holdbutton'

const icon = require("../../../imgs/rules.svg")


const Details=React.createClass({
  propTypes:{
    location: React.PropTypes.object,
    rule: React.PropTypes.object.isRequired,
    project: React.PropTypes.string,
    triggers: React.PropTypes.array.isRequired,
    services: React.PropTypes.array.isRequired,
    action_catalog: React.PropTypes.array.isRequired,
    onSave: React.PropTypes.func.isRequired
  },
  getInitialState(){
    const service_uuid=this.props.service || this.props.rule.service
    const props=this.props
    let service={}
    if (service_uuid){
      service = this.props.services.find( (s) => s.uuid == service_uuid )
    }
    //console.log("service %o %o %o", this.props.rule, service_uuid, service)
    const location_state = this.props.location && this.props.location.state || {}
    const trigger_id = location_state.trigger || this.props.rule.trigger.trigger
    const trigger_fields = ((this.find_trigger(trigger_id) || {}).start || {}).params || []
    const states = (this.find_trigger(trigger_id) || {}).states || []

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
      params: actions[s] && actions[s].params || {},
      action: actions[s] && actions[s].action || null
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
      service: props.service || (state.service && state.service.uuid),
      project: props.project || props.rule.project,
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
    let triggers = props.triggers || []
    const services=props.services
    const state=this.state
    const actions = state.actions
    let defconfig=merge( this.state.service && this.state.service.config || {}, {service: this.state.service && this.state.service.uuid } )
    const trigger_params=state.trigger_fields.filter( (tf) => !(tf.name in defconfig) )
    const service = this.state.service
    if (service){
      triggers = triggers.filter( (t) => match_traits({all: t.traits, has:service.traits}) )
    }
    //console.log("defconfig", this.state.service, defconfig, trigger_fields)
    return (
      <Modal className="wide">
        <div ref="el">
          <div className="ui top secondary menu">
            <HoldButton className="item" onHoldClick={this.props.onDelete}>
              <i className="ui icon trash"/> {i18n("Delete")}
            </HoldButton>
            <div className="right menu">
              <div className="item">
                <div className="ui checkbox toggle">
                  <label>{state.is_active ? i18n("Enabled") : i18n("Disabled")}</label>
                  <input type="checkbox" defaultChecked={state.is_active} name="is_active"/>
                </div>
              </div>
            </div>
          </div>
          <div className="ui text container">
            <div className="ui medium header side header centered">
              <ImageIcon src={icon} name={state.name}/>
              <br/>
              <h3 className="ui header">{i18n(state.name)}</h3>
            </div>

            <div className="ui form">
              <div>
                <div className="field">
                  <label>{i18n("Name")}:</label>
                  <input type="text" defaultValue={i18n(state.name)} name="name" onChange={this.handleNameChange}/>
                </div>
                <div className="field">
                  <label>{i18n("Description")}:</label>
                  <textarea type="text" defaultValue={i18n(state.description)} name="description" onChange={this.handleDescriptionChange}/>
                </div>
                {props.service ? null : (
                  <div className="field">
                    <label>{i18n("Service")}:</label>
                    <SelectService defaultValue={state.service && state.service.uuid} services={services} onChange={this.handleServiceChange}/>
                  </div>
                )}
              </div>

              <div>
                <h2 className="ui uppercase header" style={{paddingTop:20}}>Trigger</h2>
                <div className="field">
                  <label>{i18n("Trigger")}:</label>
                  <TriggerSelect defaultValue={state.trigger} onChange={this.handleTriggerChange} triggers={triggers}/>
                </div>
                <GenericForm
                  fields={trigger_params}
                  data={merge(state.trigger_config, {service: this.state.service})}
                  updateForm={this.handleTriggerConfigChange}/>
              </div>

              {actions.length != 0 ? (
                <RuleActions
                  actions={actions}
                  action_catalog={props.action_catalog}
                  handleActionConfig={this.handleActionConfig}
                  defconfig={defconfig}
                  />
              ) : null }
            </div>

            <button
              className="ui yellow button"
              onClick={this.handleSave}
              style={{marginBottom: 50, marginTop: 20}}>
                {i18n("Save changes")}
            </button>
          </div>
        </div>
      </Modal>
    )
  }
})
export default Details
