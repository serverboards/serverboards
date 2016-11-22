import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'
import {render, resolve_form_vars} from './utils'
import Flash from 'app/flash'

const RichDescription=React.createClass({
  process_description(vars={}){
    return render(this.props.value, vars)
  },
  getInitialState(){
    try{
      return {
        content: "",
        extraClass: "",
        loading: true
      }
    }
    catch(e){
      console.error(e)
      return {
        content: "",
        extraClass: "error",
        loading: false
      }
    }
  },
  componentDidMount(){
    resolve_form_vars(this.props.vars).then( (vars) => { // Then set it into the state, update content
      this.setState({content: this.process_description(vars), loading: false, extraClass: ""})
    }).catch((e) => {
      console.error(e)
      this.setError(100)
      Flash.error("Error loading dynamic data. Contact plugin author.",{error: 100})
    })
  },
  setError(code){
    this.setState({content: `Error loading dynamic data. Contact plugin author. [Error #${code}]`, loading: false, extraClass: "error"})
  },
  render(){
    const props=this.props
    const state=this.state
    if (state.loading)
      <div><i className="ui loading notched circle icon"/></div>
    return (
      <div className={`${props.className} ${state.extraClass || ""}`}><MarkdownPreview value={state.content}/></div>
    )
  }
})

export default RichDescription
