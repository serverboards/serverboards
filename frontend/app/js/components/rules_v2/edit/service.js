import React from 'react'
import PropTypes from 'prop-types'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from './selector'
import ServiceSelector from './serviceselector'

class Service extends React.Component{
  constructor(render){
    super(render)
    this.state={
      step: 1,
      type: this.props.type,
      service_id: this.props.service_id
    }
    this.selectType = (t) => {
      this.setState({step: 2, type: t.type})
    }
  }
  render(){
    const props = this.props
    const state = this.state
    if (state.step==1){
      return (
        <Selector
          {...props}
          current={state.type}
          get_items={cache.service_catalog}
          icon="cloud"
          title={i18n("Select a service")}
          description={i18n("Select a service type (1/2)")}
          onSelect={this.selectType}
          />
        )
    }
    else{
      return (
        <ServiceSelector
          type={this.state.type}
          onSelect={this.props.onSelect}
          prevStep={() => this.setState({step: 1})}
        />
      )
    }
  }
}

Service.propTypes={
  onSelect: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  service_id: PropTypes.string.isRequired,

  current: PropTypes.string
}

export default Service
