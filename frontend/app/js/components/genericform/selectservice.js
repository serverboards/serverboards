import React from 'react'
import rpc from 'app/rpc'
import RichDescription from './richdescription'
import i18n from 'app/utils/i18n'
import store from 'app/utils/store'

const SelectService=React.createClass({
  getInitialState(){
    return { items: [] }
  },
  componentDidMount(){
    let self=this
    let filter = {}
    let store_state = store.getState()
    if (self.props.traits)
      filter.traits=self.props.traits
    if (store_state.project.current)
      filter.project=store_state.project.current

    rpc.call("service.list", filter).then( (services) => {
      const results=services.map( (s) => ({
        //name: s.name,
        value: s.uuid,
        name: s.name,
        description: s.fields.filter( (p) => p.card ).map( (p) => p.value ).join(',')
      }))
      self.setState({items: results})
      $(self.refs.select)
        .dropdown({
          onChange(value){
            self.props.setValue(self.props.name, value)
          }
        })
        .dropdown('set value', this.props.value)
    })
  },
  render(){
    const props = this.props
    return (
      <div className="field">
        <label>{i18n(props.label)}</label>
        <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
        <div ref="select" className={`ui fluid ${props.search ? "search" : ""} selection dropdown`}>
          <input type="hidden" name={props.name} defaultValue={props.value} onChange={props.onChange}/>
          <i className="dropdown icon"></i>
          <div className="default text" style={{display:"block"}}>{(props.value || {}).uuid || props.value || props.placeholder}</div>
          <div className="menu">
            {(this.state.items || []).map( (ac) => (
              <div key={ac.value} className="item" data-value={ac.value}>{ac.name}<span className="ui meta" style={{float:"right"}}>{ac.description}</span></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
})

export default SelectService
