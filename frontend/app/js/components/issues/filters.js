import React from 'react'
import {goto} from 'app/utils/store'
import rpc from 'app/rpc'
import i18n from 'app/utils/i18n'
import {sort_by_name} from 'app/utils'

const RelatedElement=React.createClass({
  getInitialState(){
    return {
      url: undefined,
      name: undefined
    }
  },
  componentDidMount(){
    const al=this.props.alias
    if (al.startsWith("rule/")){
      rpc.call("rules.get", [al.slice(5)]).then( rule => {
        let rule_url = `/rules/${rule.uuid}`
        //if (rule.project)
          //rule_url = `/project/${rule.project || "_"}/rules/${rule.uuid}`
        this.setState({
          url: rule_url,
          name: rule.name || (rule.trigger || {}).name || "This rule has no name",
          type: "Rule"
        })
      })
    }
    if (al.startsWith("service/")){
      rpc.call("service.get", [al.slice(8)]).then( s => {
        this.setState({
          url: `/project/${s.projects.length>0 ? s.projects[0] : "_"}/services/${s.uuid}`,
          name: s.name || "This service has no name",
          type: "Service"
        })
      })
    }
    if (al.startsWith("project/")){
      const project=al.slice(8)
      if (!project)
        return
      this.setState({
        url: `/project/${project}/`,
        name: project || "Project",
        type: "Project"
      })
    }
    if (al.startsWith("serverboard/")){
      const project=al.slice(12)
      if (!project)
        return
      this.setState({
        url: `/project/${project}/`,
        name: project,
        type: "Project"
      })
    }
  },
  render(){
    const {url, name, type} = this.state
    if (url){
      return (
        <div>
          {type}:&nbsp;
          <a onClick={() => goto(url)} style={{cursor:"pointer"}}>{name}</a>
        </div>
      )
    }
    return (
      <div>{this.props.alias}</div>
    )
  }
})

function Related({issue}){
  return (
    <div>
      {issue.aliases.length>0 ? (
        <div>
          <h4 className="ui header">{i18n("Related")}</h4>
            {issue.aliases.map( (a) => (
              <RelatedElement key={a} alias={a}/>
            ))}
        </div>
      ) : null }
    </div>
  )
}

function has_tag(issue, l){
  for (const t of issue.labels){
    if (l.name == t.name)
      return true
  }
  return false
}

class Labels extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      show_all_tags: false
    }
  }
  render(){
    const {props} = this
    const {issue, labels} = props
    if (this.state.show_all_tags){
      return (
        <span style={{lineHeight: "35px"}}>
          {sort_by_name(labels).map( l => (
            <a
                key={l.name}
                className={`ui pointer text ${l.color}`}
                style={{marginLeft: 5}}
                onClick={() => has_tag(issue, l) ? props.onRemoveLabel(l.name) : props.onAddLabel(l.name) }
            >
              {l.name}
              {has_tag(issue, l) ? (
                <i className="icon remove"/>
              ) : (
                <i className="icon plus"/>
              )}
            </a>
          ))}
          <div className="ui inline form" style={{display: "inline-block"}}>
            <input
              type="text"
              className="ui inline input"
              placeholder={i18n("New label. Press ENTER when finished.")}
              style={{marginTop:-10}}
              onKeyDown={(ev) => {
                console.log(ev, ev.charCode, ev.keyCode, ev.code)
                if (ev.keyCode==13){
                  props.onAddLabel(ev.target.value)
                  ev.target.value=""
                }
              }}
              />
          </div>
          <a
            className="ui pointer"
            onClick={() => this.setState({show_all_tags: false})}>
              <i className="icon close grey"/>
          </a>
        </span>
      )
    }
    else{
      return (
        <span>
          {sort_by_name(issue.labels).map( l => (
            <span key={l.name} className={`ui text ${l.color}`} style={{marginLeft: 5}}> {l.name} </span>
          ))}
          <a
            className="ui pointer"
            onClick={() => this.setState({show_all_tags: true})}>
            <i className="icon edit grey" title={i18n("Edit labels")} alt={i18n("Edit labels")}/>
          </a>
        </span>
      )
    }
  }
}

export {Labels, Related}
