import React from 'react'
import {Panes, MarketplaceSelector} from 'app/components'
import i18n from 'app/utils/i18n'
import Login from './login'

function Marketplace(props){
  const tip = (
    <Login/>
  )
  const work = (
    <div className="ui vertical split area">
      <MarketplaceSelector
        title={i18n("Select a plugin to add")}
        no_items_label={i18n("You already have all the plugins installed. Maybe its time you [develop](https://serverboards.io/developers/) your own one?")}
        afterInstall={props.gotoList}
        />
      <div className="ui divider" style={{marginTop:0}}/>
      <div className="ui padding">
        {i18n("Or add manually from a git repository:")}
        <div className="ui form">
          <div className="field">
            <input id="add_plugin_url" type="text" style={{width: "30em"}} placeholder={i18n("Enter plugin git repository URL")}/>
          </div>
          <div className="field">
            <button className="ui button yellow" onClick={() => props.onInstallPlugin($('#add_plugin_url').val())}>
              {i18n("Install")}
            </button>
          </div>
        </div>
      </div>
      {(props.nextStep || props.prevStep) && (
        <div>
          <div className="ui divider" style={{marginTop:0}}/>
          <div className="ui padding right aligned">
            <div className="ui buttons">
              {props.prevStep && (
                <button className="ui basic button" onClick={props.prevStep}>
                  {props.prev_label || i18n("Back")}
                </button>
              )}
              {props.nextStep && (
                  <button className="ui teal button" onClick={props.nextStep}>
                    {props.next_label || i18n("Continue")}
                  </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="ui vertical split area">
      <Panes
        column1={tip}
        column2={work}
        />
    </div>
  )
}

export default Marketplace
