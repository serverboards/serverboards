import React from 'react'
import {goto} from 'app/utils/store'
import rpc from 'app/rpc'
import i18n from 'app/utils/i18n'

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

const Filters=React.createClass({
  componentDidMount(){
    $(this.refs.add_labels).hide()
    $(this.refs.add_labels_input).on("change", () => {
      this.props.onAddLabel(this.refs.add_labels_input.value.split(" "))
      this.refs.add_labels_input.value=""
      $(this.refs.add_labels).slideUp()
    })
  },
  handleOpenEditFilters(){
    $(this.refs.add_labels).slideDown(() => {
      $(this.refs.add_labels_input).focus()
    })
  },
  render(){
    const {issue} = this.props
    return (
      <div>
        <div style={{position: "relative"}}>
          <a style={{position: "absolute", top:9, right:0, cursor: "pointer"}} onClick={this.handleOpenEditFilters}><i className="ui add yellow icon"/></a>
          <h4 className="ui header">{i18n("Labels")}</h4>
          <div className="ui form" style={{margin: 20}} ref="add_labels">
            <input type="text" ref="add_labels_input" placeholder={i18n("Press ENTER when finished")}/>
          </div>
          {(issue.labels || []).map( (l) => (
            <div key={l.name} style={{paddingBottom: 10}}>
              <span className={`ui tag label ${l.color}`}>{l.name} <a onClick={() => this.props.onRemoveLabel(l.name)}><i className="ui icon close"/></a></span>
            </div>
          ))}
        </div>
        {issue.aliases.length>0 ? (
          <div>
            <h4 className="ui header">{i18n("Related")}</h4>
              {issue.aliases.map( (a) => (
                <RelatedElement key={a} alias={a}/>
              ))}
          </div>
        ) : null }
        {/*
        <div>
          <h4 className="ui header">Asignees</h4>
          <a><i className="ui add yellow"/></a>
        </div>
        <div>
          <h4 className="ui header">Participants</h4>
        </div>
        <div>
          <h4 className="ui header">Files</h4>
        </div>
        */}
      </div>
    )
  }
})

export default Filters
