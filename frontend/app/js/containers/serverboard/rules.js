import RulesView from 'app/components/rules'
import event from 'app/utils/event'
import { push } from 'react-router-redux'
import { rules_list, rules_list_clean, update_trigger_catalog } from 'app/actions/rules'
import { serverboard_reload_services } from 'app/actions/serverboard'
import { action_catalog } from 'app/actions/action'

var Rules = event.subscribe_connect(
  (state) => ({
    rules: state.rules.rules,
    action_catalog: state.action.catalog,
    service_catalog: state.serverboard.current_services || [],
    trigger_catalog: state.rules.trigger_catalog,
  }),
  (dispatch, props) => ({
    onOpenDetails: (r) => dispatch( push(`/serverboard/${props.serverboard.shortname}/rules/${r.uuid}`)),
    onUpdateRules: () => dispatch( rules_list(props.serverboard.shortname) ),
    cleanRules: () => dispatch( rules_list_clean() )
  }),
  (props) => [
    `rules.update[${props.serverboard.shortname}]`
  ],
  (props) => [
    () => (serverboard_reload_services(props.serverboard.shortname)),
    update_trigger_catalog, action_catalog
  ]
)(RulesView)

export default Rules
