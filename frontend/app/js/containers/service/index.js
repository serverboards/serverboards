import { connect } from 'react-redux'
import View from 'app/components/service'

var Container = connect(
  (state) => {
    return {
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
  })
)(View)

export default Container
