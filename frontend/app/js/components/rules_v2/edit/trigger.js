import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from 'app/components/selector'
import {match_traits} from 'app/utils'

const BLACKLIST=["cloud","server"]

function maybe_no_service(traits){
  if (!traits || traits.length == 0)
    return ["no-service"]
  return traits
}

function get_triggers(service_id){
  return Promise.all([
    cache.trigger_catalog(),
    cache.service(service_id)
  ]).then( ([tc,s]) =>  {
    let straits = []
    if (s){
      straits = s.traits.filter( t => !BLACKLIST.includes(t) ).concat("service") // remove those on blacklist
    }
    else{
      straits = ["no-service"] // Show only those that require no service selected
    }
    return tc.filter( t => match_traits({has: straits, any: maybe_no_service(t.traits)}) )
  } )
}

function Trigger(props){
  return (
    <Selector
      {...props}
      get_items={() => get_triggers(props.service_id)}
      icon="toggle on"
      title={i18n("Setup the trigger")}
      />
  )
}

export default Trigger
