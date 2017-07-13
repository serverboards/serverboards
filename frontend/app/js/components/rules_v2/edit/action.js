import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from './selector'

function Action(props){
  return (
    <Selector
      get_items={cache.action_catalog}
      icon="lightning"
      title={i18n("Select an action")}
      description={i18n("Select an action (1/2)")}
      />
  )
}

export default Action
