import React from 'react'
import RuleDetails from 'app/containers/rules/details'
import Loading from 'app/components/loading'

function Rule(props){
  const rule = props.rule
  console.log(rule)

  return (
    <tr onClick={props.onOpenDetails} title={rule.description} style={{cursor: "pointer"}} className={rule.is_active ? "positive" : ""} >
      <td>{rule.name}</td>
      <td>{rule.trigger.service}</td>
      <td>{rule.trigger.trigger}</td>
      <td>{Object.keys(rule.actions).map((state) => {
        const ac=rule.actions[state]
        return (
          <div><b>{state}:</b><br/><span style={{paddingLeft: 10}}>{ac.action}</span></div>
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
            <RuleDetails rule={empty_rule} serverboard={props.serverboard.shortname}/>
          </div>
        )
      const rule = props.rules.find( (r) => r.id == props.subsection )
      return (
        <div className="ui text container">
          <RuleDetails rule={rule}/>
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
            <Rule rule={r} onOpenDetails={() => props.onOpenDetails(r)}/>
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
