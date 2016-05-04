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

var Add=React.createClass({
  getInitialStatus : function(){
    return {
      name: "",
      shortname: "",
      tags: "",
    }
  },
  componentWillMount : function(){
    let props=this.props
    if (props.components.length == 0){
      props.updateComponents()
    }
  },
  change : function(what, ev){
    this.setState({ [what]: ev.target.value })
  },
  handleSubmit : function(){
    this.props.onSubmit( this.state )
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
              <label>Components</label>
              <div className="ui stackable grid" style={{ marginTop: 10 }}>
                <div className="fourteen wide column">
                  <div className="ui five column grid">
                    {props.components.map((c) => WrappedComponent(c) )}
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

            <div className="field">
              <button type="button" className="ui button positive" onClick={this.handleSubmit}>Create service</button>
            </div>
          </form>
        </div>
      </div>
    )
  }
})

export default Add
