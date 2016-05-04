import React from 'react'
import LogoIcon from '../logoicon'

function Component(props){
  return (
    <div>
      <LogoIcon name={props.name} color="teal"/>
      {props.name}
    </div>
  )
}

var Settings=React.createClass({
  getInitialState : function(){
    let service=this.props.service
    return {
      name: service.name,
      shortname: service.shortname,
      tags: [],
      description: service.description
    }
  },
  __componentWillMount : function(){
    let props=this.props
    if ((props.components || []).length == 0){
      props.updateComponents()
    }
  },
  change : function(what, ev){
    this.setState({ [what]: ev.target.value })
  },
  handleSubmit : function(){
    this.props.onSubmit( this.state )
  },
  handleDelete : function(){
    this.props.onDelete( this.props.service.shortname )
  },
  render : function(){
    let props=this.props

    function WrappedComponent(c){
      return (
        <div key={c.id} className="column">
        {Component(c)}
        </div>
      )
    }
    return (
      <div className="ui background white central">
        <div className="ui text container">
          <form className="ui form" ref="form">
            <h1 className="ui header">Update this service settings</h1>
            <div className="field">
              <label>Shortname</label>
              <input type="text" value={this.state.shortname} onChange={(ev) => this.change("shortname", ev)}
                placeholder="Ex. CMPNY"/>
            </div>
            <div className="field">
              <label>Service Name</label>
              <input type="text" value={this.state.name} onChange={(ev) => this.change("name", ev)}
                placeholder="Ex. My company name, web services, external services..."/>
            </div>
            <div className="field">
              <label>Tags</label>
              <input type="text" value={this.state.tags} onChange={(ev) => this.change("tags", ev)}
                placeholder="Ex. web, mail, external..."/>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={this.state.description} onChange={(ev) => this.change("description", ev)} placeholder="Long description"/>
            </div>

            <div className="field">
              <label>Components</label>
              <div className="ui stackable grid" style={{ marginTop: 10 }}>
                <div className="fourteen wide column">
                  <div className="ui five column grid">
                    {(props.components || []).map((c) => WrappedComponent(c) )}
                  </div>
                </div>
                <div className="one wide column">
                  <a onClick={() => true}>
                    <LogoIcon name="+" color="grey"/>
                    Add new
                  </a>
                </div>
              </div>
            </div>

            <div className="two fields">
              <div className="field">
                <button type="button" className="ui button positive" onClick={this.handleSubmit}>Update service</button>
              </div>
              <div className="ui field right aligned">
                <button type="button" className="ui button negative" onClick={this.handleDelete}>Delete service</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }
})

export default Settings
