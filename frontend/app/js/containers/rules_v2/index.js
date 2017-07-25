import React from 'react'
import connect from '../connect'
import View from 'app/components/rules_v2'
import i18n from 'app/utils/i18n'
import { rules_v2_list, rules_v2_list_clear } from 'app/actions/rules_v2'

export default connect({
  state(state, props){
    return {
      rules: state.rules_v2.rules
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
  loading(state){
    if (!state.rules_v2.rules)
      return i18n("Rules")
  }
})(View)
