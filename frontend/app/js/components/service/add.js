import React from 'react'
import i18n from 'app/utils/i18n'
import Selector from 'app/components/selector'
import cache from 'app/utils/cache'

require('sass/panes.sass')

function AddService(props){
  return (
    <div className="ui expand two column grid grey background" style={{margin:0}}>
      <div className="ui column">
        <div className="ui round pane white background with padding">
          <img/>
          <h1>{i18n("Add Services to your project.")}</h1>
          <img/>
          <h2>
            {i18n("TIP 7: Add services you are already subscribed to manage, monitor or automate tasks with them.")}
          </h2>
          <div className="ui content">
            Lorem ipsum dolor sit amet, consectetuer adipiscing
            elit. Aenean commodo ligula eget dolor. Aenean massa.
            Cum sociis natoque penatibus et magnis dis parturient
            montes, nascetur ridiculus mus. Donec quam felis,
            ultricies nec, pellentesque eu, pretium quis, sem. Nulla
            consequat massa quis enim.
          </div>
        </div>
      </div>

      <div className="ui column">
        <div className="ui round pane white background">
          <Selector
            icon="cloud"
            title={i18n("Create a new service")}
            description={i18n("Select which service type to create")}
            get_items={cache.service_catalog}

            />
        </div>
      </div>
    </div>
  )
}

export default AddService
