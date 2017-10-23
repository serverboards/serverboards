import React from 'react'
import plugin from 'app/utils/plugin'
import RichDescription from './richdescription'
import store from 'app/utils/store'
import Flash from 'app/flash'
import {object_is_equal} from 'app/utils'

function data_from_form_data( fields, form_data ){
  if (!fields) // No fields set, return all
    return form_data
  let data = {}
  Object.keys(form_data).map( (k) => {
    let ff = fields.find( f => f.name == k)
    // Only pass through the known fields
    if (ff){
      if (ff.type == "service"){
        let service_id = form_data[k]
        data[k]=store.getState().project.project.services.find( s => s.uuid == service_id )
      }
      else{
        data[k]=form_data[k]
      }
    }
  })
  return data
}

class SelectCall extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      items: []
    }
  }
  componentDidMount(){
    const data = data_from_form_data( props.options.params, this.props.form_data )
    this.reloadData(data)
  }
  reloadData(data){
    this.setState({loading:true})
    const props = this.props
    plugin.start(props.options.command).then( (pl) => {
      pl.call(props.options.call, data).then( (items) => {
        console.log(items)
        this.setState({items, loading: false})
        pl.stop()
        let dd = $(this.refs.select).dropdown({
          onChange: (value) => {
            this.props.setValue(this.props.name, value)
          }
        })

        const value = this.props.value
        if (items.find( i => i.value == value ))
          dd.dropdown('set value',value)
        else
          dd.dropdown('set value',"")
      }).catch( e => {
        pl.stop()
        console.error(e)
        Flash.error(e)
      })
    })
  }
  componentWillReceiveProps(newprops){
    const params = this.props.options.params
    const data = data_from_form_data( params, this.props.form_data )
    const newdata = data_from_form_data( params, newprops.form_data )

    console.log("check data change", data, newdata, !object_is_equal(data, newdata))
    if (newprops.dynamic && !object_is_equal(data, newdata) ){
      console.log("Update dyncall")
      this.reloadData(newdata)
    }
  }
  render(){
    const {props, state} = this
    return (
      <div className="field">
        <label>{props.label}</label>
        <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
        <div ref="select" className={`ui fluid ${props.search ? "search" : ""} selection dropdown ${ state.loading ? "disabled" : ""}`}>
          <input type="hidden" name={props.name} defaultValue={props.value} onChange={props.onChange}/>
          <i className="dropdown icon"></i>
          <div className="default text" style={{display:"block"}}>{(props.value || {}).uuid || props.value || props.placeholder}</div>
          <div className="menu">
            {(this.state.items || []).map( (ac) => (
              <div key={ac.value} className="item" data-value={ac.value}>{ac.name || ac.value}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }
}

export default SelectCall
