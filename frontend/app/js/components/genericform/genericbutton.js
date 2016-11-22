import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'
import {render, resolve_form_vars} from './utils'
import {merge} from 'app/utils'
import plugin from 'app/utils/plugin'
import Flash from 'app/flash'

const GenericButton= React.createClass({
  getInitialState(){
    const props=this.props
    return {
      description: props.description,
      value: props.value,
      className: props.className || "",
      extraClass: "",
      vars: {},
      loading: true
    }
  },
  componentDidMount(){
    const props=this.props
    resolve_form_vars(props.vars, props.form_data || {}).then( (vars) => { // Then set it into the state, update content
      this.setState({
        value: render(props.value, vars),
        description: render(props.description, vars),
        className: render(props.className, vars),
        extraClass: "",
        vars: vars,
        loading: false
      })
    }).catch((e) => {
      console.error(e)
      this.setError(100)
      Flash.error("Error loading dynamic data. Contact plugin author.",{error: 100})
    })
  },
  setError(code){
    this.setState({description: `Error loading dynamic data. Contact plugin author. [Error #${code}]`, extraClass: "error"})
  },
  handleClick(ev){
    ev.preventDefault()
    const args = merge(this.props.form_data || {}, this.state.vars)
    console.log(args)
    plugin
      .start_call_stop(this.props.onclick.command, this.props.onclick.call, args)
      .then( (msg) => { console.info(msg); Flash.info(msg) } )
      .catch( (e) => { console.error(e); Flash.error(e) } )
  },
  render(){
    const props = this.props
    const state = this.state
    return (
      <div className="field">
        <label>{props.label}</label>
        {state.loading ? (
          <div><i className="ui loading notched circle icon"/></div>
        ) : (
          <div>
            <MarkdownPreview className={`ui meta ${state.extraClass}`} value={state.description}/>
            <button className={`ui button ${state.className}`} onClick={this.handleClick}>{state.value}</button>
          </div>
        )}
      </div>
    )
  }
})

export default GenericButton
