import React from 'react'
import i18n from 'app/utils/i18n'
import {MarkdownPreview} from 'react-marked-markdown'
import legal from 'app/legal.txt'

const white_logo=require('../../../imgs/white-horizontal-logo.svg')

class Legal extends React.Component{
  render(){
    return (
      <div className="ui login serverboards background diagonal">
        <form ref="el" className="ui form" method="POST">
          <img src={white_logo} className="ui serverboards logo"/>

          <div className="ui small modal active" id="login" style={{background: "rgba(255,255,255,0.85)"}}>
            <div style={{padding: 50}}>
              <div className="ui text with scroll and padding" style={{border: "1px solid #eee", borderRadius: 5, maxHeight: "40vh", overflow: "hidden", background: "white"}}>
                <MarkdownPreview value={legal}/>
              </div>
            </div>
            <div className="ui centered actions">
              <button className="ui basic teal button" onClick={this.props.onLogout}>{i18n("I don't accept")}</button>
              <button className="ui teal button">{i18n("I accept")}</button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default Legal
