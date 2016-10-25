import React from 'react'
import ImageIcon from 'app/components/imageicon'

const icon = require("../../../imgs/rules.svg")

function find_by_id(id, catalog){
  if (!catalog)
    return undefined
  for(let tr of catalog)
    if (tr.id==id)
      return tr
  return undefined
}
function find_by_uuid(uuid, catalog){
  if (!catalog)
    return undefined
  for(let tr of catalog)
    if (tr.uuid==uuid)
      return tr
  return undefined
}

function TriggerDetails({trigger, trigger_catalog}){
  const template=find_by_id(trigger.trigger, trigger_catalog)
  const params=template.start.params.filter( (p) => p.card )
  return (
    <div>
      <h5 className="ui header" style={{marginBottom: 0}}>{(template || {name: trigger.trigger }).name}</h5>
      <div style={{paddingLeft: 10}}>
      {params.map( (p) => (
        <div key={p.name} className="ui oneline"><label>{p.label}:</label> <span className="meta">{trigger.params[p.name]}</span></div>
      ))}
      </div>
    </div>
  )
}

function ActionDetails({action, state, action_catalog}){
  let action_template=find_by_id(action.action, action_catalog)
  let params
  if (action_template)
    params=action_template.extra.call.params.filter( (p) => p.card )
  else {
    params = []
    action_template={name: action.action}
  }

  return (
    <div>
      <div>
        <span className="ui meta uppercase">IF </span>
        <span className="">{state}</span>
        <span className="ui meta uppercase"> THEN </span>
        <span className="">
        {action_template.name}
        </span>
      </div>
      <div style={{paddingLeft: 10}}>
        {params.map( (p) => (
          <div key={p.name} className="ui oneline"><label>{p.label}:</label> <span className="meta">{action.params[p.name]}</span></div>
        ))}
      </div>
    </div>
  )
}


function Rule(props){
  const rule = props.rule

  return (
    <div className="rule card">
      <div className="extra content" style={{padding:"0 10px"}}>
        { rule.is_active ? (
          <span><i className="ui label circular empty green"/> ON</span>
        ) : (
          <span><i className="ui label circular empty red"/> OFF</span>
        )
        }
      </div>
      <div className="header content">
        <ImageIcon src={icon} className="right floated"  name={rule.name}/>
        <h2 className="ui header">{rule.name}</h2>
        <div className="meta">{rule.description}</div>
        <div>{(find_by_uuid(rule.service, props.service_catalog) || {name: rule.service}).name}</div>
      </div>
      <div className="content">
        <h3 className="ui header uppercase">Trigger</h3>
        <TriggerDetails trigger={rule.trigger} trigger_catalog={props.trigger_catalog}/>
      </div>
      <div className="content">
        <h3 className="ui header uppercase">Action</h3>
        <div>{Object.keys(rule.actions).map((state) => (
          <ActionDetails key={state} action={rule.actions[state]} state={state} action_catalog={props.action_catalog}/>
        ))}</div>
      </div>
      <div className="extra content" style={{padding:0}}>
        <div className={`ui inverted ${ rule.is_active ? 'yellow' : 'grey'} menu bottom attached`}>
          <a className="ui right item" style={{marginRight: 10}}  onClick={props.onOpenEdit} >
          Edit rule <i className="ui angle right icon"/>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Rule
