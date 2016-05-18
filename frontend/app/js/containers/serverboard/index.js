import ServerboardView from '../../components/serverboard'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

var Serverboard=connect(
  (state) => {
    let serverboard
    if (state.serverboard.current)
      serverboard = state.serverboard.serverboards.find( (el) => el.shortname == state.serverboard.current )
    return {
      serverboard: serverboard,
      serverboards: state.serverboard.serverboards
    }
  },
  (dispatch, props) => ({
    handleSectionChange : function(section){
      let serverboard=props.params.serverboard
      dispatch(push(`/serverboard/${serverboard}/${section}`))
    },
    onAdd : () => dispatch( push("/serverboard/add") )
  })
)(ServerboardView)

export default Serverboard
