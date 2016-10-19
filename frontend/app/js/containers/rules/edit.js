import EditView from 'app/components/rules/edit'
import event from 'app/utils/event'
import { update_trigger_catalog, rules_save } from 'app/actions/rules'
import { action_catalog } from 'app/actions/action'
import { push } from 'react-router-redux'

var Edit = event.subscribe_connect(
  (state) => ({
    triggers: state.rules.trigger_catalog,
    services: state.serverboard.serverboard.services || [],
    action_catalog: state.action.catalog,
    location: state.routing.locationBeforeTransitions
  }),
  (dispatch, props) => ({
    onSave: (rule) => { dispatch( rules_save(rule) ); dispatch( push(`/serverboard/${props.serverboard}/rules`) ) }
  }),
  undefined,
  (props) => [
    update_trigger_catalog, action_catalog
  ]

)(EditView)

export default Edit
