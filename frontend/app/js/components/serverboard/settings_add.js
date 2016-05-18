import React from 'react'
import LogoIcon from '../logoicon'
import AddComponentModal from '../../containers/serverboard/addservice'
import SetupComponentModal from './setupservice'
import {to_map, map_drop} from '../../utils'
import HoldButton from '../holdbutton'

function Component(props){
  let name = props.fields[0].value || props.name || 'Unknown'
  return (
    <div>
      <LogoIcon name={name}/>
      {name}
    </div>
  )
}

function default_service_fields(name){
  return [
    {
      label: 'Name',
      name: 'name',
      type: 'text',
      description: 'Component name as shown in UI',
      value: name,
      validation: 'empty'
    }, {
      label: 'Description',
      name: 'description',
      type: 'textarea',
      description: 'Comments about this service'
    },
  ]
}

// Two services refer to the same, used for replacing and deleting
function service_same(c1, c2){
  return (
    (c1.id && c1.id == c2.id)
    ||
    (c1.uuid == c2.uuid)
  )
}

var Settings=React.createClass({
  getInitialState : function(){
    let serverboard=this.props.serverboard || {}
    return {
      show_dialog: false,
      services: this.props.initial_services || [],
      maxid: 1,
      current_service: undefined,
    }
  },
  change : function(what, ev){
    this.setState({ [what]: ev.target.value })
  },
  handleSubmit : function(ev){
    ev.preventDefault()

    let $form=$(this.refs.form)

    if ($form.form('validate form')){
      let fields=$form.form('get values')

      let services = this.state.services.map( (c) => {
        let config =  to_map( c.fields.map( (f) => [f.name, f.value] ) )
        return {
          uuid: c.uuid,
          name: config.name, description: config.description,
          tags: config.tags || [], type: c.type,
          config: map_drop(config, ["name", "description", "tags"])
        }
      })

      let serverboard = {
        name: fields.name,
        shortname: fields.shortname,
        tags: fields.tags.split(' '),
        description: fields.description,
        services: services
      }
      this.props.onSubmit( serverboard )
    }
  },
  openAddComponentModal : function(ev){
    ev.preventDefault()
    this.setModal('add_service')
  },
  setModal: function(modal){
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: {modal }
    } )
  },
  handleAddComponent : function(current_service){
    current_service.id=this.state.maxid+1
    this.setState({
      services: this.state.services.concat(current_service),
      maxid: current_service.id
    })

    this.setModal('setup_service')
    this.setState({ current_service })
  },
  handleAttachComponent : function( service ){
    this.setState({
      services: this.state.services.concat(service),
      current_service: undefined
    })

    this.setModal(false)
  },
  closeModal : function(service_id){
    this.setModal(false)
  },
  handleUpdateComponent : function(service){
    let services = this.state.services.map(
      (c) => service_same(c, service) ? service : c
    )
    console.log(this.state.services, services)

    this.setState({ services })
    this.setModal(false)
  },
  handleOpenUpdateComponent : function(current_service, ev){
    ev && ev.preventDefault()

    this.setModal('setup_service')
    this.setState({ current_service })
  },
  handleDeleteComponent : function(ev){
    ev && ev.preventDefault()
    let service=this.state.current_service
    if (service)
      this.setState({
        services: this.state.services.filter(
          (c) => !service_same( c, service )
        )
      })
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  componentDidMount : function(){
    $(this.refs.form).form({
      on: 'blur',
      fields: {
        shortname: 'minLength[4]',
        name: 'minLength[4]'
      }
    }).on('submit', this.handleSubmit)
  },
  render : function(){
    let props=this.props
    let self=this

    function WrappedComponent(c){
      return (
        <div key={c.id || c.uuid} className="column center aligned">
          <a href="#" onClick={(ev) => self.handleOpenUpdateComponent(c, ev)}>
            {Component(c)}
          </a>
        </div>
      )
    }
    let popup=[]
    switch(this.props.location.state && this.props.location.state.modal){
      case 'add_service':
        popup=(
          <AddComponentModal
            onAdd={this.handleAddComponent}
            onAttach={this.handleAttachComponent}
            onClose={this.closeModal}/>
        )
        break;
      case 'setup_service':
        if (this.state.current_service)
          popup=(
            <SetupComponentModal
              onUpdate={this.handleUpdateComponent}
              onClose={this.closeModal}
              onDelete={this.handleDeleteComponent}
              service={this.state.current_service}/>
          )
        break;
    }

    let accept_buttons=[]
    if (!props.edit){
      accept_buttons=(
        <div className="field">
          <button type="submit" className="ui button positive">Create serverboard</button>
        </div>
      )
    }
    else {
      accept_buttons=(
        <div className="two fields">
          <div className="field">
            <button type="submit" className="ui button positive">Update serverboard</button>
          </div>
          <div className="ui field right aligned">
            <HoldButton type="button" className="ui button negative" onClick={props.onDelete}>Delete serverboard</HoldButton>
          </div>
        </div>
      )
    }

    let state=this.state
    let serverboard=this.props.serverboard || { tags: [], name: '', description: ''}

    return (
      <div className="ui background white central">
        <div className="ui text container">
          <form className="ui form" ref="form">
            <h1 className="ui header">{this.props.title}</h1>
            <div className="field">
              <label>Shortname</label>
              <input type="text" name="shortname"
                defaultValue={serverboard.shortname}
                placeholder="Ex. CMPNY"/>
            </div>
            <div className="field">
              <label>Serverboard Name</label>
              <input type="text" name="name"
                defaultValue={serverboard.name}
                placeholder="Ex. My company name, web serverboards, external serverboards..."/>
            </div>
            <div className="field">
              <label>Tags</label>
              <input type="text" name="tags"
                defaultValue={serverboard.tags.join(' ')}
                placeholder="Ex. web, mail, external..."/>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea placeholder="Long description"  name="description"
                defaultValue={serverboard.description}
                />
            </div>

            <div className="field">
              <label>Components</label>
              <div className="ui stackable grid" style={{ marginTop: 10 }}>
                <div className="fourteen wide column">
                  <div className="ui five column grid">
                    {state.services.map((c) => WrappedComponent(c) )}
                  </div>
                </div>
                <div className="one wide column">
                  <a href="#" onClick={this.openAddComponentModal}>
                    <LogoIcon name="+" color="grey"/>
                  </a>
                </div>
              </div>
            </div>

            {accept_buttons}
          </form>
        </div>
        {popup}
      </div>
    )
  }
})

export default Settings
export {default_service_fields}
