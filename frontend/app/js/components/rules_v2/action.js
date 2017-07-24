import React from 'react'
import {concat, object_is_equal} from 'app/utils'
import cache from 'app/utils/cache'
import i18n from 'app/utils/i18n'

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
      this.setState({description: ac ? ac.name : i18n("Select action")})
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
    <a className={`legend circle ${object_is_equal(props.section.id, props.path) ? "active" : ""}`}
        onClick={() => props.gotoStep(props.path)}>
      <i className="ui large icon plus"/>
    </a>
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
      {/*<ActionMore path={[...path, actions.length]}/>*/}
    </div>
  )
}

export function Condition(props){
  console.log(props)
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
      {action.then.length>0 ? (
        <div className="ui connected">
          <div className="legend"><i className="ui large icon thumbs outline up circle"/> THEN</div>
          <ActionList {...props} actions={action.then} path={[...path, "then"]}/>
        </div>
      ) : null}
      {action.else.length>0 ? (
        <div className="ui connected">
          <div className="legend"><i className="ui large icon thumbs outline down circle"/> ELSE</div>
          <ActionList {...props} actions={action.else} path={[...path, "else"]}/>
        </div>
      ) : null}
    </div>
  )
}

export function ActionOrCondition(props){
  switch (props.action.type){
    case "condition":
      return (
        <Condition {...props}/>
      )
    case "add":
      return (
        <ActionMore {...props}/>
      )
    case "action":
    default:
      return (
        <Action key={props.action.action} {...props}/>
      )
  }
}

export default ActionOrCondition
