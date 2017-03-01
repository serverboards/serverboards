import React from 'react'
import RuleEdit from 'app/containers/rules/edit'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import Rules from './rules'

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

const Index=React.createClass({
  componentDidMount(){
    let self=this
    let project=this.props.project.shortname

    Command.add_command_search('sbds-rules',function(Q,context){
      let ret = [
        {id: 'add-rules', title: 'Add Rule', description: 'Add a new rule', path: `/project/${project}/rules/add` }
      ]
      self.props.rules.map( (r) => {
        ret.push(
          {id: `rule-${r.uuid}`, title: `Rule ${r.name}`, description: `Edit *${r.name}* configuration`,
           path: `/project/${project}/rules/${r.uuid}` }
        )
      } )
      return ret
    },2)
    $(this.refs.filter).dropdown()
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
            <RuleEdit rule={empty_rule} project={props.project.shortname}/>
          </div>
        )
      const rule = props.rules.find( (r) => r.uuid == props.subsection )
      return (
        <div className="ui text container">
          <RuleEdit rule={rule} project={props.project.shortname}/>
        </div>
      )
    }
    return (
      <Rules {...props}/>
    )
  }
})

export default Index
