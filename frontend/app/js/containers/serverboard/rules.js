import RulesView from 'app/components/rules'
import event from 'app/utils/event'
import { push } from 'react-router-redux'
import { rules_list, rules_list_clean } from 'app/actions/rules'

var Rules = event.subscribe_connect(
  (state) => ({
    rules: state.rules.rules,
  }),
  (dispatch, props) => ({
    onOpenDetails: (r) => dispatch( push(`/serverboard/${props.serverboard.shortname}/rules/${r.id}`)),
    onUpdateRules: () => dispatch( rules_list(props.serverboard.shortname) ),
    cleanRules: () => dispatch( rules_list_clean() )
  }),
  undefined,
  undefined
)(RulesView)

export default Rules
