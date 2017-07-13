import React from 'react'

class Action extends React.Component{
  render(){
    const {onChangeSection, action, section} = this.props
    return (
      <div className="action">
        <div className="ui card">
          <a
            className={section.id == action.id ? "active" : null}
            onClick={() => onChangeSection("action", action.id ,{})}
            >{action.id} -> {action.action}</a>
        </div>
      </div>
    )
  }
}

function Condition(props){
  const {action, onChangeSection, section} = props
  return (
    <div className="condition">
      <div className="legend"><i className="ui large icon help circle"/> IF</div>
      <div className="ui card">
        <a
          className={section.id == action.id ? "active" : null}
          onClick={() => onChangeSection("condition", action.id ,{condition: action.condition})}
          >{action.condition}</a>
      </div>
      <div className="ui connected">
        <div className="legend"><i className="ui large icon thumbs outline up circle"/> THEN</div>
        {action.then.map( (a, i) => (
          <ActionOrCondition {...props} key={i} action={a}/>
        ))}
      </div>
      <div className="ui connected">
        <div className="legend"><i className="ui large icon thumbs outline down circle"/> ELSE</div>
        {action.else.map( (a, i) => (
          <ActionOrCondition {...props} key={i} action={a}/>
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
