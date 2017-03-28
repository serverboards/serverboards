import React from 'react'
import i18n from 'app/utils/i18n'

function sorted_projects(projects){
  return projects.sort( (a,b)  => a.name.localeCompare(b.name) )
}

const IssueTag = React.createClass({
  componentDidMount(){
    $(this.refs.el).checkbox({
      onChecked: this.props.onEnable,
      onUnchecked: this.props.onDisable
    })
  },
  render(){
    const props = this.props
    return (
      <div className="label">
        <span className={`ui tag label mini ${props.color}`}> </span>
        <span className="name">{props.value}</span>
        <div className="inline field">
          <div ref="el" className="ui toggle checkbox">
            <input type="checkbox" className="hidden"/>
            <label> </label>
          </div>
        </div>
      </div>
    )
  }
})


const Filters = React.createClass({
  componentDidMount(){
    $(this.refs.el).find('.search')
    $(this.refs.el).find('.dropdown').dropdown()
  },
  handleFilterChange(ev){
    const value=ev.target.value
    this.props.setFilter(value)
  },
  handleServerboardChange(ev){
    const value=ev.target.value
    this.props.setFilter("project:"+value)
  },
  render(){
    const props = this.props
    return (
      <div className="" ref="el">
        <div className="ui search">
          <div className="ui icon input">
            <input className="prompt" type="text" placeholder={i18n("Search...")} value={props.filter}/>
            <i className="search icon"></i>
          </div>
          <div className="results"></div>
        </div>
        <div className="ui form">
          {/*
          <div className="field" style={{marginBottom: 40}}>
            <select className="ui dropdown">
              <option value="order:-open">Show recents first</option>
              <option value="order:+open">Show older first</option>
              <option value="order:-modified">Show recentyly modified first</option>
              <option value="order:+modified">Show more time not modified first</option>
            </select>
          </div>
          <div className="field">
            <select className="ui dropdown" onChange={this.handleFilterChange} placeholder={i18n("Preset filters")}>
              <option value="">{i18n("Preset filters")}</option>
              <option value="status:open">{i18n("Show open")}</option>
              <option value="status:closed">{i18n("Show closed")}</option>
            </select>
          </div>
          */}
          {(props.labels.length > 0) ? (
            <div className="ui labels">
              <h4 className="ui grey header">{i18n("Filter by labels")}</h4>
              <div className="ui divider"/>
              {props.labels.map( (t) => (
                <IssueTag key={t.name} value={t.name} color={t.color}
                  onEnable={() => props.setFilter(`+tag:${t.name}`)}
                  onDisable={() => props.setFilter(`-tag:${t.name}`)}
                />
              ))}
              <div className="ui divider"/>
            </div>
          ) : null }
          {props.project ? null : (
            <div className="field">
              <h4 className="ui grey header">{i18n("At project")}</h4>
              <div className="ui divider"/>
              <select className="ui dropdown search" onChange={this.handleServerboardChange} placeholder={i18n("All projects")}>
                <option value="none">{i18n("All projects")}</option>
                {sorted_projects(props.projects).map((s) => (
                  <option key={s.shortname} value={s.shortname}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    )
  }
})

export default Filters
