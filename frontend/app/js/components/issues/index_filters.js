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
      <span className="label">
        <div className="inline field" style={{display: "inline-block"}}>
          <div ref="el" className="ui checkbox">
            <input type="checkbox" className="hidden"/>
            <label className={`ui text ${props.color}`}>{props.value}</label>
          </div>
        </div>
      </span>
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
    this.props.updateFilter(value)
  },
  handleProjectChange(ev){
    const value=ev.target.value
    this.props.updateFilter(value)
  },
  render(){
    const props = this.props
    const current_project = (props.filter.split(' ').filter( f => f.startsWith("project:") ).map( f => f.slice(8) )  || [""])[0]
    return (
      <div className="" ref="el">
        <div className="ui form">
          {(props.labels.length > 0) ? (
            <div className="ui labels">
              <h4 className="ui grey header">{i18n("Filter by labels")}</h4>
              {props.labels.map( (t) => (
                <IssueTag key={t.name} value={t.name} color={t.color}
                  onEnable={() => props.updateFilter(`+tag:${t.name}`)}
                  onDisable={() => props.updateFilter(`-tag:${t.name}`)}
                />
              ))}
              <div className="ui divider"/>
            </div>
          ) : null }
          {props.project ? null : (
            <div className="field">
              <h4 className="ui grey header">{i18n("At project")}</h4>
              <select
                  className="ui dropdown search"
                  onChange={this.handleProjectChange}
                  placeholder={i18n("All projects")}
                  defaultValue={current_project}
                  >
                <option value="-project:">{i18n("All projects")}</option>
                {sorted_projects(props.projects).map((s) => (
                  <option key={s.shortname} value={`project:${s.shortname}`}>{s.name}</option>
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
