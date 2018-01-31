import React from 'react'
import i18n from 'app/utils/i18n'

const img1 = require('app/../imgs/008-Button+.png')
const img2 = require('app/../imgs/012-mid-nocontent-dashboard.png')
const img3 = require('app/../imgs/013-right-nocontent-dashboard.png')

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
      <h1 className="ui centered grey huge header">{i18n("Start adding Widgets into your project's Dashboard")}</h1>
      <div className="ui grid three columns" style={{marginTop: 40}}>

        <Column
          h1={i18n("Add widgets to this Dashboard")}
          h2={i18n("One dashboard per project")}
          t1={i18n("Dashboards are the control panels for your projects. The visible area for the connections to your Cloud Apps and Servers. Use the + button to add new widgets.")}
          t2={i18n("Widgets in the Dashboards are directly related with the plugins you already installed. We suggest to create new projects depending on the objectives of your project. If you want to manage servers, create a specific project, and do te same to manage the actions related a specific client.")}
          />

        <Column
          h1={i18n("Position where you want")}
          h2={i18n("Freedom of movement")}
          t1={i18n("Widgets can be moved and positioned anywhere you want in the Dashboard. Manage your widgets your way to have always visible your most used widgets.")}
          t2={i18n("Widgets can be positioned with the criteria of graphs on one side, and tools on another, o as you want. You are free to organize your own way. Select the Widget title and keep the mouse pressed to move it, and release it where you want it.")}
          img={img2}
          />

        <Column
          h1={i18n("Change the size")}
          h2={i18n("Contents adapt to the size")}
          t1={i18n("There will be Widgets that will need more space to show all the information, and others that only require a minimal size. No problem you choose the size of each.")}
          t2={i18n("There is a minimal size for all Widgets, and the content always adapts if you cahgne the size. Sometimes if you make a Widget bigger you will see more options and some content that may otherwise be hidden.")}
          img={img3}
          />

      </div>
    </div>
  )
}

export default Empty
