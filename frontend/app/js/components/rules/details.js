import React from 'react'
import GenericForm from '../genericform'

const ActionDetails=React.createClass({
  getInitialState(){
    return {action: undefined}
  },
  componentDidMount(){
    let self=this
    $(this.refs.action).dropdown({
      onChange(v){
        self.setState({action: v})
      }
    })
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
        <GenericForm fields={params}/>

      </div>
    )
  }
})

const Details=React.createClass({
  getInitialState(){
    return {
      trigger_params: [],
      actions: []
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.service).dropdown({
    })
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

      this.setState({  trigger_params, actions  })
    }
  },
  render(){
    const props=this.props
    const triggers = props.triggers || []
    console.log("Details %o", props)
    const actions = this.state.actions
    const trigger_params=this.state.trigger_params
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
            <textarea type="text" defaultValue={props.rule.description} name="trigger"/>
          </div>
          <div className="field">
            <label>Service:</label>
            <div ref="service" className="ui fluid search normal selection dropdown">
              <input type="hidden" defaultValue={props.rule.service} name="trigger"/>
              <i className="dropdown icon"></i>
              <div className="default text">Select service.</div>
              <div className="menu">
                <div className="item" data-value="">No service</div>
                <div className="item" data-value="asdf">Web server</div>
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
          <GenericForm fields={trigger_params}/>

          <h2 className="ui dividing header">Actions:</h2>
          {actions.map( (action) =>
            <ActionDetails action={action} catalog={props.action_catalog}/>
          )}

          <button className="ui button green" onClick={props.handleOnClick}>Save changes</button>
        </div>

      </div>
    )
  }
})
export default Details
