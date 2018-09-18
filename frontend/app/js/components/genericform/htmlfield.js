import React from 'react'
import plugin from 'app/utils/plugin'
import i18n from 'app/utils/i18n'
import Flash from 'app/flash'
import {MarkdownPreview} from 'react-marked-markdown'


class HTMLField extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      loading: true,
      html: "",
      id: Math.random().toString(36).substring(7),
    }
  }
  componentDidMount(){
    const plugin_id = this.props.form_data.service.type.split('/')[0]

    let tasks
    if (this.props.js)
      tasks = plugin.load(`${plugin_id}/${this.props.js}`)
    else
      tasks = Promise.resolved("")

    tasks
      .then(() => plugin.load(`${plugin_id}/${this.props.html}`))
      .then(html => html.replace(/{{field_name}}/g, this.state.id))
      .then(html => {
        this.setState({html, loading: false})
        if (this.refs.me)
          this.refs.me.innerHTML = html;
      })
      .catch( e => {
        console.error(e)
        Flash.error(e)
      })
  }
  componentDidUpdate(){
    if (this.refs.me && this.refs.me.innerHTML == "")
      this.refs.me.innerHTML = this.state.html;
  }
  render(){
    const props = this.props
    const state = this.state
    return (
      <div className={`field ${props.className || ""}`}>
        <label>{i18n(props.label)}</label>
        <div>
          <MarkdownPreview className={`ui meta ${props.extraClass}`} value={props.description}/>
          {state.loading ? (
            <div><i className="ui loading notched circle icon"/></div>
          ) : (
            <div ref="me"></div>
          )}
          <input type="text" style={{display: "none"}} name={state.id} id={state.id} onChange={(ev) => {console.log("Change", ev); props.onChange(ev)}}/>
        </div>
      </div>
    )
  }
}

export default HTMLField
