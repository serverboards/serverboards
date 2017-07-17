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
      service_params: [],
      trigger_name: undefined,
      params_resume: undefined
    }

    this.handleGotoParams = () => {
      const {when} = this.props
    }
    this.handleSelectedService = (s) => {
      console.log("Selected service %o", s)
      this.props.onUpdate(["when", "params", "service_id"], s.uuid )
      this.gotoStep("when:trigger")
    }
    this.handleTriggerChange = (t) => {
      props.onUpdate(["when","trigger"], t.id)
      this.gotoStep("when:params")
    }
    this.gotoStep = (step) => {
      const {onChangeSection, when, section} = this.props
      const {service_type, service_params} = this.state

      switch(step){
        case "when:service":
          onChangeSection("when:service", null, {
              service_id: when.params.service_id,
              onSelect: this.handleSelectedService,
              type: service_type,
              nextStep: () => this.gotoStep("when:trigger")
            })
          break;
        case "when:trigger":
          onChangeSection("when:trigger", null, {
            current: when.trigger,
            onSelect: this.handleTriggerChange,
            prevStep: () => this.gotoStep("when:service"),
            nextStep: () => this.gotoStep("when:params")
          })
          break;
        case "when:params":
          onChangeSection("params", ["when", "params"], {
            data: when.params,
            trigger: when.trigger,
            skip_fields: service_params.concat("service_id"),
            prevStep: () => this.gotoStep("when:trigger")
          } )
          break;
        default:
          console.error("Unknown step %o", step)
      }
    }
  }
  componentDidMount(){
    this.updateServiceName()
    this.updateTrigger()
  }
  updateServiceName(next){
    const {when} = next || this.props
    return cache
      .service(when.params.service_id)
      .then( s =>{
        console.log(s)
        this.setState({
          service_name: s.name,
          service_type: s.type,
          service_params: s.fields.map( s => s.name )
        })
      })
  }
  updateTrigger(next){
    const {when} = (next || this.props)
    return cache
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
    if (next.when.trigger!=this.props.when.trigger)
      this.updateTrigger(next)
    if (next.when.params.service_id!=this.props.when.params.service_id)
      this.updateServiceName(next)
  }
  render(){
    const {section} = this.props
    const {service_name, trigger_name, params_resume} = this.state
    return (
      <div className="">
        <div className="legend">
          <i className="ui big icon power circle"/>
          {i18n("WHEN")}
        </div>
        <div className="ui card">
          <div className={`${section.section=="when:service" ? "active" : ""}`}>
            <a onClick={() => this.gotoStep("when:service")}>
              <i className="ui cloud icon"/>
              {service_name || i18n("Select related service")}
            </a>
          </div>
          <div className={`${section.section=="when:trigger" ? "active" : ""}`}>
            <a onClick={() => this.gotoStep("when:trigger")}>
              <i className="ui toggle on icon"/> {trigger_name || i18n("Select a trigger")}
            </a>
          </div>
          <div className={`${section.section=="params" ? "active" : ""}`}>
            <a onClick={() => this.gotoStep("when:params")}>
              <i className="ui wrench icon"/> {params_resume || i18n("Setup trigger")}
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default When
