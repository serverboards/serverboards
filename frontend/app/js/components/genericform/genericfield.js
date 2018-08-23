import React from 'react'
import SelectService from './selectservice'
import SelectCall from './selectcall'
import RichDescription from './richdescription'
import GenericButton from './genericbutton'
import TextArea from './textarea'
import i18n from 'app/utils/i18n'
import event from 'app/utils/event'
import {map_get} from 'app/utils'

function class_sbds_to_sui(klass){
  switch(klass){
    case "half column":
      return "half"
    default:
      return ""
  }
}

class GenericField extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      items: [],
      show: this.check_if_show(this.props)
    }

    this.setValue = this.setValue.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }
  handleChange(ev){
    this.setValue(ev.target.value)
  }
  handleChecked(ev){
    this.setValue(ev.target.checked)
  }
  setValue(val){
    // console.log("Set val", this.props.name, val)
    if (this.refs.field)
      $(this.refs.field).val(val)
    this.props.setValue(this.props.name, val)
  }
  componentDidMount(){
    // Some may need post initialization
    switch (this.props.type){
      case 'select':
        $(this.refs.select).dropdown()
        if (!Boolean(this.props.value)){
          this.setValue(map_get(this.props.options, [0, 'value']))
        }
        break;
      default:
        ;;
      break;
    }
    if (this.props.subscribe){
      const subscribe = `${this.props.subscribe}/${this.props.form_data.form_id}`
      event.on(subscribe, this.setValue)
    }
  }
  componentWillUnmount(){
    if (this.props.subscribe){
      const subscribe = `${this.props.subscribe}/${this.props.form_data.form_id}`
      event.off(subscribe, this.setValue)
    }
  }
  componentWillReceiveProps(newprops){
    const should_show=this.check_if_show(newprops)
    if (this.state.show!=should_show)
      this.setState({show:should_show})
  }
  check_if_show(props){
    if (props.show_if){
      const value = props.form_data[props.show_if]
      if (value==undefined || value=="")
        return false
    }
    return true;
  }
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
              ref="field"
              name={props.name}
              placeholder={i18n(props.placeholder || props.description)}
              value={props.value || props.default}
              onChange={this.handleChange}/>
          </div>
        )
      case 'url':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
            <input type="url"
              ref="field"
              name={props.name}
              placeholder={i18n(props.placeholder || props.description)}
              value={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'textarea':
        return (
          <TextArea {...props} onChange={this.handleChange} className={class_sbds_to_sui(props["class"])}/>
        )
      case 'password':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription
              className="ui meta"
              value={i18n(props.description)}
              vars={props.vars}
              dynamic={props.dynamic}
              />
            <input type="password"
              ref="field"
              name={props.name}
              placeholder={i18n(props.placeholder || props.description)}
              value={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case "checkbox":
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <div className="ui checkbox">
              <input ref="field" type="checkbox" defaultChecked={props.value} id={props.name} onChange={this.handleChecked.bind(this)}/>
              <label htmlFor={props.name} className="ui pointer">{props.label}</label>
              <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
            </div>
          </div>
        )
      case 'description':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription
              className="ui meta"
              dynamic={props.dynamic}
              value={i18n(props.description)}
              vars={props.vars}
              form_data={props.form_data}
            />
          </div>
        )
      case 'hidden':
        return (
          <input type="hidden" ref="field" disabled={true} name={props.name} value={props.value}/>
        )
      case 'select':
        return (
          <div className={`field ${class_sbds_to_sui(props["class"])}`}>
            <label>{i18n(props.label)}</label>
            <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars} form_data={props.form_data}/>
            <select ref="select"
                ref="field"
                name={props.name}
                value={props.value}
                className={`ui fluid ${props.search ? "search" : ""} dropdown`}
                onChange={this.handleChange}
                form_data={props.form_data}
                >
              {props.options.map((o) => ( (o.value != undefined) ? (
                <option key={o.value} value={o.value}>{i18n(String(o.label || o.name))}</option>
              ) : (
                <option key={o} value={o}>{i18n(String(o))}</option>
              ) ) ) }
            </select>
          </div>
        )
      case 'button':
        return (
          <GenericButton {...props} className={props["class"]}/>
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
}

export default GenericField
