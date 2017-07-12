import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from './selector'

function Trigger(props){
  return (
    <Selector
      get_items={cache.trigger_catalog}
      icon="toggle on"
      title={i18n("Setup the trigger")}
      />
  )
}

export default Trigger
