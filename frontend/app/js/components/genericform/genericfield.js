import React from 'react'

import SelectService from './selectservice'
import SelectCall from './selectcall'
import RichDescription from './richdescription'
import GenericButton from './genericbutton'

const GenericField=React.createClass({
  getInitialState(){
    return { items: [] }
  },
  handleChange: function(ev){
    this.props.setValue(this.props.name, ev.target.value)
  },
  componentDidMount(){
    // Some may need post initialization
    switch (this.props.type){
      case 'select':
        $(this.refs.select).dropdown()
        break;
      default:
        ;;
      break;
    }
  },
  render(){
    let props=this.props
    switch (props.type){
      case undefined:
      case '':
      case 'text':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <input type="text"
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'url':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <input type="url"
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'textarea':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <textarea
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'password':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <input type="password"
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'description':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
          </div>
        )
      case 'hidden':
        return (
          <input type="hidden" disabled={true} name={props.name} value={props.value}/>
        )
      case 'select':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <select ref="select" name={props.name} defaultValue={props.value} className={`ui fluid ${props.search ? "search" : ""} dropdown`} onChange={this.handleChange}>
              {props.options.map((o) => (
                <option value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )
      case 'button':
        return (
          <GenericButton {...props}/>
        )
      case 'select call':
        return (
          <SelectCall {...props} onChange={this.handleChange}/>
        )
      case 'service':
        return (
          <SelectService {...props} onChange={this.handleChange}/>
        )
      default:
        return (
          <div className="ui message error" style={{display: "block"}}>Unknown field type "{props.type}"</div>
        )
    }
  }
})

export default GenericField
