import React from 'react'
import i18n from 'app/utils/i18n'

function RuleWhen({when}){
  return (
    <div className="">
      <div className="legend">
        <i className="ui big icon power circle"/>
        WHEN
      </div>
      <div className="ui card">
        <div>
          <i className="ui lego icon"/> Select a service from the sidebar to start with
        </div>
        <div>
          <i className="ui toggle on icon"/> Select a trigger
        </div>
        <div>
          <i className="ui wrench icon"/> Setup trigger
        </div>
      </div>
    </div>
  )
}

function RuleAction({action}){
  if (action.type == "condition" ){
    return (
      <div className="condition">
        <div className="legend"><i className="ui large icon help circle"/> IF</div>
        <div className="ui card">
          {action.condition}
        </div>
        <div className="ui connected">
          <div className="legend"><i className="ui large icon thumbs outline up circle"/> THEN</div>
          {action.then.map( (a, i) => (
            <RuleAction key={i} action={a}/>
          ))}
        </div>
        <div className="ui connected">
          <div className="legend"><i className="ui large icon thumbs outline down circle"/> ELSE</div>
          {action.else.map( (a, i) => (
            <RuleAction key={i} action={a}/>
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

function Rule(props){
  const rule = props.rule

  return (
    <div id="rule" className="ui two column grid grey background" style={{margin:0, height: "100%"}}>
      <div className="ui column">
        <div className="ui round pane white background">
          <div className="ui attached top form">
            <div className="ui input seamless white">
              <i className="icon pencil"/>
              <input type="text" placeholder={i18n("Rule name")} defaultValue={rule.name}/>
            </div>
          </div>
          <div className="ui rule graph with scroll">
            <div className="connected">
              <RuleWhen rule={rule.rule.when}/>
              {rule.rule.actions.map( (action, index) => (
                <RuleAction key={index} action={action}/>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="column">
        <div className="ui round pane white background">
          <div className="ui attached top form">
            <h3 className="ui header">Description</h3>
          </div>
          <textarea className="ui fill area">{rule.description}</textarea>
        </div>
      </div>
    </div>
  )
}

export default Rule
