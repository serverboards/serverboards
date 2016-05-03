import SidebarView from '../components/sidebar'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

var Sidebar=connect(
  (state) => {
    //console.log(state)
    return {
      current: state.service.current,
      services: state.service.services
    }
  },
  (dispatch) => ({
    onServiceSelect: (shortname) => dispatch( push( `/service/${shortname}/`) )
  })
)(SidebarView)

export default Sidebar
