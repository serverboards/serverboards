import React from 'react'
import LogoIcon from '../logoicon'

function Component(props){
  return (
    <div>
      <LogoIcon name={props.label} color="teal"/>
      {props.label}
    </div>
  )
}

function Add(props){
  let components=[
    {label: "Web Server", description: "Web server management"},
    {label: "Test Web Server"},
    {label: "Next Web Server"},
    {label: "Mail Server", description: "Mail server machine"},
    {label: "Shared Folders"},
    {label: "Physical Machine"},
    {label: "Web Server", description: "Web server management"},
    {label: "Test Web Server"},
    {label: "Next Web Server"},
    {label: "Mail Server", description: "Mail server machine"},
    {label: "Shared Folders"},
    {label: "Physical Machine"},
    {label: "Web Server", description: "Web server management"},
    {label: "Test Web Server"},
    {label: "Next Web Server"},
    {label: "Mail Server", description: "Mail server machine"},
    {label: "Shared Folders"},
    {label: "Physical Machine"},
    {label: "Web Server", description: "Web server management"},
    {label: "Test Web Server"},
    {label: "Next Web Server"},
    {label: "Mail Server", description: "Mail server machine"},
    {label: "Shared Folders"},
    {label: "Physical Machine"},
  ]

  function WrappedComponent(c){
    return (
      <div className="column">
        {Component(c)}
      </div>
    )
  }

  return (
    <div className="ui background white central">
      <div className="ui text container">
        <form className="ui form">
          <h1 className="ui header">Add a new service</h1>
          <div className="field">
            <label>Shortname</label>
            <input type="text" placeholder="Ex. CMPNY"/>
          </div>
          <div className="field">
            <label>Service Name</label>
            <input type="text" placeholder="Ex. My company name, web services, external services..."/>
          </div>
          <div className="field">
            <label>Tags</label>
            <input type="text" placeholder="Ex. web, mail, external..."/>
          </div>

          <div className="field">
            <label>Components</label>
            <div className="ui stackable grid" style={{"margin-top":"10px"}}>
              <div className="fourteen wide column">
                <div className="ui five column grid">
                  {components.map((c) => WrappedComponent(c) )}
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
            <button type="button" className="ui button positive">Create service</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Add
