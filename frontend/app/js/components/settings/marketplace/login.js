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
      "account",
      []
    ).then( (userdata) => {
      if (userdata.logged)
        this.setState({step: STEP_LOGGED_IN, userdata})
      else
        this.setState({step: STEP_NOT_LOGGED_IN})
    }).catch( Flash.error )
  }
  handleLogout(){
    plugin.call(
      "serverboards.optional.update/marketplace",
      "logout",
      []
    ).then( () => this.setState({step: STEP_NOT_LOGGED_IN}))
  }
  handleLogin(){
    const email = this.refs.email.value
    const password = this.refs.password.value
    console.log("Try log in Marketplace with", email)
    plugin.call(
      "serverboards.optional.update/marketplace",
      "login",
      [email, password]
    ).then( (res) => {
      if (res.status == "error")
        Flash.error(res.message)
      else
        this.componentDidMount()
    })
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
with a simple click.

---

**You are logged in**

* Username: {name}
* Email: <{email}>

---

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
    if (step == STEP_LOGIN){
      return (
        <div className="ui centered fill area padding with scroll">
          <h1 className="ui slim teal text header">{i18n("Log in into the marketplace.")}</h1>
          <div className="ui form card with padding">
            <div className="ui content left text">
              <div className="ui field">
                <label>{i18n("Email")}</label>
                <input ref="email" type="email" name="email"/>
              </div>
              <div className="ui field">
                <label>{i18n("Password")}</label>
                <input ref="password" type="password" name="password"/>
              </div>

              <div className="ui split horizontal area">
                <a href="https://serverboards.app/register"
                   target="_blank" className="expand  padding"
                   >
                  {i18n("Click here to register")}
                </a>
                <div className="ui expand right text padding">
                  <button
                      className="ui button teal"
                      onClick={this.handleLogin.bind(this)}
                      >
                    {i18n("Log in")}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
          </div>
        </div>
      )
    }

    return null
  }
}

export default MarketplaceLogin
