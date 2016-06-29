import SystemView from 'app/components/settings/system'
import event from 'app/utils/event'
import { settings_all } from 'app/actions/settings'

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
