import React from 'react'
import RuleEdit from 'app/containers/rules/edit'
import Loading from 'app/components/loading'
import ImageIcon from 'app/components/imageicon'
import Command from 'app/utils/command'

const icon = require("../../../imgs/rules.svg")

require('sass/rules.sass')

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
    <div className="rule card">
      <div className="header content">
        <ImageIcon src={icon} className="right floated"  name={rule.name}/>
        <h2 className="ui header">{rule.name}</h2>
        <div className="meta">{rule.description}</div>
        <div>{(find_by_uuid(rule.service, props.service_catalog) || {name: rule.service}).name}</div>
      </div>
      <div className="content">
        <h3 className="ui header uppercase">Trigger</h3>
        <div className="meta">
          {(find_by_id(rule.trigger.trigger, props.trigger_catalog) || {nmme: rule.trigger.trigger }).name}
        </div>
      </div>
      <div className="content">
        <h3 className="ui header uppercase">Action</h3>
        <div>{Object.keys(rule.actions).map((state) => {
        const ac=rule.actions[state]
        return (
          <div key={state}>
            <span className="ui meta uppercase">IF </span>
            <span className="">{state}</span>
            <span className="ui meta uppercase"> THEN </span>
            <span className="">
            {(find_by_id(ac.action, props.action_catalog) || {name: ac.action}).name}
          </span></div>
        )
      })}</div>
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

    let self=this
    let serverboard=this.props.serverboard.shortname

    Command.add_command_search('sbds-rules',function(Q,context){
      let ret = [
        {id: 'add-rules', title: 'Add Rule', description: 'Add a new rule', path: `/serverboard/${serverboard}/rules/add` }
      ]
      self.props.rules.map( (r) => {
        ret.push(
          {id: `rule-${r.uuid}`, title: `Rule ${r.name}`, description: `Edit *${r.name}* configuration`,
           path: `/serverboard/${serverboard}/rules/${r.uuid}` }
        )
      } )
      return ret
    },2)
  },
  componentWillUnmount(){
    this.props.cleanRules()
    Command.remove_command_search('sbds-rules')
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
      <div className="ui container">
        <div className="ui cards">
          {props.rules.map((r) =>
            <Rule
              rule={r}
              key={r.uuid}
              onOpenEdit={() => props.onOpenEdit(r)}
              trigger_catalog={props.trigger_catalog}
              service_catalog={props.service_catalog}
              action_catalog={props.action_catalog}/>
          )}
        </div>
        <a href={`#/serverboard/${props.serverboard.shortname}/rules/add`} className="ui massive button add icon floating yellow">
          <i className="add icon"></i>
        </a>
      </div>
    )
  }
})

export default Rules
