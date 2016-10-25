import React from 'react'
import RuleEdit from 'app/containers/rules/edit'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import Rule from './rule'

require('sass/rules.sass')

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
