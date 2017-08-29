import React from 'react'
import connect from 'app/containers/connect'
import View from 'app/components/rules_v2/addtemplate'
import Flash from 'app/flash'
import {goto} from 'app/utils/store'
import rpc from 'app/rpc'
import i18n from 'app/utils/i18n'

const Model = connect({
  handlers(props){
    return {
      addTemplate(rule){
        return rpc.call("rules_v2.create", rule).then((uuid) => {
          console.log("Created with UUID %o", uuid)
          Flash.success(i18n("Created rule *{name}*", {name: rule.name}))
          goto(`/project/${rule.project}/rules_v2/`)
        })
      },
      updateTemplate(uuid, rule){
        return rpc.call("rules_v2.update", [uuid, rule]).then(() => {
          Flash.success(i18n("Updated rule *{name}*", {name: rule.name}))
          goto(`/project/${rule.project}/rules_v2/`)
        })
      }

    }
  }
})(View)

export default Model
