import React from 'react'
import i18n from 'app/utils/i18n'

const img1 = require('app/../imgs/008-Button+.png')
const img2 = require('app/../imgs/009-mid-nocontent-services.png')
const img3 = require('app/../imgs/010-right-nocontent-services.png')

function Column({h1, t1, h2, t2, img}){
  return (
    <div className="column">
      <h2 className="ui header">{h1}</h2>
      <h3 className="ui grey header">{h2}</h3>
      <div>
        {t1}
      </div>
      { img && (
        <div style={{textAlign: "center", margin: "2em auto", height: 100}}><img src={img}/></div>
      )}
      <h2 className="ui small header">{i18n("TIP")}</h2>
      <div className="ui grey text">
        {t2}
      </div>
    </div>

  )
}

function Empty(props){
  return (
    <div className="ui nocontent container centered">
      <h1 className="ui centered grey huge header">{i18n("Servers and Cloud Apps is Serverboards Secret Sauce")}</h1>
      <div className="ui grid three columns" style={{marginTop: 40}}>

        <Column
          h1={i18n("Add your Servers and Cloud Apps")}
          h2={i18n("Third party integrations, no limits")}
          t1={i18n("Add as many servers and cloud apps as you need to each of your projects. Manage, monitorize and even interconnect them by creating rules. To add do it clicking on the + button on the bottom corner of this screen.")}
          t2={i18n("For each project you can add new Servers and Cloud Apps, that will be only present on this project, or select one of the already existing services to access to it from diferent projects.")}
          />

        <Column
          h1={i18n("Access management tools")}
          h2={i18n("Not only monitoring, also management")}
          t1={i18n("When adding services (Servers and Cloud Apps) to your projects, you can not only monitorize them, but also manage. At each service you can also execute quick actions, as running remote commands.")}
          t2={i18n("At the service details you can also access to specific tools for each service, where you can fine grain manage and access your services.")}
          img={img2}
          />

        <Column
          h1={i18n("We tell when they expire")}
          h2={i18n("Never forget important dates")}
          t1={i18n("To ease service renovation, even if they are Domain Names or SSL certificates, each service can be monitored for expirations.")}
          t2={i18n("To have all services expiration monitored, you need to install the free \"Expirations\" plugin.")}
          img={img3}
          />

      </div>
    </div>
  )
}

export default Empty
