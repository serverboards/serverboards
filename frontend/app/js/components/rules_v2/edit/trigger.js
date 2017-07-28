import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Selector from './selector'
import {match_traits} from 'app/utils'

const BLACKLIST=["cloud","server"]

function get_triggers(service_id){
  return Promise.all([
    cache.trigger_catalog(),
    cache.service(service_id)
  ]).then( ([tc,s]) =>  {
    const straits = s.traits.filter( t => !BLACKLIST.includes(t) ) // remove those on blacklist
    console.log(JSON.stringify(tc.map( t => [t.name, t.traits] )), straits)
    return tc.filter( t => match_traits({has: straits, any: t.traits}) )
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
