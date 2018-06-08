import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'
import {render, resolve_form_vars, data_from_form_data} from './utils'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'
import {map_get, object_is_equal} from 'app/utils'
import _ from 'lodash'

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

    this.reloadData = _.debounce(this.reloadData, 400)
  }
  componentDidMount(){
    this.reloadData(this.props)
    this.reloadData.flush()
  }
  reloadData(props){
    if (!props)
      props = this.props
    resolve_form_vars(props.vars, props.form_data).then( (vars) => { // Then set it into the state, update content
      this.setState({content: this.process_description(vars), loading: false, extraClass: ""})
    }).catch((e) => {
      console.error(e)
      this.setError(100)
      Flash.error(i18n("Error loading dynamic data. Contact plugin author."),{error: 100})
    })
  }
  componentWillReceiveProps(newprops){
    // console.log(this.props, newprops)
    const params = map_get(this.props, ["vars", "params"])
    const data = data_from_form_data( params, this.props.form_data )
    const newdata = data_from_form_data( params, newprops.form_data )

    // console.log("check data change", data, newdata, !object_is_equal(data, newdata))
    if (newprops.dynamic && !object_is_equal(data, newdata) ){
      this.reloadData(newprops)
    }
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
