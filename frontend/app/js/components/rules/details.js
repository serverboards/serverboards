import React from 'react'
import GenericForm from '../genericform'

const ActionDetails=React.createClass({
  getInitialState(){
    return {
      action: undefined
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.action).dropdown({
      onChange(v){
        self.props.onUpdateAction(self.props.action.state, v, {})
        self.setState({action: v, params: {}})
      }
    })
  },

  handleParamsChange(params){
    this.props.onUpdateAction(this.props.action.state, this.state.action, params)
  },
  render(){
    const action=this.props.action
    const action_type=this.props.catalog.find( (ac) => ac.id == this.state.action )
    console.log("Action type %o", action_type)
    const params = action_type ? action_type.extra.call.params : []

    return (
      <div>
        <h3 className="ui header">Action at {action.state}:</h3>
        <div className="field">
          <label>Action:</label>
          <div ref="action" className="ui fluid search normal selection dropdown">
            <input type="hidden" defaultValue={action.action} name="action"/>
            <i className="dropdown icon"></i>
            <div className="default text">Select action.</div>
            <div className="menu">
            {this.props.catalog.map( (ac) => (
              <div key={ac.id} className="item" data-value={ac.id}>{ac.name}</div>
            ))}
            </div>
          </div>
        </div>
        <GenericForm fields={params} updateForm={this.handleParamsChange}/>

      </div>
    )
  }
})

const Details=React.createClass({
  getInitialState(){
    return {
      trigger_id: undefined,
      trigger_params: [],
      trigger_config: {},
      actions: []
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.service).dropdown()
    $(this.refs.trigger).dropdown({
      onChange(value, text, $el){
        self.handleChangeTrigger(value)
      }
    })
  },
  componentDidUpdate(){
    $(this.refs.el).find('.dropdown').dropdown('refresh');
  },

  handleChangeTrigger(v){
    console.log(v)
    const trigger=this.props.triggers.find((el) => el.id == v)
    if (trigger){
      const trigger_params=trigger.call.params
      const actions=trigger.states.map( (st) => ({
        state: st,
        action: undefined,
        params: []
      }))

      this.setState({  trigger_id: v, trigger_params, actions  })
    }
  },
  handleUpdateTriggerConfig(trigger_config){
    console.log("Update trigger %o", trigger_config)
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
      uuid: null,
      is_active: true,
      name: $el.find("input[name=name]").val(),
      description: $el.find("textarea[name=description]").val(),
      service: $el.find("input[name=service]").val(),
      serverboard: props.serverboard,
      trigger: {
        trigger: state.trigger_id,
        params: state.trigger_config
      },
      actions: actions
    }
    console.log(rule)
    this.props.onSave(rule)
  },
  render(){
    const props=this.props
    const triggers = props.triggers || []
    const actions = this.state.actions
    const trigger_params=this.state.trigger_params
    const services=props.services
    return (
      <div ref="el">
        <h1 className="ui header">Rule {props.rule.name}</h1>

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
              <input type="hidden" defaultValue={props.rule.service} name="trigger"/>
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

          <h2 className="ui dividing header">Trigger:</h2>
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
          <GenericForm fields={trigger_params} updateForm={this.handleUpdateTriggerConfig}/>

          <h2 className="ui dividing header">Actions:</h2>
          {actions.map( (action) =>
            <ActionDetails action={action} catalog={props.action_catalog} onUpdateAction={this.handleActionConfig}/>
          )}

          <button className="ui button green" onClick={this.handleSave}>Save changes</button>
        </div>

      </div>
    )
  }
})
export default Details
