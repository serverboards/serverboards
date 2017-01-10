import React from 'react'

function sorted_serverboards(serverboards){
  return serverboards.sort( (a,b)  => a.name.localeCompare(b.name) )
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
    this.props.setFilter("serverboard:"+value)
  },
  render(){
    const props = this.props
    return (
      <div className="" ref="el">
        <div className="ui search">
          <div className="ui icon input">
            <input className="prompt" type="text" placeholder="Search..." value={props.filter}/>
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
          */}
          <div className="field">
            <select className="ui dropdown" onChange={this.handleFilterChange} placeholder="Preset filters">
              <option value="">Preset filters</option>
              <option value="status:open">Show open</option>
              <option value="status:closed">Show closed</option>
            </select>
          </div>
          <div className="ui labels">
            <h4 className="ui grey header">Filter by labels</h4>
            <div className="ui divider"/>
            {props.labels.map( (t) => (
              <IssueTag key={t.name} value={t.name} color={t.color}
                onEnable={() => props.setFilter(`+tag:${t.name}`)}
                onDisable={() => props.setFilter(`-tag:${t.name}`)}
              />
            ))}
            <div className="ui divider"/>
          </div>
          <div className="field">
            <h4 className="ui grey header">At serverboard</h4>
            <div className="ui divider"/>
            <select className="ui dropdown search" onChange={this.handleServerboardChange} placeholder="All serverboards">
              <option value="none">All serverboards</option>
              {sorted_serverboards(props.serverboards).map((s) => (
                <option key={s.shortname} value={s.shortname}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }
})

export default Filters
