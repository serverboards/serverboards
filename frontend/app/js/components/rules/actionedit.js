import React from 'react'
import GenericForm from '../genericform'

const ActionEdit=React.createClass({
  propTypes:{
    catalog: React.PropTypes.arrayOf(React.PropTypes.object).isRequired, // Full catalog of actions
    action: React.PropTypes.shape({ // Current action definition, to prefill
      state: React.PropTypes.string, // State id, ex. UP
      action: React.PropTypes.string, // Action id, ex. serverboards.core.actions/set-label
      params: React.PropTypes.object, // Current configuration of the action
    }),
    onUpdateAction: React.PropTypes.func, // Action to call whenever the action is updated
    noparams: React.PropTypes.object, // Prefilled params at action, do not show
  },
  getInitialState(){
    return {
      action: (this.props.action || {}).action,
      params: (this.props.action || {}).params
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
  componentDidUpdate(newprops){
    if (this.props.catalog && !this.state.action && newprops.action.action){
      const action=newprops.action
      console.log("Set action %o // %o", action, this.props.catalog)
      $(this.refs.action).dropdown('set selected', action.action)
      this.props.onUpdateAction(action.state, action.action, action.params)
      this.setState({action: action.action, params: action.params})
    }
  },
  handleParamsChange(params){
    this.props.onUpdateAction(this.props.action.state, this.state.action, params)
  },
  find_action(id){
    return (this.props.catalog || []).find( (ac) => ac.id == id )
  },
  render(){
    const action_template=this.find_action(this.state.action)
    let params = action_template ? action_template.extra.call.params : []
    const noparams = this.props.noparams || {}
    params=params.filter( (p) => !(p.name in noparams) )
    return (
      <div>
        <div className="field">
          <label>Action:</label>
          <div ref="action" className="ui fluid search normal selection dropdown">
            <input type="hidden" defaultValue={this.state.action} name="action"/>
            <i className="dropdown icon"></i>
            <div className="default text">Select action.</div>
            <div className="menu">
              <div className="item" data-value="">Do nothing</div>
              {(this.props.catalog || []).map( (ac) => (
                <div key={ac.id} className="item" data-value={ac.id}>{ac.name}</div>
              ))}
            </div>
          </div>
        </div>
        <GenericForm fields={params} data={this.state.params} updateForm={this.handleParamsChange}/>

      </div>
    )
  }
})

export default ActionEdit
