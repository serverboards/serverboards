import GroupsView from '../../components/settings/groups'
import { connect } from 'react-redux'
import { group_list } from '../../actions/auth'

var Groups = connect(
  (state) => ({
    groups : state.auth.groups,
  }),
  (dispatch) => ({
    loadGroups: () => dispatch( group_list() )
  })
)(GroupsView)

export default Groups
