import EditView from 'app/components/rules/edit'
import connect from 'app/containers/connect'
import {
  update_trigger_catalog, rules_save, get_rule,
  clean_rule, set_empty_rule
    } from 'app/actions/rules'
import { action_catalog } from 'app/actions/action'
import { push } from 'react-router-redux'
import i18n from 'app/utils/i18n'

var Edit = connect({
  state: (state) => ({
    triggers: state.rules.trigger_catalog,
    services: state.project.project && state.project.project.services || state.services.services || [],
    action_catalog: state.action.catalog,
    location: state.routing.locationBeforeTransitions,
    rule: state.rules.rule,
  }),
  handlers: (dispatch, props) => ({
    onSave: (rule) => {
      dispatch( rules_save(rule) );
      if (props.project){
        dispatch( push(`/project/${props.project}/rules`) )
      }
    }
  }),
  store_enter: (state, props) => [
    update_trigger_catalog, action_catalog, () => {
      const rule_id = (props.rule && props.rule.uuid) || (props.params && props.params.id) || props.id
      if (rule_id)
        return get_rule(rule_id)
      else
        return set_empty_rule()
    }
  ],
  store_exit: () => [
    clean_rule
  ],
  loading(state, props){
    if (!props.rule){
      return i18n("Loading rule.")
    }
  }
})(EditView)

export default Edit
