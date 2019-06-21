import React from 'react'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import { set_modal } from 'app/utils/store'

const img1 = require('app/../imgs/008-Button+.png')
const img2 = require('app/../imgs/009-mid-nocontent-services.png')
const img3 = require('app/../imgs/011-midright-noservices-start.png')
const img4 = require('app/../imgs/008-Button+.png')

function Column({h1, t1, h2, t2, img}){
  return (
    <div className="column">
      <h2 className="ui header">{h1}</h2>
      <h3 className="ui grey header">{h2}</h3>
      <div>
        {t1}
      </div>
      <div style={{textAlign: "center", margin: "2em auto", height: 100}}><img src={img} style={{maxWidth: "100%"}}/></div>
      <h2 className="ui small header">{i18n("TIP")}</h2>
      <div className="ui grey text">
        {t2}
      </div>
    </div>
  )
}

function Empty(props){
  return (
    <div className="ui container centered">
      <h1 className="ui centered grey huge header">{i18n("This is how Serverboards works.")}</h1>
      <div className="ui grid four columns" style={{marginTop: 40}}>

        <Column
          h1={i18n("Start by creating a project")}
          h2={i18n("The always present \"+\"")}
          t1={i18n("At each screen where it is possible to add an element you will see a big yellow round button with a \"+\". Use this button now to create a new project and start using Serverboards.")}
          t2={i18n("With this button you always add something to the current section. For example in the Dashboards you will add Widgets, and in the Service list new Servers or Cloud Apps to your project.")}
          img={img1}
          />

        <Column
          h1={i18n("Add Servers and Cloud Apps")}
          h2={i18n("Setup and use based on clicks")}
          t1={i18n("For each project you can add as man Cloud Apps and services as you need, and all click based using only the UI.")}
          t2={i18n("For each Cloud App and Service you add we will tell you when the subscription expires with enought time. To use this functionallity you need the \"Expirations\" plugin available at the plugin store.")}
          img={img2}
          />

        <Column
          h1={i18n("Install the plugins you need")}
          h2={i18n("12 plugins available and growing")}
          t1={i18n("Plugins are the core of Serverboards. By this plugins you can monitorize activities or create new possibilities of use by creating connections between your Cloud Apps.")}
          t2={i18n("Combine plugins for each project to achieve your specific goals.")}
          img={img3}
          />

          <Column
            h1={i18n("Add widgets to your Dashboards")}
            h2={i18n("One dashboard per project")}
            t1={i18n("Dashboards are the control panel for your projects, the visible side of you Cloud Apps and Servers. Use the \"+\" button in the Dashboard to add the Widgets available from your plugins.")}
            t2={i18n("Widgets at Dashboards are provided by your installed plugins. We recommend crete diferent projects depending on the diferent goals. Create a project to manage servers, other to manage engagement on social networks and so on.")}
            img={img4}
            />

      </div>
    </div>
  )
}

function DefaultView(props){
  return (
    <div className="ui central" style={{width: "100%", height: "calc( 100vh - 45px )"}}>
      <Empty/>
      <Restricted perm="project.create">
        <a onClick={() => set_modal("project.add")} className="ui massive button _add icon floating yellow" id="add_project">
          <i className="add icon"></i>
        </a>
      </Restricted>
    </div>
  )
}

export default DefaultView
