import DetailsView from 'app/components/rules/details'
import event from 'app/utils/event'
import { update_trigger_catalog } from 'app/actions/rules'
import { action_catalog } from 'app/actions/action'

var Details = event.subscribe_connect(
  (state) => ({
    triggers: state.rules.trigger_catalog,
    action_catalog: state.action.catalog
  }),
  (dispatch, props) => ({
  }),
  undefined,
  [update_trigger_catalog, action_catalog]
)(DetailsView)

export default Details
