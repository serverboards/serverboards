import React from 'react'
import i18n from 'app/utils/i18n'
import {MarkdownPreview} from 'react-marked-markdown'
import store from 'app/utils/store'
import {user_settings_set_language} from 'app/actions/auth'
import {Loading, Error} from 'app/components'
import plugin from 'app/utils/plugin'


const white_logo=require('../../../imgs/white-horizontal-logo.svg')

class Legal extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      license: undefined
    }
  }
  componentDidMount(props){
    props = props || this.props
    const {license, lang} = props
    this.setState({title: license.name})

    plugin
      .load(`${license.plugin}/${license.extra.license[lang || "en"]}`)
      .then( license => this.setState({license}))
      .catch(e => {
        this.setState({error: true})
      })
  }
  componentWillReceiveProps(nextprops){
    if ((nextprops.license.id != this.props.license.id) ||
        (nextprops.lang != this.props.lang)){
      this.componentDidMount(nextprops)
    }
  }
  handleLanguageChange(lang){
    store.dispatch( user_settings_set_language(lang) )
  }
  render(){
    const {license, error, title} = this.state
    const {lang} = this.props

    if (error){
      return (
        <Error>
          {i18n("There was an serious error downloading the license data. Try reloading the page or contact admin.")}
        </Error>
      )
    }

    if (!license){
      return (
        <Loading/>
      )
    }

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
            <h1 className="ui header centered huge white slim">{i18n(title)}</h1>
            <div style={{padding: "0px 50px 20px 50px"}}>
              <div className="ui text with scroll and padding" style={{border: "1px solid #eee", borderRadius: 5, maxHeight: "40vh", overflow: "hidden", background: "white", marginBottom: 20}}>
                <MarkdownPreview value={license}/>
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
