import { connect } from 'react-redux'
import View from 'app/components/service'

var Container = connect(
  (state) => {
    return {
      location: state.router.location.pathname
    }
  },
  (dispatch) => ({
  })
)(View)

export default Container
