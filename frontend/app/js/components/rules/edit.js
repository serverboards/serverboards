import React from 'react'
import GenericForm from '../genericform'
import Modal from 'app/components/modal'
import ImageIcon from 'app/components/imageicon'
import { to_map, to_list, merge } from 'app/utils'
import ActionEdit from './actionedit'

const icon = require("../../../imgs/rules.svg")


const Details=React.createClass({
  getInitialState(){
    const service_uuid=this.props.rule.service
    let service=undefined
    if (service_uuid){
      service = this.props.services.find( (s) => s.uuid == service_uuid )
    }
    //console.log("service %o %o %o", this.props.rule, service_uuid, service)

    return {
      service,
      trigger: {
        trigger: undefined,
        params: {}
      },
      actions: []
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.service).dropdown({
      onChange(value, text, $el){
        const service = self.props.services.find( (s) => s.uuid == value )
        self.setState({service})
      }
    })
    $(this.refs.trigger).dropdown({
      onChange(value, text, $el){
        self.handleChangeTrigger(value)
      },
    }).dropdown("set selected", this.props.rule.trigger.trigger)
    $(this.refs.el).find('.toggle').checkbox();
  },
  componentDidUpdate(newprops){
    if (newprops.triggers != this.props.triggers){
      $(this.refs.el).find('.dropdown').dropdown('refresh');

      $(this.refs.trigger).dropdown("set selected", this.props.rule.trigger.trigger)
      this.handleChangeTrigger(this.props.rule.trigger.trigger, newprops.triggers)
    }
  },

  handleChangeTrigger(v, triggers){
    //console.log(v)
    triggers = triggers || this.props.triggers
    if (!triggers)
      return
    const trigger=triggers.find((el) => el.id == v)
    if (trigger){
      let trigger_params
      let actions
      if (v == this.props.rule.trigger.trigger){
        trigger_params=this.props.rule.trigger.params
        actions=trigger.states.map( (st) => ({
          state: st,
          action: this.props.rule.actions[st].action,
          params: this.props.rule.actions[st].params
        }))
      } else {
        trigger_params={}
        actions=trigger.states.map( (st) => ({
          state: st,
          action: undefined,
          params: {}
        }))

      }
      this.setState({  trigger: { trigger: v, params: trigger_params}, actions  })
    }
  },
  handleUpdateTriggerConfig(params){
    this.setState({trigger: {trigger: this.state.trigger.trigger, params }})
  },
  handleActionConfig(state, action_id, params){
    const actions = this.state.actions.map( (ac) => {
      if (ac.state == state)
        return { state: state, action: action_id, params: params }
      return ac
    })
    this.setState({ actions })
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

    let $el=$(this.refs.el)
    let rule={
      uuid: props.rule.uuid,
      is_active: $el.find("input[name=is_active]").is(":checked"),
      name: $el.find("input[name=name]").val(),
      description: $el.find("textarea[name=description]").val(),
      service: this.state.service && this.state.service.uuid,
      serverboard: props.serverboard,
      trigger: {
        trigger: state.trigger.trigger,
        params: state.trigger.params
      },
      actions: actions
    }
    console.log(rule)
    this.props.onSave(rule)
  },
  render(){
    const props=this.props
    const triggers = props.triggers || []
    const services=props.services
    const state=this.state
    const actions = state.actions
    let defconfig=merge( this.state.service && this.state.service.config || {}, {service: this.state.service && this.state.service.uuid } )
    let trigger_fields=triggers.find( (tr) => tr.id == state.trigger.trigger )
    trigger_fields=trigger_fields && trigger_fields.start && trigger_fields.start.params || []
    trigger_fields=trigger_fields.filter( (tf) => !(tf.name in defconfig) )
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
                <label>Active</label>
                <input type="checkbox" defaultChecked={props.rule.is_active} name="is_active"/>
              </div>
            </div>
          </div>
        </div>
        <h1 className="ui medium header side centered">
        <ImageIcon src={icon}  name={props.rule.name}/>
        <br/>
        {props.rule.name}
        </h1>

        <div className="ui form">
          <div className="field">
            <label>Name:</label>
            <input type="text" defaultValue={props.rule.name} name="name"/>
          </div>
          <div className="field">
            <label>Description:</label>
            <textarea type="text" defaultValue={props.rule.description} name="description"/>
          </div>
          <div className="field">
            <label>Service:</label>
            <div ref="service" className="ui fluid search normal selection dropdown">
              <input type="hidden" defaultValue={props.rule.service} name="service"/>
              <i className="dropdown icon"></i>
              <div className="default text">Select service.</div>
              <div className="menu">
                <div className="item" data-value="">No service</div>
                {services.map( (sv) => (
                  <div key={sv.uuid} className="item" data-value={sv.uuid}>
                    {sv.name}
                    <span style={{float: "right", paddingLeft: 10, fontStyle: "italic", color: "#aaa"}}>
                      {Object.keys(sv.config).map((k) => sv.config[k]).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="ui uppercase header">When</h2>
          <div className="field">
            <label>Trigger:</label>
            <div ref="trigger" className="ui fluid search normal selection dropdown">
              <input type="hidden" defaultValue={props.rule.trigger.trigger}
                name="trigger" onChange={this.handleChangeTrigger}/>
              <i className="dropdown icon"/>
              <div className="default text">Select trigger</div>
              <div className="menu">
                {triggers.map( (tr) => (
                  <div key={tr.id} className="item" data-value={tr.id}>{tr.name}</div>
                ))}
              </div>
            </div>
          </div>
          <GenericForm fields={trigger_fields} data={state.trigger.params} updateForm={this.handleUpdateTriggerConfig}/>

          {actions.length != 0 ? (
            <h2 className="ui header uppercase">on</h2>
          ) : (
            <span/>
          )}

          {props.action_catalog && actions.map( (action) =>
            <ActionEdit key={action.state} action={action} catalog={props.action_catalog} onUpdateAction={this.handleActionConfig} noparams={defconfig}/>
          )}

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
