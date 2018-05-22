import React from 'react'
import i18n from 'app/utils/i18n'
import {MarkdownPreview} from 'react-marked-markdown'
import legal from 'app/legal.yaml'
import store from 'app/utils/store'
import {user_settings_set_language} from 'app/actions/auth'

const white_logo=require('../../../imgs/white-horizontal-logo.svg')

class Legal extends React.Component{
  handleLanguageChange(lang){
    store.dispatch( user_settings_set_language(lang) )
  }
  render(){
    const lang = store.getState().auth.lang

    return (
      <div className="ui login serverboards background diagonal">
        <div className="ui form" style={{maxWidth: 720, margin: "auto"}}>
          <div className="ui horizontal split area" style={{paddingTop: "25%"}}>
            <img src={white_logo} className="ui serverboards logo" style={{padding: 0}}/>
            <div className="ui buttons">
              <button className={`ui button ${ lang == "en" ? "teal" : ""}`} onClick={() => this.handleLanguageChange("en")}>
                <i className="ui gb flag"/></button>
              <button className={`ui button ${ lang == "es" ? "teal" : ""}`} onClick={() => this.handleLanguageChange("es")}>
                <i className="ui es flag"/></button>
            </div>
          </div>

          <div className="ui small modal active" id="login" style={{background: "rgba(255,255,255,0.85)"}}>
            <h1 className="ui header centered huge white slim">{i18n("Serverboards terms of use")}</h1>
            <div style={{padding: "0px 50px 20px 50px"}}>
              <div className="ui text with scroll and padding" style={{border: "1px solid #eee", borderRadius: 5, maxHeight: "40vh", overflow: "hidden", background: "white", marginBottom: 20}}>
                <MarkdownPreview value={legal[lang] || legal["en"]}/>
              </div>
              <MarkdownPreview value={i18n("\
By accepting these conditions you acknowledge that you have read and agree the mentioned \
use clasues.\
\n\n\
If you don't accept it is not possible to provide you the service so you will be \
logged out.\
              ")}/>
            </div>
            <div className="ui centered actions">
              <button className="ui basic teal button" onClick={this.props.onLogout}>{i18n("I don't accept")}</button>
              <button className="ui teal button" onClick={this.props.onAcceptLegal}>{i18n("I accept")}</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Legal
