import React from 'react'
import RuleEdit from 'app/containers/rules/edit'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import Rules from './rules'
import {i18n} from 'app/utils/i18n'

const Index=React.createClass({
  componentDidMount(){
    let self=this
    let project=(this.props.project || {}).shortname

    if (project){
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
    }
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
        <Loading>{i18n("Rules")}</Loading>
      )
    }
    if (props.subsection){
      return (
        <div className="ui text container">
          <RuleEdit id={props.subsection} project={(props.project || {}).shortname}/>
        </div>
      )
    }
    return (
      <Rules {...props}/>
    )
  }
})

export default Index
