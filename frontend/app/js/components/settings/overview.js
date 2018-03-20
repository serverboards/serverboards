import React from 'react'
import GenericForm from 'app/components/genericform'
import rpc from 'app/rpc'
import {merge, servername} from 'app/utils'
import i18n from 'app/utils/i18n'

class Default extends React.Component{
  constructor(props){
    super(props) 
    this.state = {
      pre: [],
      post: [],
      buttons: []
    }
  }
  componentDidMount(){
    console.log("Get components.")
    rpc.call("plugin.component.catalog", {type:"settings overview"}).then( (l) => {
      console.log("Get components. %o", l)
      // Get only the fields, with the order
      let fields = l.map(
        (o) => (o.extra.fields || []).map(
          (f) => merge(f, {order:o.extra.order})
        )
      ) // get only fields, with the order
      // do flatmap
      fields = [].concat.apply([], fields )
      fields = fields.sort((a,b) => a.order - b.order )

      const desc = fields.filter( (o) => o.type == "description" );
      const buttons = fields.filter( (o) => o.type == "button" )
      const pre = desc.filter( (o) => o.order<=0 )
      const post = desc.filter( (o) => !o.order || o.order>0 )
      this.setState({pre, post, buttons})
    })
  }
  render(){
    const props = this.props
    const state = this.state
    return (
      <div>
        <div className="ui top header secondary menu">
          <h3 className="ui header">{i18n("General information")}</h3>
          <div className="right menu">
            <GenericForm fields={state.buttons}/>
          </div>
        </div>
        <div className="ui text container">
          <GenericForm fields={state.pre}/>
          <div className="ui form">
            <div className="field">
              <label>{i18n("Current version:")} </label>
              <div className="ui meta">{SERVERBOARDS_VERSION}</div>
            </div>
            <div className="field">
              <label>{i18n("Connected to server:")} </label>
              <div className="ui meta">{servername()}</div>
            </div>
          </div>
          <GenericForm fields={state.post}/>
        </div>

      </div>
    )
  }
}

export default Default
