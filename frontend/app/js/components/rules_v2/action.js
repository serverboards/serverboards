import React from 'react'
import {concat, object_is_equal} from 'app/utils'
import cache from 'app/utils/cache'

export class Action extends React.Component{
  constructor(props){
    super(props)
    const {action} = props
    this.state={
      description: `${action.action}`
    }
  }
  componentDidMount(){
    cache.action(this.props.action.action).then( ac => {
      this.setState({description: ac.name})
    })
  }
  render(){
    const {gotoStep, action, section, path} = this.props
    return (
      <div className="action">
        <div className="ui card">
          <a
            className={object_is_equal(section.id, path) ? "active" : null}
            onClick={() => gotoStep(path)}
            >{this.state.description}</a>
        </div>
      </div>
    )
  }
}

function ActionMore(props){
  return (
    <div className="legend circle"><i className="ui large icon plus"/></div>
  )
}


export function ActionList(props){
  const {actions, path} = props
  return (
    <div>
      {actions.map( (a, i) =>
        <ActionOrCondition
          {...props}
          key={i}
          action={a}
          path={[...path, i]}/>
        )}
      <ActionMore path={[...path, actions.length]}/>
    </div>
  )
}

export function Condition(props){
  const {action, gotoStep, section, path} = props
  return (
    <div className="condition">
      <div className="legend"><i className="ui large icon help circle"/> IF</div>
      <div className="ui card">
        <a
          className={object_is_equal(section.id, path) ? "active" : null}
          onClick={() => gotoStep(path)}
          >{action.condition}</a>
      </div>
      <div className="ui connected">
        <div className="legend"><i className="ui large icon thumbs outline up circle"/> THEN</div>
        <ActionList {...props} actions={action.then} path={[...path, "then"]}/>
      </div>
      <div className="ui connected">
        <div className="legend"><i className="ui large icon thumbs outline down circle"/> ELSE</div>
        <ActionList {...props} actions={action.else} path={[...path, "else"]}/>
      </div>
    </div>
  )
}

export function ActionOrCondition(props){
  if (props.action.type == "condition" ){
    return (
      <Condition {...props}/>
    )
  }
  return (
    <Action key={props.action.action} {...props}/>
  )
}

export default ActionOrCondition
