import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from 'app/components/selector'
import GenericForm from 'app/components/genericform'
import Loading from 'app/components/loading'
import {object_is_equal} from 'app/utils'
import RulesHelp from './ruleshelp'

class ActionParams extends React.Component{
  constructor(props){
    super(props)
    this.state={
      data: props.data,
      modified: false
    }
    this.updateForm = (data) => {
      // console.log("modified?", data, props.data, object_is_equal(data, props.data))
      const modified = !object_is_equal(data, props.data)
      this.setState({data, modified})
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
          className="ui scroll"
          fields={props.fields}
          data={state.data}
          updateForm={this.updateForm}
          />
        <RulesHelp
          rule={props.rule}
          title={i18n("Templating help")}
          description={i18n("You can use templated variables to change the behaviour of your action, for example using '{{rule.name}}'")}/>
        <div className="separator" style={{height: 20}}/>
        <div className="ui right aligned">
          <div className="ui buttons">
            <button className="ui button basic" onClick={props.prevStep}>{i18n("Previous step")}</button>
            {state.modified ? (
              <button className="ui teal button" onClick={() => props.onUpdate(state.data)}>{i18n("Save and Continue")}</button>
            ) : (
              <button className="ui button basic" onClick={props.nextStep}>{i18n("Next step")}</button>
            )}
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
      step: this.props.action.action ? 2 : 1, // If has action, go to edit params. 
      data: props.action.params,
      action: undefined,
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
  componentDidMount(){
    cache
      .action(this.props.action.action)
      .then( action => {
        if (action)
          this.setState({action})
        else
          this.setState({action: {type: action, action: undefined, id: "", params: {}}})
      })
  }
  render(){
    const props = this.props
    const state = this.state
    const {action} = state
    if (!action)
      return (
        <Loading>{i18n("Action description")}</Loading>
      )
    if (state.step==1){
      return (
        <Selector
          {...props}
          current={state.action.action || state.action.id}
          get_items={cache.action_catalog}
          icon="lightning"
          title={i18n("Select an action")}
          description={i18n("Select an action (1/2)")}
          nextStep={() => this.setState({step:2})}
          prevStep={() => props.gotoStep("prev", undefined, props.id)}
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
          nextStep={() => props.gotoStep("next", undefined, props.id)}
          onUpdate={this.handleUpdate}
          rule={props.rule}
          />
      )
    }
  }
}

export default Action
