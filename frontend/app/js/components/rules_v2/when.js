import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import {object_is_equal} from 'app/utils'

class When extends React.Component{
  constructor(props){
    super(props)
    this.state={
      service_name: undefined,
      service_type: undefined,
      trigger_name: undefined,
      params_resume: undefined
    }

    this.handleGotoParams = () => {
      const {when} = this.props
      this.props.onChangeSection("params", ["when", "params"], {data: when.params, trigger: when.trigger } )
    }

    this.handleTriggerChange = (t) => {
      props.onUpdate(["when","trigger"], t.id)
      this.handleGotoParams()
    }
  }
  componentDidMount(){
    this.updateServiceName()
    this.updateTrigger()
  }
  updateServiceName(){
    const {when} = this.props
    cache
      .service(when.params.service_id)
      .then( s =>{
        console.log(s)
        this.setState({
          service_name: s.name,
          service_type: s.type,
        })
      })
  }
  updateTrigger(next){
    const {when} = (next || this.props)
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
  componentWillReceiveProps(next){
    console.log(this.props, next)
    if (next.when.trigger!=this.props.when.trigger)
      this.updateTrigger(next)
    if (next.when.params.service_id!=this.props.when.params.service_id)
      this.updateServiceName(next)
    if (next.section.section=='params'){
      if (!object_is_equal(next.when, this.props.when))
        this.props.onChangeSection(
          "params",
          ["when", "params"],
          {data: next.when.params, trigger: next.when.trigger }
        )
    }
  }
  render(){
    const {onChangeSection, when, section} = this.props
    const {service_name, service_type, trigger_name, params_resume} = this.state
    return (
      <div className="">
        <div className="legend">
          <i className="ui big icon power circle"/>
          {i18n("WHEN")}
        </div>
        <div className="ui card">
          <div className={`${section.section=="when:service" ? "active" : ""}`}>
            <a onClick={() => onChangeSection("when:service", null, {service_id: when.params.service_id, type: service_type})}>
              <i className="ui cloud icon"/>
              {service_name || i18n("Select related service")}
            </a>
          </div>
          <div className={`${section.section=="when:trigger" ? "active" : ""}`}>
            <a onClick={() => onChangeSection("when:trigger", null, {current: when.trigger, onSelect: this.handleTriggerChange})}>
              <i className="ui toggle on icon"/> {trigger_name || i18n("Select a trigger")}
            </a>
          </div>
          <div className={`${section.section=="params" ? "active" : ""}`}>
            <a onClick={() => this.handleGotoParams() }>
              <i className="ui wrench icon"/> {params_resume || i18n("Setup trigger")}
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default When
