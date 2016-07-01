import React from 'react'
import RuleEdit from 'app/containers/rules/edit'
import Loading from 'app/components/loading'

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

function Rule(props){
  const rule = props.rule

  return (
    <tr onClick={props.onOpenEdit} title={rule.description} style={{cursor: "pointer"}} className={rule.is_active ? "positive" : ""} >
      <td>{rule.name}</td>
      <td>{(find_by_uuid(rule.service, props.service_catalog) || {name: rule.service}).name}</td>
      <td>{(find_by_id(rule.trigger.trigger, props.trigger_catalog) || {nmme: rule.trigger.trigger }).name}</td>
      <td>{Object.keys(rule.actions).map((state) => {
        const ac=rule.actions[state]
        return (
          <div><b>{state}:</b>
            <br/><span style={{paddingLeft: 10}}>
            {(find_by_id(ac.action, props.action_catalog) || {name: ac.action}).name}
          </span></div>
        )
      })}</td>
      <td><i className="ui angle right icon"/></td>
    </tr>
  )
}

const empty_rule={
  uuid: undefined,
  id: undefined,
  service: undefined,
  trigger: {
    trigger: undefined,
    params: {}
  },
  actions: {}
}

const Rules=React.createClass({
  componentDidMount(){
    this.props.onUpdateRules()
  },
  componentWillUnmount(){
    this.props.cleanRules()
  },
  render(){
    const props=this.props
    if (props.rules == undefined){
      return (
        <Loading>Rules</Loading>
      )
    }
    if (props.subsection){
      if (props.subsection == "add")
        return (
          <div className="ui text container">
            <RuleEdit rule={empty_rule} serverboard={props.serverboard.shortname}/>
          </div>
        )
      const rule = props.rules.find( (r) => r.uuid == props.subsection )
      return (
        <div className="ui text container">
          <RuleEdit rule={rule} serverboard={props.serverboard.shortname}/>
        </div>
      )
    }
    return (
      <div className="ui text container">
        <h1 className="ui header">Rules for {props.serverboard.name}</h1>

        <table className="ui very basic selectable table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Service</th>
              <th>Trigger</th>
              <th>Action</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
          {props.rules.map((r) =>
            <Rule rule={r} onOpenEdit={() => props.onOpenEdit(r)}
              trigger_catalog={props.trigger_catalog}
              service_catalog={props.service_catalog}
              action_catalog={props.action_catalog}/>
          )}
          </tbody>
        </table>
        <a href={`#/serverboard/${props.serverboard.shortname}/rules/add`} className="ui massive button add icon floating yellow">
          <i className="add icon"></i>
        </a>
      </div>
    )
  }
})

export default Rules
