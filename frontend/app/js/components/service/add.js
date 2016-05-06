import React from 'react'
import LogoIcon from '../logoicon'
import AddComponentModal from './addcomponent'
import SetupComponentModal from './setupcomponent'

function Component(props){
  let name = props.fields[0].value
  return (
    <div>
      <LogoIcon name={name}/>
      {name}
    </div>
  )
}

function default_component_fields(name){
  return [
    { label: 'Name', name: 'name', type: 'text', description: 'Component name as shown in UI', value: name},
    { label: 'Description', name: 'description', type: 'textarea', description: 'Comments about this component'},
  ]
}

var Add=React.createClass({
  getInitialState : function(){
    return {
      name: "",
      shortname: "",
      tags: "",
      description:"",
      show_dialog: false,
      components: [],
      maxid: 1
    }
  },
  componentWillMount : function(){
    let props=this.props
    if (props.components.length == 0){
      props.updateComponentCatalog()
    }
  },
  change : function(what, ev){
    this.setState({ [what]: ev.target.value })
  },
  handleSubmit : function(){
    state=this.state
    this.props.onSubmit( {
      name: state.name,
      shortname: state.shortname,
      tags: state.tags,
      description: state.description
    } )
  },
  openAddComponentModal : function(ev){
    ev.preventDefault()
    this.setModal('add_component')
  },
  setModal: function(modal){
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: {modal }
    } )
  },
  handleAddComponent : function(component_id){
    let current_component=Object.assign({}, this.props.components.find((c) => c.id == component_id))
    current_component.fields=$.extend(true, [], default_component_fields(current_component.name).concat( current_component.extra.fields ) )
    current_component.type=current_component.id
    current_component.id=this.state.maxid+1
    delete current_component.extra
    this.setState({
      components: this.state.components.concat(current_component),
      maxid: current_component.id
    })

    this.setModal('setup_component')
    this.setState({ current_component })
  },
  closeModal : function(component_id){
    this.setModal(false)
  },
  handleUpdateComponent : function(component){
    this.setState({
      components: this.state.components.map(
        (c) => c.id == component.id ? component : c)
    })
    this.setModal(false)
  },
  handleOpenUpdateComponent : function(current_component, ev){
    ev && ev.preventDefault()

    this.setModal('setup_component')
    this.setState({ current_component })
  },
  handleDeleteComponent : function(ev){
    ev && ev.preventDefault()
    let component=this.state.current_component
    if (component)
      this.setState({
        components: this.state.components.filter(
          (c) => c.id != component.id
        )
      })
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  render : function(){
    let props=this.props
    let self=this

    function WrappedComponent(c){
      return (
        <div key={c.id} className="column center aligned">
          <a href="#" onClick={(ev) => self.handleOpenUpdateComponent(c, ev)}>
            {Component(c)}
          </a>
        </div>
      )
    }
    let popup=[]
    switch(this.props.location.state && this.props.location.state.modal){
      case 'add_component':
        popup=(
          <AddComponentModal
            onAdd={this.handleAddComponent}
            onClose={this.closeModal}
            components={props.components}/>
        )
        break;
      case 'setup_component':
        if (this.state.current_component)
          popup=(
            <SetupComponentModal
              onUpdate={this.handleUpdateComponent}
              onClose={this.closeModal}
              onDelete={this.handleDeleteComponent}
              component={this.state.current_component}/>
          )
        break;
    }


    return (
      <div className="ui background white central">
        <div className="ui text container">
          <form className="ui form" ref="form">
            <h1 className="ui header">Add a new service</h1>
            <div className="field">
              <label>Shortname</label>
              <input type="text" value={this.shortname} onChange={(ev) => this.change("shortname", ev)}
                placeholder="Ex. CMPNY"/>
            </div>
            <div className="field">
              <label>Service Name</label>
              <input type="text" value={this.name} onChange={(ev) => this.change("name", ev)}
                placeholder="Ex. My company name, web services, external services..."/>
            </div>
            <div className="field">
              <label>Tags</label>
              <input type="text" value={this.tags} onChange={(ev) => this.change("tags", ev)}
                placeholder="Ex. web, mail, external..."/>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={this.description} onChange={(ev) => this.change("description", ev)} placeholder="Long description"/>
            </div>

            <div className="field">
              <label>Components</label>
              <div className="ui stackable grid" style={{ marginTop: 10 }}>
                <div className="fourteen wide column">
                  <div className="ui five column grid">
                    {this.state.components.map((c) => WrappedComponent(c) )}
                  </div>
                </div>
                <div className="one wide column">
                  <a href="#" onClick={this.openAddComponentModal}>
                    <LogoIcon name="+" color="grey"/>
                  </a>
                </div>
              </div>
            </div>

            <div className="field">
              <button type="button" className="ui button positive" onClick={this.handleSubmit}>Create service</button>
            </div>
          </form>
        </div>
        {popup}
      </div>
    )
  }
})

export default Add
