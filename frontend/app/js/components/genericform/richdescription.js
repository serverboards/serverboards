import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'
import {render, resolve_form_vars} from './utils'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'

class RichDescription extends React.Component{
  process_description(vars={}){
    return render(this.props.value, vars)
  }
  constructor(props){
    super(props)
    try{
      this.state = {
        content: "",
        extraClass: "",
        loading: true
      }
    }
    catch(e){
      console.error(e)
      this.state = {
        content: "",
        extraClass: "error",
        loading: false
      }
    }
  }
  componentDidMount(){
    resolve_form_vars(this.props.vars, this.props.form_data).then( (vars) => { // Then set it into the state, update content
      this.setState({content: this.process_description(vars), loading: false, extraClass: ""})
    }).catch((e) => {
      console.error(e)
      this.setError(100)
      Flash.error(i18n("Error loading dynamic data. Contact plugin author."),{error: 100})
    })
  }
  setError(code){
    this.setState({content: i18n("Error loading dynamic data. Contact plugin author. [Error #{code}]", {code}), loading: false, extraClass: "error"})
  }
  render(){
    const props=this.props
    const state=this.state
    if (state.loading)
      <div><i className="ui loading notched circle icon"/></div>
    return (
      <div className={`${props.className} ${state.extraClass || ""}`}><MarkdownPreview value={state.content}/></div>
    )
  }
}

export default RichDescription
