import React from 'react'

import SelectService from './selectservice'
import SelectCall from './selectcall'
import RichDescription from './richdescription'
import GenericButton from './genericbutton'
import i18n from 'app/utils/i18n'

function class_sbds_to_sui(klass){
  switch(klass){
    case "half column":
      return "half"
    default:
      return ""
  }
}

const GenericField=React.createClass({
  getInitialState(){
    return {
      items: [],
      show: this.check_if_show(this.props)
    }
  },
  handleChange: function(ev){
    this.props.setValue(this.props.name, ev.target.value)
  },
  handleChecked: function(ev){
    this.props.setValue(this.props.name, ev.target.checked)
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
  componentWillReceiveProps(newprops){
    const should_show=this.check_if_show(newprops)
    if (this.state.show!=should_show)
      this.setState({show:should_show})
  },
  check_if_show(props){
    if (props.show_if){
      const value = props.form_data[props.show_if]
      if (value==undefined || value=="")
        return false
    }
    return true;
  },
  render(){
    if (!this.state.show)
      return null;
    let props=this.props
    switch (props.type){
      case undefined:
      case '':
      case 'text':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
            <input type="text"
              name={props.name}
              placeholder={i18n(props.placeholder || props.description)}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'url':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
            <input type="url"
              name={props.name}
              placeholder={i18n(props.placeholder || props.description)}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'textarea':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
            <textarea
              name={props.name}
              placeholder={i18n(props.placeholder || props.description)}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'password':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
            <input type="password"
              name={props.name}
              placeholder={i18n(props.placeholder || props.description)}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case "checkbox":
        return (
          <div className="ui checkbox">
            <input type="checkbox" defaultChecked={props.value} id={props.name} onChange={this.handleChecked}/>
            <label htmlFor={props.name}>{props.label}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
          </div>
        )
      case 'description':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars} form_data={props.form_data}/>
          </div>
        )
      case 'hidden':
        return (
          <input type="hidden" disabled={true} name={props.name} value={props.value}/>
        )
      case 'select':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars} form_data={props.form_data}/>
            <select ref="select" name={props.name} defaultValue={props.value} className={`ui fluid ${props.search ? "search" : ""} dropdown`} onChange={this.handleChange}>
              {props.options.map((o) => ( o.value ? (
                <option key={o.value} value={o.value}>{o.label || o.name}</option>
              ) : (
                <option key={o} value={o}>{o}</option>
              ) ) ) }
            </select>
          </div>
        )
      case 'button':
        return (
          <GenericButton {...props} className={class_sbds_to_sui(props["class"])}/>
        )
      case 'select call':
        return (
          <SelectCall {...props} onChange={this.handleChange} className={class_sbds_to_sui(props["class"])}/>
        )
      case 'service':
        return (
          <SelectService {...props} onChange={this.handleChange} className={class_sbds_to_sui(props["class"])}/>
        )
      default:
        return (
          <div className="ui message error" style={{display: "block"}}>Unknown field type "{props.type}"</div>
        )
    }
  }
})

export default GenericField
