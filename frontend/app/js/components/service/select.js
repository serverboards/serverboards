import React from 'react'

import Card from './card'
import Loading from 'app/components/loading'
import cache from 'app/utils/cache'
import i18n from 'app/utils/i18n'

function ServiceSelect(props){
  let {services} = props
  if (!services){
    return <Loading>Services</Loading>
  }
  const {filter} = props
  if (filter)
    services = services.filter(filter)

  if(services.length==0){
    return <div className="ui meta">{i18n("There are no services of this type")}</div>
  }
  // console.log("selected", props.selected)
  return (
    <div className="ui service cards">
      {services.map( s => (
        <Card
          className={props.selected == s.uuid ? "selected" : ""}
          key={s.uuid}
          service={s}
          onClick={() => props.onSelect(s)}
          bottomElement={props.bottomElement}
          />
      ))}
    </div>
  )
}

export default ServiceSelect
