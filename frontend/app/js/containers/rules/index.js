import RulesView from 'app/components/rules'
import connect from 'app/containers/connect'
import { push } from 'react-router-redux'
import { rules_list, rules_list_clean, update_trigger_catalog } from 'app/actions/rules'
import { action_catalog } from 'app/actions/action'

var Rules = connect({
  state: (state) => ({
    rules: state.rules.rules,
    action_catalog: state.action.catalog,
    service_catalog: state.project.project.services || [],
    trigger_catalog: state.rules.trigger_catalog,
  }),
  handlers: (dispatch, props) => ({
    onOpenEdit: (r) => dispatch( push(`/project/${props.project.shortname}/rules/${r.uuid}`)),
    cleanRules: () => dispatch( rules_list_clean() )
  }),
  subscriptions: (state, props) => [
    `rules.update[${props.project.shortname}]`
  ],
  store_enter: (state, props) => [
    update_trigger_catalog, action_catalog, () => rules_list(props.project.shortname)
  ],
  store_exit: () => [
    rules_list_clean
  ]
})(RulesView)

export default Rules
