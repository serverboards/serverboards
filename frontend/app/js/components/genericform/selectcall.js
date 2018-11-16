import React from 'react'
import plugin from 'app/utils/plugin'
import RichDescription from './richdescription'
import store from 'app/utils/store'
import Flash from 'app/flash'
import {object_is_equal} from 'app/utils'
import {data_from_form_data} from './utils'
import _ from 'lodash'


class SelectCall extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      items: []
    }
  }
  componentDidMount(){
    const props = this.props
    if (props.options){
      const data = data_from_form_data( props.options.params || [], this.props.form_data )
      this.reloadData(data)
    }
    $(this.refs.select).dropdown()
  }
  reloadData(data){
    this.setState({loading:true})
    const props = this.props
    plugin
      .call(props.options.command, props.options.call, data)
      .then( (items) => {
        this.setState({items, loading: false})
        let dd = $(this.refs.select).dropdown({
          onChange: (value) => {
            this.props.setValue(value)
          }
        })

        let value = this.props.value
        if (!items.find( i => i.value == value )) {
          value = items[0].value
        }
        dd.dropdown('set value', value)
      })
  }
  componentWillReceiveProps(newprops){
    const params = this.props.options.params
    const data = data_from_form_data( params, this.props.form_data )
    const newdata = data_from_form_data( params, newprops.form_data )

    console.log("check data change", data, newdata, !object_is_equal(data, newdata))
    if (newprops.dynamic && !object_is_equal(data, newdata) ){
      // console.log("Update dyncall")
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
