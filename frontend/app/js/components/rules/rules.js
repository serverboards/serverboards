import React from 'react'
import Rule from './rule'
import {goto} from 'app/utils/store'
import {i18n} from 'app/utils/i18n'
import Empty from './empty'
import AddButton from 'app/components/project/addbutton'

require('sass/rules.sass')

const Rules=React.createClass({
  getInitialState(){
    return {
      trigger_type: null
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.trigger_type).dropdown({
      onChange: function(val){
        if (val=="all")
          val=null
        self.setState({filter: val})
      }
    })
    this.props.setSectionMenu(this.render_menu)
  },
  handleAdd(){
    if (this.state.trigger_type)
      this.props.handleAdd({trigger:this.state.trigger_type, ...this.props.filter})
    else
      this.props.handleAdd(this.props.filter)
  },
  render_menu(){
    const props=this.props
    let rules=props.rules
    // Get only rule types that are currently in use
    let trigger_catalog_in_use=rules.map( (r) => r.trigger.trigger ).reduce( (acc, id) => {
      if (acc.indexOf(id)<0)
        acc.push(id)
      return acc
    },[])
      .map( (id) => (props.trigger_catalog || []).find( (tc) => tc.id == id ))
      .filter( (x) => x )

    return (
      <div className="right menu">
        <div className="ui inline form fields">
          <label>{i18n("Filter by trigger type")}: </label>
          <select className="ui search dropdown">
            <option value="all">{i18n("Show all")}</option>
            {trigger_catalog_in_use.map( (t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
    )
  },
  render(){
    const props=this.props
    let rules=props.rules

    if (this.state.trigger_type){
      const trigger_type=this.state.trigger_type
      rules=rules.filter( (r) => r.trigger.trigger == trigger_type)
    }

    return (
      <div>
        <div className="ui container">
          {(rules.length==0) ? (
            <Empty/>
          ) : (
            <div className="ui cards" style={{padding: 20}}>
              {rules.map((r) =>
                <Rule
                  rule={r}
                  key={r.uuid}
                  onOpenEdit={() => props.handleEdit(r)}
                  trigger_catalog={props.trigger_catalog}
                  service_catalog={props.service_catalog}
                  action_catalog={props.action_catalog}
                  />
              )}
            </div>
          )}
        </div>
        <AddButton project={props.project.shortname}/>
      </div>
    )
  }
})

export default Rules
