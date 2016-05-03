import ServiceView from '../components/service'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

var Service=connect(
  (state) => {
    let service
    if (state.service.current)
      service = state.service.services.find( (el) => el.shortname == state.service.current )
    return {
      service: service,
      services: state.service.services
    }
  },
  (dispatch, props) => ({
    handleSectionChange : function(section){
      let service=props.params.service
      dispatch(push(`/service/${service}/${section}`))
    }
  })
)(ServiceView)

export default Service
