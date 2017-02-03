import React from 'react'
import plugin from 'app/utils/plugin'
import RichDescription from './richdescription'
import store from 'app/utils/store'

const SelectCall = React.createClass({
  getInitialState(){
    return {
      items: []
    }
  },
  componentDidMount(){
    const props = this.props
    let self = this
    plugin.start(props.options.command).then( (pl) => {
      let form_data = props.form_data
      let data = {}
      Object.keys(form_data).map( (k) => {
        let ff = props.fields.find( f => f.name == k)
        if (ff.type == "service"){
          let service_id = form_data[k]
          data[k]=store.getState().serverboard.serverboard.services.find( s => s.uuid == service_id )
        }
        else{
          data[k]=form_data[k]
        }
      })
      console.log(data)
      pl.call(props.options.call,data).then( (items) => {
        //console.log(items)
        self.setState({items})
        pl.stop()
        $(self.refs.select).dropdown({
          onChange(value){
            self.props.setValue(self.props.name, value)
          }
        }).dropdown('set value',self.props.value)
      })
    })
  },
  render(){
    const props = this.props
    return (
      <div className="field">
        <label>{props.label}</label>
        <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
        <div ref="select" className={`ui fluid ${props.search ? "search" : ""} selection dropdown`}>
          <input type="hidden" name={props.name} defaultValue={props.value} onChange={props.onChange}/>
          <i className="dropdown icon"></i>
          <div className="default text" style={{display:"block"}}>{(props.value || {}).uuid || props.value || props.placeholder}</div>
          <div className="menu">
            {(this.state.items || []).map( (ac) => (
              <div key={ac.value} className="item" data-value={ac.value}>{ac.name}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }
})

export default SelectCall
