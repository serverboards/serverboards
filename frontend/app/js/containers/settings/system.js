import SystemView from '../../components/settings/system'
import event from '../../utils/event'
import { settings_all } from '../../actions/settings'

var System = event.subscribe_connect(
  (state) => ({
    settings: state.settings.settings
  }),
  (dispatch) => ({
  }),
  ["settings.updated"],
  [settings_all]
)(SystemView)

export default System
