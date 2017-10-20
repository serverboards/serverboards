import React from 'react'
import i18n from 'app/utils/i18n'
import { goto } from 'app/utils/store'
import cache from 'app/utils/cache'
import Rule from 'app/containers/rules_v2/rule'
import RuleAdd from 'app/containers/rules_v2/add'
import { sort_by_name, colorize, map_get } from 'app/utils'
import Icon from '../iconicon'
import AddButton from 'app/components/project/addbutton'
import Selector from 'app/components/selector'
import RuleAddTemplate from 'app/containers/rules_v2/addtemplate'
import plugin from 'app/utils/plugin'
import Flash from 'app/flash'

function get_services_id(node){
  if (!node){
    console.warn("Trying to get services ids from %o", node)
    return []
  }
  if (node.template_data){
    return [node.template_data.service]
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

/**
 * All filters must be presetn at text.
 */
function match_filter_all(text, filters){
  for (let f of filters){
    if (!text.toLocaleLowerCase().includes(f))
      return false
  }
  return true
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
    const trigger_name = map_get(props, ["rule","rule","when","trigger"])
    let trigger_icon

    if (trigger_name)
      trigger_icon = cache
        .trigger(trigger_name)
        .then( t => t && t.icon )
    else
      trigger_icon = Promise.resolve(null)

    const service_icons = get_services_id( props.rule.rule )
      .map( uuid => cache.service(uuid).then( s => s && s.icon ) )
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
      if (trigger_name)
        cache.trigger(trigger_name).then( t => {
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
    const {rule, gotoRule, filter} = this.props
    const state = this.state
    const {icons} = state
    let status
    if (rule.status){
      status=[...rule.status]
    }
    else if (rule.is_active)
      status = ["enabled"]
    else
      status = ["disabled"]

    if (rule.from_template)
      status.push("template")

    // each card filters out itself if required. This is done here, and not in the listing, as each card has the real data to show.
    if (filter){
      if (!match_filter_all([state.name, state.description, ...status].join(' '), filter))
        return null
    }

    return (
      <div className="narrow rule card">
        <div className="header">
          {icons.map( (icon, i) => (i == 0) ? (
            <Icon key={i} icon={icon} className="ui mini"/>
          ) : (
            <span key={i}>
              +
              <Icon icon={icon} className="ui mini"/>
            </span>
          ))}
          <div className="right">
            {status.map( (s, i) => (
              <span key={i} className="ui text label">
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
            <input type="checkbox" defaultChecked={rule.is_active} ref="toggle_input"/>
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

class ExistingOrMarketplaceTemplate extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      tab: 1,
      filter: ""
    }
  }
  get_rule_presets(){
    return cache.plugin_component({type: "rule template"})
  }
  get_rule_template_market_catalog(){
    return Promise.all([
        plugin.start_call_stop(
              "serverboards.optional.update/updater",
              "component_filter",
              {type: "rule template"}
            )
        , cache.plugins()
      ]).then( (cp) => {
        const catalog = cp[0]
        const plugin_list = cp[1]

        console.log("Got catalog %o // %o", catalog, plugin_list)
        return catalog.filter( c => !plugin_list[c.plugin] )
      })
  }
  render(){
    const props = this.props
    const {tab, filter} = this.state
    return (
      <div className="extend">
        <div className="ui attached top form">
          <div className="ui input seamless white">
            <i className="icon search"/>
            <input type="text" onChange={(ev) => this.setState({filter:ev.target.value})} placeholder={i18n("Filter...")} defaultValue={filter}/>
          </div>
        </div>
        <div className="ui padding">
          <h2 className="ui centered header">{i18n("Create rule from template")}</h2>
          <div>{i18n("Use these presets to fast add rules to your projects for most common tasks. Use the 'Create new rule' button on the menu bar to create one from scratch.")}</div>
        </div>
        <div className="ui pointing secondary menu">
          <a className={`item ${tab==1 ? "active" : ""}`} onClick={() => this.setState({tab:1})}>
            {i18n("Available templates")}
          </a>
          <a className={`item ${tab==2 ? "active" : ""}`} onClick={() => this.setState({tab:2})}>
            {i18n("Marketplace")}
          </a>
        </div>
        { tab == 1 ? (
          <Selector
            get_items={this.get_rule_presets.bind(this)}
            filter={filter}
            onSelect={(rt) => goto(`/project/${props.project.shortname}/rules_v2/add`, {template: rt})}
            show_filter={false}
          />
        ) : (
          <Selector
            key="marketplace"
            show_filter={false}
            filter={filter}
            get_items={this.get_rule_template_market_catalog}
            onSelect={(rt) => {
              this.setState({tab:3})
              plugin.install(rt.giturl).then(() => {
                cache.invalidate_all()
                rt = {...rt, type: rt.id} // I need the component id in the type field.
                goto(`/project/${props.project.shortname}/rules_v2/add`, {template: rt})
              }).catch((error) => {
                console.error(error)
                this.setState({tab:2})
                Flash.error(i18n("Error installing *{plugin}*. Please try again or check logs.\n\n{error}", {plugin:rt.name, error}))
              })
            }}
            />
        )}
      </div>
    )
  }
}


class Rules extends React.Component{
  constructor(props){
    super(props)

    this.state={
      filter: "",
      filterTimeout: null
    }
  }
  setFilter(filter){
    if (this.state.filterTimeout)
      clearTimeout(this.state.filterTimeout)
    let filterTimeout = setTimeout( () => {
      this.setState({
        filter: filter.toLocaleLowerCase().split(' '),
        filterTimeout: null
      })
    }, 300)
    this.setState({filterTimeout})
  }
  gotoRule(rule){
    const project = this.props.project.shortname
    goto(`/project/${project}/rules_v2/${rule.uuid}`)
  }
  RuleMenu(props){
    return (
      <div className="right menu">
        <button className="ui teal button" onClick={() => goto(`/project/${props.project}/rules_v2/add`)}>
          {i18n("New rule")}
        </button>
      </div>
    )
  }
  componentDidMount(){
    this.props.setSectionMenu( this.RuleMenu, { project: this.props.project.shortname } )
  }
  render(){
    let rules = (this.props.rules || [])
    rules = sort_by_name(rules)
    return (
      <div className="ui expand two column grid grey background" style={{margin:0}}>
        <div className="ui column">
          <div className="ui round pane white background">
            <div className="ui attached top form">
              <div className="ui input seamless white">
                <i className="icon search"/>
                <input type="text" onChange={(ev) => this.setFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
              </div>
            </div>
            <div className="ui scroll extend with padding">
              <div className="ui rule cards">
              {rules.map( (r) => (
                <RuleCard
                  key={r.uuid}d
                  rule={r}
                  gotoRule={this.gotoRule.bind(this)}
                  updateActive={(v) => this.props.updateActive(r.uuid, v)}
                  filter={this.state.filter}
                  />
              ) ) }
            </div>
          </div>
        </div>
      </div>
      <div className="ui column">
        <div className="ui round pane white background">
          <ExistingOrMarketplaceTemplate
            {...this.props}
          />
        </div>
      </div>
      <AddButton project={this.props.project.shortname}/>
    </div>
    )
  }
}

function RulesRouter(props){
  if (props.subsection){
    if (props.subsection=="add"){
      if (props.location.state.template)
        return (
          <RuleAddTemplate
            template={props.location.state.template.id}
            prevStep={() => goto(`/project/${props.project.shortname}/rules_v2/`)}
            {...props}
            />
        )
      return (
        <RuleAdd {...props}/>
      )
    }
    const subsection = props.subsection
    const rule = props.rules.find( r => r.uuid == subsection)
    if (rule.from_template)
      return (
        <RuleAddTemplate
          template={rule.from_template}
          prevStep={() => goto(`/project/${props.project.shortname}/rules_v2/`)}
          data={rule.rule.template_data || {}}
          edit={rule}
          {...props}
          />
      )
  else
      return (
        <Rule {...props} rule={rule}/>
      )
  }
  return <Rules {...props}/>
}

export default RulesRouter
