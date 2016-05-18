import SidebarView from '../components/sidebar'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

var Sidebar=connect(
  (state) => {
    //console.log(state)
    return {
      current: state.serverboard.current,
      serverboards: state.serverboard.serverboards
    }
  },
  (dispatch) => ({
    onServiceSelect: (shortname) => dispatch( push( `/serverboard/${shortname}/`) )
  })
)(SidebarView)

export default Sidebar
