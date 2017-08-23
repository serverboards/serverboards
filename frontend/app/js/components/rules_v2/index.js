import React from 'react'
import i18n from 'app/utils/i18n'
import { goto } from 'app/utils/store'
import cache from 'app/utils/cache'
import Rule from 'app/containers/rules_v2/rule'
import RuleAdd from 'app/containers/rules_v2/add'
import { sort_by_name, colorize } from 'app/utils'
import Icon from '../iconicon'
import AddButton from 'app/components/project/addbutton'
import Selector from 'app/components/selector'

function get_services_id(node){
  if (!node){
    console.warn("Trying to get services ids from %o", node)
    return []
  }
  if (node.when){
    return [...get_services_id(node.when), ...get_services_id(node.actions)]
  }
  if (node.type=="condition"){
    return [...get_services_id(node.then), ...get_services_id(node.else)]
  }
  if (node.type=="trigger"){
    if (node.params && node.params.service_id)
      return [node.params.service_id]
    return []
  }
  if (node.type=="action"){
    if (node.params && node.params.service_id)
      return [node.params.service_id]
    return []
  }
  let ret = []
  for (let i of node){
    ret = [...ret, ...get_services_id(i)]
  }
  return ret
}

class RuleCard extends React.Component{
  constructor(props){
    super(props)
    this.state={
      name: this.props.rule.name,
      description: this.props.rule.description,
      icons: []
    }
  }
  componentDidMount(){
    const props = this.props
    const trigger_icon = cache
      .trigger(props.rule.rule.when.trigger)
      .then( t => t && t.icon )
    const service_icons = get_services_id( props.rule.rule )
      .map( uuid => cache.service(uuid).then( s => s.icon ) )
    Promise
      .all(
        [
          trigger_icon,
          ...service_icons
        ]
      ).then( icons =>
        this.setState({icons: icons.filter(s => s)})
      )

    $(this.refs.toggle).checkbox({
      onChange: (ev) => props.updateActive(this.refs.toggle_input.checked)
    })
    if (!this.state.name || !this.state.description){
      cache.trigger(props.rule.rule.when.trigger).then( t => {
        if (t){
          let changes = {}
          if (!this.state.name)
            changes["name"]=t.name
          if (!this.state.description)
            changes["description"]=t.description
          this.setState(changes)
        }
      })
    }
  }
  render(){
    const {rule, gotoRule} = this.props
    const state = this.state
    const {icons} = state
    let status
    if (rule.status){
      status=rule.status
    }
    else if (rule.is_active)
      status = ["enabled"]
    else
      status = ["disabled"]
    return (
      <div className="narrow rule card">
        <div className="header">
          {icons.map( (icon, i) => (i == 0) ? (
            <Icon key={i} icon={icon} className="ui mini"/>
          ) : (
            <span>
              +
              <Icon key={i} icon={icon} className="ui mini"/>
            </span>
          ))}
          <div className="right">
            {status.map( s => (
              <span className="ui text label">
                {s}&nbsp;
                <i className={`ui rectangular label ${ colorize( s ) }`}/>
              </span>
            ))}
          </div>
        </div>
        <div className="content">
          <h3 className="ui header">{state.name}</h3>
          <div>{state.description}</div>
        </div>

        <div className="extra content">
          <div className="ui input checkbox toggle" ref="toggle">
            <input type="checkbox" checked={rule.is_active} ref="toggle_input"/>
          </div>
          <div className="right">
            <a className="ui text teal" onClick={() => gotoRule(rule)} >
              <i className="ui ellipsis horizontal icon teal"/>
            </a>
          </div>
        </div>
      </div>
    )
  }
}

const Rules = React.createClass({
  gotoRule(rule){
    const project = this.props.project.shortname
    goto(`/project/${project}/rules_v2/${rule.uuid}`)
  },
  get_rule_presets(){
    return cache.plugin_component({type: "rule template"})
  },
  render(){
    if (this.props.subsection){
      if (this.props.subsection=="add")
        return (
          <RuleAdd {...this.props}/>
        )
      const subsection = this.props.subsection
      const rule = this.props.rules.find( r => r.uuid == subsection)
      return (
        <Rule {...this.props} rule={rule}/>
      )
    }

    let rules = (this.props.rules || [])
    rules = rules.filter( r => !r.from_template )
    rules = sort_by_name(rules)
    return (
      <div className="ui expand two column grid grey background" style={{margin:0}}>
        <div className="ui column">
          <div className="ui round pane white background with padding and scroll">
            <div className="ui rule cards">
            {rules.map( (r) => (
              <RuleCard
                key={r.uuid}
                rule={r}
                gotoRule={this.gotoRule}
                updateActive={(v) => this.props.updateActive(r.uuid, v)}
                />
            ) ) }
          </div>
        </div>
      </div>
      <div className="ui column">
        <div className="ui round pane white background">
          <Selector
            title={i18n("Fast add a rule")}
            description={i18n("Use these presets to fast add rules to your projects for most common tasks. Use the 'Create new rule' button on the menu bar to create one from scratch.")}
            get_items={this.get_rule_presets}
          />
        </div>
      </div>
      <AddButton project={this.props.project.shortname}/>
    </div>
    )
  }
})

export default Rules
