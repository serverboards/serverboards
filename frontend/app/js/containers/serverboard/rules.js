import RulesView from 'app/components/rules'
import event from 'app/utils/event'
import { push } from 'react-router-redux'

var Rules = event.subscribe_connect(
  (state) => ({
    rules: [
        { id: "1", service: "Web server", name: "Rule test", trigger: "core.server.down", action: { action: "core.notifications/notify", params: { message: "Server down" } } },
        { id: "2", service: "Email", name: "Rule test", trigger: "core.server.down", action: { action: "core.notifications/notify", params: { message: "Server down" } } },
        { id: "3", service: "Mandrill", name: "Rule test", trigger: "core.server.down", action: { action: "core.notifications/notify", params: { message: "Server down" } } },
        { id: "4", service: "Web beta", name: "Rule test", trigger: "core.server.down", action: { action: "core.notifications/notify", params: { message: "Server down" } } },
        { id: "5", service: "Git", name: "Rule test", trigger: "core.server.down", action: { action: "core.notifications/notify", params: { message: "Server down" } } },
        { id: "6", service: "Mega", name: "Rule test", trigger: "core.server.down", action: { action: "core.notifications/notify", params: { message: "Server down" } } },
    ]
  }),
  (dispatch, props) => ({
    onOpenDetails: (r) => dispatch( push(`/serverboard/${props.serverboard.shortname}/rules/${r.id}`))
  })
)(RulesView)

export default Rules

