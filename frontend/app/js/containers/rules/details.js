import DetailsView from 'app/components/rules/details'
import event from 'app/utils/event'
import { update_trigger_catalog, rules_save } from 'app/actions/rules'
import { action_catalog } from 'app/actions/action'
import { serverboard_reload_services } from 'app/actions/serverboard'

var Details = event.subscribe_connect(
  (state) => ({
    triggers: state.rules.trigger_catalog,
    services: state.serverboard.current_services || [],
    action_catalog: state.action.catalog
  }),
  (dispatch, props) => ({
    onSave: (rule) => dispatch( rules_save(rule) )
  }),
  undefined,
  (props) => [
    () => (serverboard_reload_services(props.serverboard)),
    update_trigger_catalog, action_catalog
  ]

)(DetailsView)

export default Details
