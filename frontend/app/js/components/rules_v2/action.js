import React from 'react'

function Action({action, onChangeSection}){
  if (action.type == "condition" ){
    return (
      <div className="condition">
        <div className="legend"><i className="ui large icon help circle"/> IF</div>
        <div className="ui card">
          <a onClick={() => onChangeSection("condition", action.id ,{condition: action.condition})}>{action.condition}</a>
        </div>
        <div className="ui connected">
          <div className="legend"><i className="ui large icon thumbs outline up circle"/> THEN</div>
          {action.then.map( (a, i) => (
            <Action key={i} action={a} onChangeSection={onChangeSection}/>
          ))}
        </div>
        <div className="ui connected">
          <div className="legend"><i className="ui large icon thumbs outline down circle"/> ELSE</div>
          {action.else.map( (a, i) => (
            <Action key={i} action={a} onChangeSection={onChangeSection}/>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="action">
      <div className="ui card">
        {action.id} -> {action.action}
      </div>
    </div>
  )
}

export default Action
