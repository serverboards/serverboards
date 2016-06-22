import RulesView from 'app/components/rules'
import event from 'app/utils/event'
import { push } from 'react-router-redux'

function fake_rule(id, options={}){
  return Object.assign({
    id,
    is_active: true,
    name: "Check server down",
    description: "Service description",
    trigger: {
      service: "eb4c790b-bb4d-4282-a520-e95f7d0fb0ee",
      trigger: "core.server.down",
      params: {
        grace: 60
      }
    },
    actions: [
      {
        action: "core.notifications/notify",
        state: "down",
        params: {
          message: "Server down"
        }
      },
      {
        action: "core.notifications/notify",
        state: "up",
        params: {
          message: "Server back online"
        }
      }
    ]
  }, options)
}

var Rules = event.subscribe_connect(
  (state) => ({
    rules: [
      fake_rule("1", {is_active: false, name: "Server down"}),
      fake_rule("2", {name: "Every 10s", trigger: { trigger: "periodic"}, actions: [{state: "tick", action: "backup", params: { ssh_access: "[UUID]" } }], is_active: true}),
      fake_rule("3"),
      fake_rule("4"),
      fake_rule("5"),
    ]
  }),
  (dispatch, props) => ({
    onOpenDetails: (r) => dispatch( push(`/serverboard/${props.serverboard.shortname}/rules/${r.id}`))
  })
)(RulesView)

export default Rules
