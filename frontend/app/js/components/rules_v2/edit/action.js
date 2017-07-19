import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from './selector'
import GenericForm from 'app/components/genericform'

class ActionParams extends React.Component{
  constructor(props){
    super(props)
    this.state={
      data: props.data
    }
    this.updateForm = (data) => {
      this.setState({data})
    }
  }
  render(){
    const props = this.props
    const state = this.state
    return (
      <div className="ui extend with padding">
        <h2 className="ui centered header">
          <i className="ui wrench icon"/>
          {i18n("Setup action")}
        </h2>
        <div className="description">{props.description}</div>
        <div className="separator" style={{height: 40}}/>
        <GenericForm
          fields={props.fields}
          data={state.data}
          updateForm={this.updateForm}
          />
        <div className="separator" style={{height: 40}}/>
        <div className="ui right aligned">
          <div className="ui buttons">
            <button className="ui button basic" onClick={props.prevStep}>{i18n("Previous step")}</button>
            <button className="ui teal button" onClick={() => props.onUpdate(state.data)}>{i18n("Save and Continue")}</button>
          </div>
        </div>
      </div>
    )
  }
}

class Action extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      step: 1,
      data: props.action.params,
      action: props.action,
    }
    this.setType = (action) => {
      console.log("Set type: %o", action)
      this.setState({step:2, action})
    }
    this.handleUpdate = (data) => {
      this.setState({data})
      this.props.onUpdate({
        action: this.state.action.action || this.state.action.id,
        params: data,
        type: "action",
        id: this.props.action.id,
      })
    }
  }

  render(){
    const props = this.props
    const state = this.state
    const {action} = state
    if (state.step==1){
      return (
        <Selector
          {...props}
          current={state.action.action || state.action.id}
          get_items={cache.action_catalog}
          icon="lightning"
          title={i18n("Select an action")}
          description={i18n("Select an action (1/2)")}
          onSelect={this.setType}
          />
      )
    }
    else{
      return (
        <ActionParams
          description={action.description}
          fields={action.extra.call.params}
          data={state.data}
          prevStep={() => this.setState({step: 1})}
          onUpdate={this.handleUpdate}
          />
      )
    }
  }
}

export default Action
