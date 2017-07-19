import React from 'react'
import {concat, object_is_equal} from 'app/utils'
import cache from 'app/utils/cache'

class Action extends React.Component{
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

function Condition(props){
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
        {action.then.map( (a, i) => (
          <ActionOrCondition {...props} key={i} action={a} path={concat(path, ["then", i])}/>
        ))}
      </div>
      <div className="ui connected">
        <div className="legend"><i className="ui large icon thumbs outline down circle"/> ELSE</div>
        {action.else.map( (a, i) => (
          <ActionOrCondition {...props} key={i} action={a} path={concat(path, ["else", i])}/>
        ))}
      </div>
    </div>
  )
}

function ActionOrCondition(props){
  if (props.action.type == "condition" ){
    return (
      <Condition {...props}/>
    )
  }
  return (
    <Action {...props}/>
  )
}

export default ActionOrCondition
