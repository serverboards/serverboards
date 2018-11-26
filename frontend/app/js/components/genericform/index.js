import React from 'react'

import GenericField from './genericfield'
import {object_is_equal, map_drop} from 'app/utils'
import PropTypes from 'prop-types'
import uuid4 from 'uuid/v4'

class GenericForm extends React.Component{
  constructor(props){
    super(props)
    this.state = this.getInitialState(props)
    this.state.form_id = uuid4()

    this.updateForm = _.debounce(this.updateForm, 100)
  }
  getInitialState(props){
    props = props || this.props
    let state={};
    (props.fields || []).map((f) => {
      if (f.name){
        let v = f.value
        if (v == undefined){
          if (f.default == undefined)
            v = ""
          else
            v = f.default
        }
        state[f.name]=v
      } 
    })
    if (props.data){
      Object.keys(props.data).map( (k) => { if (k){ state[k]=props.data[k] }})
    }
    return state
  }
  setValue(k, v){
    let update = {[k]: v }
    this.setState( update )
    let nstate=Object.assign({}, this.state, update ) // looks like react delays state change, I need it now
    //console.log(nstate, this.props)
    this.updateForm()
  }
  componentWillReceiveProps(newprops){
    if (!object_is_equal(newprops.fields, this.props.fields) || !object_is_equal(newprops.data, this.props.data)){
      this.setState( this.getInitialState(newprops) )
    }
  }
  componentDidMount(){
    let fields = {};
    (this.props.fields || []).map((f) => {
      if (f.validation)
        fields[f.name]=f.validation
    })
    $(this.refs.form).form({ on: 'blur', fields }).on('submit', function(ev){
      ev.preventDefault()
    })
    this.updateForm()
  }
  updateForm(){
    if (this.props.updateForm){
      const data = map_drop(this.state, ["form_id"])
      this.props.updateForm(data)
    }
  }
  render(){
    const props=this.props
    return (
      <form
        ref="form"
        className={`ui form ${props.className || ""}`}
        onSubmit={(ev) => { ev.preventDefault(); props.onSubmit && props.onSubmit(ev) }}>
        {(props.fields || []).map((f, i) => (
            <GenericField
              {...f}
              key={f.name || i}
              setValue={(v) => this.setValue(f.name, v)}
              value={this.state[f.name]}
              fields={props.fields}
              form_data={this.state}
              />
        ))}
        {props.children}
      </form>
    )
  }
}

GenericForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      type: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.Boolean]),
      params: PropTypes.string,
    }).isRequired).isRequired,
  data: PropTypes.object,
  updateForm: PropTypes.func.isRequired
}

export default GenericForm
