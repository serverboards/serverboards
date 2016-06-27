import RulesView from 'app/components/rules'
import event from 'app/utils/event'
import { push } from 'react-router-redux'
import { update_trigger_catalog, rules_list, rules_list_clean } from 'app/actions/rules'

var Rules = event.subscribe_connect(
  (state) => ({
    rules: state.rules.rules,
    trigger_catalog: state.rules.trigger_catalog,
  }),
  (dispatch, props) => ({
    onOpenDetails: (r) => dispatch( push(`/serverboard/${props.serverboard.shortname}/rules/${r.id}`)),
    onUpdateRules: () => dispatch( rules_list(props.serverboard.shortname) ),
    cleanRules: () => dispatch( rules_list_clean() )
  }),
  undefined,
  [update_trigger_catalog]
)(RulesView)

export default Rules
