import EditView from 'app/components/rules/edit'
import connect from 'app/containers/connect'
import { update_trigger_catalog, rules_save } from 'app/actions/rules'
import { action_catalog } from 'app/actions/action'
import { push } from 'react-router-redux'

var Edit = connect({
  state: (state) => ({
    triggers: state.rules.trigger_catalog,
    services: state.project.project.services || [],
    action_catalog: state.action.catalog,
    location: state.routing.locationBeforeTransitions
  }),
  handlers: (dispatch, props) => ({
    onSave: (rule) => { dispatch( rules_save(rule) ); dispatch( push(`/project/${props.project}/rules`) ) }
  }),
  store_enter: [
    update_trigger_catalog, action_catalog
  ]
})(EditView)

export default Edit
