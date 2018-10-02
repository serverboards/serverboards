import React from 'react'
import {Loading, Tip, MarkdownPreview} from 'app/components'
import i18n from 'app/utils/i18n'
import Flash from 'app/flash'
import plugin from 'app/utils/plugin'

const STEP_LOADING = 0
const STEP_NOT_LOGGED_IN = 1
const STEP_LOGIN = 2
const STEP_LOGGED_IN = 3


class MarketplaceLogin extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      step: STEP_LOADING,
    }
  }
  componentDidMount(){
    plugin.call(
      "serverboards.optional.update/marketplace",
      "userdata",
      []
    ).then( (userdata) => {
      if (userdata.email)
        this.setState({step: STEP_LOGGED_IN, userdata})
      else
        this.setState({step: STEP_NOT_LOGGED_IN})
    }).catch( Flash.error )
  }
  handleLogout(){
    this.setState({step: STEP_NOT_LOGGED_IN})
  }
  handleLogin(){

  }
  render(){
    const step = this.state.step

    if (step == STEP_LOADING){
      return (
        <Loading/>
      )
    }
    if (step == STEP_LOGGED_IN){
      return (
        <Tip
          subtitle={i18n("Install plugins from the Serverboards marketplace")}
          description={i18n(`
Plugins allow you to add new functionalities to your Serverboards installation
with a simple click

Username: **{name} < <{email}> >**.

If you logout all the recurring items will be automatically removed. On next
login they will be automatically installed.
          `, {name: this.state.userdata.name, email: this.state.userdata.email})}
          extra={(
            <div className="ui padding">
              <a className="ui teal button" onClick={this.handleLogout.bind(this)}>{i18n("Logout")}</a>
            </div>
          )}/>
      )
    }
    if (step == STEP_NOT_LOGGED_IN){
      return (
        <Tip
          subtitle={i18n("Install plugins from the Serverboards marketplace")}
          description={i18n(`
Plugins allow you to add new functionalities to your Serverboards installation
with a simple click

This installation is not registered on https://serverboards.app and that's OK.
You can install any of the free plugins.

But if you register you can also install commercial Plugins developed with
specific uses cases in mind. You will support independant developers and allow
them to keep improving the Plugins and Serverboards itself.

So everybody wins.
          `)}
          extra={(
            <div className="ui padding">
              <a className="ui teal button" onClick={() => this.setState({step: STEP_LOGIN})}>
                {i18n("Login into the Marketplace")}
              </a>
            </div>
          )}/>
      )
    }
    return null
  }
}

export default MarketplaceLogin
