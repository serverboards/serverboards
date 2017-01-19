import SystemView from 'app/components/settings/system'
import { settings_all } from 'app/actions/settings'
import connect from 'app/containers/connect'

var System = connect({
  state: (state) => ({
    settings: state.settings.settings
  }),
  subscriptions: ["settings.updated"],
  store_enter: [settings_all]
})(SystemView)

export default System
