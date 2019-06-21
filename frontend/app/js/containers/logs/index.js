import LogsView from 'app/components/logs'
import { connect } from 'react-redux'

var Logs = connect(
  (state) => ({
    location: state.router.location.pathname
  }),
  (dispatch) => ({
  })
)(LogsView)

export default Logs
