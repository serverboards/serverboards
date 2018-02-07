import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import { setup_fields, service_definition } from '../service/utils'
import Loading from '../loading'
import rpc from 'app/rpc'
import { merge, to_map, to_list } from 'app/utils'
import {i18n} from 'app/utils/i18n'

class SetupComponent extends React.Component{
  constructor(props){
    super(props)
    let fields=undefined
    if (this.props.service_catalog){
      fields = this.getFields()
    }
    this.state = {fields,
      values:
        Object.assign({name: this.props.service.name}, this.props.service.config),
    }
  }
  handleAccept(ev){
    ev && ev.preventDefault()

    let $form = $(this.refs.form.refs.form)
    if ( $form.form('validate form' ) ){
      //console.log("Ok %o", this.state.values)
      let operations={}
      let values = this.state.values
      this.getFields().map( (f) => {
        let v = values[f.name]
        if (v)
          operations[f.name]=v
      })
      //console.log(operations)
      let name = $(this.refs.content).find("input[name=name]").val()
      let description = $(this.refs.content).find("textarea[name=description]").val()
      console.log(name, description)
      this.props.onUpdate( this.props.service.uuid, {
        name: name,
        description: description,
        config: operations
      } )
      this.props.onClose()
    }
  }
  handleUpdateForm(data){
    this.setState({values:data})
  }
  getFields(){
    if (this.state && this.state.fields)
      return this.state.fields
    return setup_fields(this.props.service, this.props.service_catalog)
  }
  render(){
    let props=this.props
    let state=this.state
    if (!props.service_catalog)
      return (
        <Loading>
        Service catalog
        </Loading>
      )
    let fields = state.fields
    if (!fields)
      fields=this.getFields()
    let servicedef=service_definition(this.props.service.type, this.props.service_catalog)
    return (
      <div className="ui text container" style={{paddingTop: 20}}>
        <div className="content" ref="content">
          <div className="ui form">
            <div className="field">
              <label>{i18n("Name")}</label>
              <input type="text" name="name"
                placeholder={i18n("Service name as shown in UI")}
                defaultValue={props.service.name}/>
            </div>

            <GenericForm
              ref="form"
              fields={fields}
              data={{service: props.service}}
              updateForm={this.handleUpdateForm.bind(this)}
              onSubmit={this.handleAccept.bind(this)}
              />

            <div className="field">
              <label>{i18n("Description")}</label>
              <textarea
                name="description"
                placeholder={i18n("Comments about this service")}
                defaultValue={i18n(props.service.description)}
              />
            </div>
          </div>
        </div>
        <div className="actions" style={{margin: "20px 0 0 0"}}>
          <button
              className="ui ok teal button"
              onClick={this.handleAccept.bind(this)}
              style={{margin: 0}}
            >
            {i18n("Update service settings")}
          </button>
        </div>
        <div className="ui padding"/>
      </div>
    )
  }
}


export default SetupComponent
