import React from 'react'

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
  render(){
    const {services, defaultValue}=this.props
    return (
      <div ref="service" className="ui fluid search normal selection dropdown">
        <input type="hidden" defaultValue={defaultValue && defaultValue.uuid} name="service"/>
        <i className="dropdown icon"></i>
        <div className="default text">Select service.</div>
        <div className="menu">
          <div className="item" data-value="">No service</div>
          {services.map( (sv) => (
            <div key={sv.uuid} className="item" data-value={sv.uuid}>
              {sv.name}
              <span style={{float: "right", paddingLeft: 10, fontStyle: "italic", color: "#aaa"}}>
                {Object.keys(sv.config).map((k) => sv.config[k]).join(', ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
})

export default SelectService
