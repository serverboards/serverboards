import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from './selector'

function Service(props){
  return (
    <Selector
      {...props}
      get_items={cache.service_catalog}
      icon="cloud"
      title={i18n("Select a service")}
      description={i18n("Select a service type (1/2)")}
      />
  )
}

export default Service
