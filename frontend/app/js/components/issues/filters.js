import React from 'react'
import {goto} from 'app/utils/store'
import rpc from 'app/rpc'
import i18n from 'app/utils/i18n'
import {sort_by_name} from 'app/utils'

class RelatedElement extends React.Component{
  constructor(props){ super(props)
    this.state = {
      url: undefined,
      name: undefined
    }
  }
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
  }
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
}

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
    return (
      <span>
        {sort_by_name(issue.labels).map( l => (
          <span key={l.name} className={`ui text ${l.color}`} style={{marginLeft: 5}}> {l.name} </span>
        ))}
        <a
          className="ui pointer floating right"
          onClick={() => this.setState({show_all_tags: !this.state.show_all_tags})}>
          {i18n("Edit labels")}
          <i className="icon edit grey" title={i18n("Edit labels")} alt={i18n("Edit labels")}/>
        </a>
        {this.state.show_all_tags && (
          <div className="ui shadow white background floating" style={{zIndex: 10}}>
            <div className="ui secondary menu">
              <a
                className="ui right item"
                onClick={() => this.setState({show_all_tags: false})}>
                  <i className="icon close grey"/>
              </a>
            </div>

            <div className="ui padding left right" style={{paddingTop: 0}}>
              <span style={{lineHeight: "30px"}}>
                {sort_by_name(labels).map( l => (
                  <a
                      key={l.name}
                      className={`ui basic right labeled icon micro button ${l.color}`}
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
              </span>
            </div>
            <div className="ui divider"/>
            <div className="ui form with padding left right down">
              <div className="field">
                <label>{i18n("Add a new label")}</label>
                <input
                  id="labeltoadd"
                  type="text"
                  className="ui inline input"
                  placeholder={i18n("Label to add")}
                  onKeyDown={(ev) => {
                    console.log(ev, ev.charCode, ev.keyCode, ev.code)
                    if (ev.keyCode==13){
                      props.onAddLabel(ev.target.value)
                      ev.target.value=""
                    }
                  }}
                  />
              </div>
              <button className="ui button teal" onClick={() => props.onAddLabel($('#labeltoadd').val())}>
                {i18n("Add label")}
              </button>
            </div>
          </div>
        )}
      </span>
    )
  }
}

export {Labels, Related}
