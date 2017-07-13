import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'

class When extends React.Component{
  constructor(props){
    super(props)
    this.state={
      service_name: undefined,
      trigger_name: undefined,
      params_resume: undefined
    }
  }
  componentDidMount(){
    const {when} = this.props
    cache
      .service(when.params.service_id)
      .then( s => this.setState({service_name: s.name}) )
    cache
      .trigger(when.trigger)
      .then( t => {
        let params = []
        const data = when.params
        for (let p of t.start.params){
          if (p.card){
            params.push(`${p.label}: ${data[p.name] || p.default}`)
          }
        }
        let params_resume=params.join('; ')

        this.setState({trigger_name: t.name, params_resume})
      })
  }
  render(){
    const {onChangeSection, when, section} = this.props
    const {service_name, trigger_name, params_resume} = this.state
    return (
      <div className="">
        <div className="legend">
          <i className="ui big icon power circle"/>
          {i18n("WHEN")}
        </div>
        <div className="ui card">
          <div className={`${section.section=="when:service" ? "active" : ""}`}>
            <a onClick={() => onChangeSection("when:service", null, {service_id: when.params.service_id})}>
              <i className="ui cloud icon"/>
              {service_name || i18n("Select related service")}
            </a>
          </div>
          <div className={`${section.section=="when:trigger" ? "active" : ""}`}>
            <a onClick={() => onChangeSection("when:trigger", null, {trigger: when.trigger})}>
              <i className="ui toggle on icon"/> {trigger_name || i18n("Select a trigger")}
            </a>
          </div>
          <div className={`${section.section=="params" ? "active" : ""}`}>
            <a onClick={() => onChangeSection("params", ["when", "params"], {data: when.params, trigger: when.trigger } ) }>
              <i className="ui wrench icon"/> {params_resume || i18n("Setup trigger")}
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default When
