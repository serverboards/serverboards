import React from 'react'
import Rule from './rule'
import {goto} from 'app/utils/store'

require('sass/rules.sass')

const Rules=React.createClass({
  getInitialState(){
    return {
      filter: null
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.filter).dropdown({
      onChange: function(val){
        if (val=="all")
          val=null
        self.setState({filter: val})
      }
    })
  },
  handleAdd(){
    if (this.state.filter)
      goto(`/serverboard/${this.props.serverboard.shortname}/rules/add`, {trigger: this.state.filter})
    else
      goto(`/serverboard/${this.props.serverboard.shortname}/rules/add`)
  },
  render(){
    const props=this.props
    let rules=props.rules

    // Get only rule types that are currently in use
    let trigger_catalog_in_use=rules.map( (r) => r.trigger.trigger ).reduce( (acc, id) => {
      if (acc.indexOf(id)<0)
        acc.push(id)
      return acc
    },[])
      .map( (id) => props.trigger_catalog.find( (tc) => tc.id == id ))
      .filter( (x) => x )

    if (this.state.filter){
      const filter=this.state.filter
      rules=rules.filter( (r) => r.trigger.trigger == filter)
    }

    return (
      <div>
        <div className="ui top secondary header menu">
          <div className="ui inline form fields">
            <label>Filter by trigger type: </label>
            <select ref="filter" className="ui search dropdown">
              <option value="all">Show all</option>
              {trigger_catalog_in_use.map( (t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="ui container">
          <div className="ui cards" style={{paddingTop: 20}}>
            {rules.map((r) =>
              <Rule
                rule={r}
                key={r.uuid}
                onOpenEdit={() => props.onOpenEdit(r)}
                trigger_catalog={props.trigger_catalog}
                service_catalog={props.service_catalog}
                action_catalog={props.action_catalog}
                />
            )}
            </div>
        </div>
        <a onClick={() => this.handleAdd()} className="ui massive button add icon floating yellow">
          <i className="add icon"></i>
        </a>
      </div>
    )
  }
})

export default Rules
