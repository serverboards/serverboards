import React from 'react'
import connect from '../connect'
import View from 'app/components/rules_v2'
import i18n from 'app/utils/i18n'
import { rules_v2_list, rules_v2_list_clear } from 'app/actions/rules_v2'
import rpc from 'app/rpc'
import Flash from 'app/flash'

export default connect({
  state(state, props){
    return {
      rules: state.rules_v2.rules,
      updateActive: (uuid, is_active) => {
        // console.log("Update active?", uuid, is_active)
        rpc.call("rules_v2.update", [uuid, {is_active}])
          .then( () => Flash.success(
            is_active ?
              i18n("Rule activated succesfully.") :
              i18n("Rule deactivated successfully"))
          )
          .catch( () => Flash.error(i18n("Error activating rule")) )
      },
      onRemoveRule(uuid){
        rpc.call("rules_v2.delete", [uuid])
          .then(() => Flash.success(i18n("Rule removed")))
          .catch(Flash.error)
      }
    }
  },
  store_enter(state, props){
    return [
      () => rules_v2_list(state.project.current)
    ]
  },
  store_exit(){
    return [
      rules_v2_list_clear
    ]
  },
  subscriptions(state, props){
    let subs = []
    if (props.project){
      subs.push(`rules_v2.updated[${props.project.shortname}]`)
      subs.push(`rules_v2.created[${props.project.shortname}]`)
    }
    return subs
  },
  loading(state){
    if (!state.rules_v2.rules)
      return i18n("Rules")
  }
})(View)
