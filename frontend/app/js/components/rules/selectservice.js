import React from 'react'
import {i18n} from 'app/utils/i18n'

const SelectService=React.createClass({
  propTypes:{
    onChange: React.PropTypes.func.isRequired,
    services: React.PropTypes.array.isRequired,
    service: React.PropTypes.shape({
      uuid: React.PropTypes.string
    })
  },
  find_service(uuid){
    return this.props.services.find( (s) => s.uuid == uuid )
  },
  componentDidMount(){
    let self=this
    $(this.refs.service).dropdown({
      onChange(value, text, $el){
        self.props.onChange(self.find_service(value))
      }
    })
    this.setService()
  },
  setService(){
    $(this.refs.service).dropdown('set selected', this.props.defaultValue)
  },
  get_value(field){
    if (field.type=='service'){
      const uuid = field.value
      const service = this.props.services.find( s => s.uuid == uuid )
      if (service)
        return service.name
    }
    else
      return field.value
  },
  render(){
    const {services, defaultValue}=this.props
    return (
      <div ref="service" className="ui fluid search normal selection dropdown">
        <input type="hidden" defaultValue={defaultValue && defaultValue.uuid} name="service"/>
        <i className="dropdown icon"></i>
        <div className="default text">{i18n("Select service")}</div>
        <div className="menu">
          <div className="item" data-value="">{i18n("No service")}</div>
          {services.map( (sv) => (
            <div key={sv.uuid} className="item" data-value={sv.uuid}>
              {i18n(sv.name)}
              <span style={{float: "right", paddingLeft: 10, fontStyle: "italic", color: "#aaa"}}>
                {sv.fields.filter( f => f.card ).map( (f) => this.get_value(f)).join(', ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
})

export default SelectService
