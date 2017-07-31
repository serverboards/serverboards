import React from 'react'
import View from 'app/components/rules_v2/when'
import cache from 'app/utils/cache'
import i18n from 'app/utils/i18n'

class WhenModel extends React.Component{
  constructor(props){
    super(props)
    this.state={
      service_name: undefined,
      service_type: undefined,
      service_params: undefined,
      params_resume: undefined,
      trigger_nane: undefined
    }
  }
  updateWhen(props){
    const when = (props || this.props).when
    if (when.params.service_id){
      cache
        .service(when.params.service_id)
        .then( s =>{
          this.setState({
            service_name: s.name,
            service_type: s.type,
            service_params: s.fields.map( s => s.name )
          })
        })
    }
    else{
      this.setState({
        service_name: i18n("No related service"),
        service_type: undefined,
        service_params: {}
      })
    }
    cache
      .trigger(when.trigger)
      .then( t => {
        if (!t){
          return
        }
        let params = []
        const data = when.params
        for (let p of t.start.params){
          if (p.card){
            params.push(`${p.label}: ${data[p.name] || p.default}`)
          }
        }
        let params_resume=params.join('; ')

        this.setState({
          trigger_name: t.name,
          params_resume})
      })
  }
  componentDidMount(){
    this.updateWhen()
  }
  componentWillReceiveProps(next){
    // FIXME quick reload, not performant. Should check if is required.
    this.updateWhen(next)
  }
  render(){
    return (
      <View {...this.props} {...this.state}/>
    )
  }
}

export default WhenModel
