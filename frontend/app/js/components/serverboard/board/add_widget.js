import React from 'react'
import Loading from 'app/components/loading'
import GenericForm from 'app/components/genericform'
import rpc from 'app/rpc'
import Modal from 'app/components/modal'
import {set_modal} from 'app/utils/store'

const AddWidget = React.createClass({
  getInitialState(){
    return {
      catalog: this.props.widget_catalog,
      widget: undefined,
      config: {}
    }
  },
  componentDidMount(){
    let $select = $(this.refs.form).find('select')
    $select.dropdown({
      action: 'activate',
      onChange: (value) => {
        this.setWidget(value)
      }
    })
  },
  setWidget(id){
    const widget=this.state.catalog.find( (el) => el.id == id )
    this.setState({widget})
  },
  addWidget(){
    const state=this.state
    const data={
      widget: state.widget.id,
      serverboard: this.props.serverboard,
      config: state.config
    }
    console.log(data, this)
    rpc.call("serverboard.widget.add", data).then( () => {
      set_modal(null)
    })
  },
  setFormData(config){
    this.setState({config})
  },
  render(){
    let catalog=this.state.catalog
    if (!catalog){
      return (
        <Modal>
          <Loading>Widget catalog</Loading>
        </Modal>
      )
    }
    catalog = catalog.sort( function(a,b){ return a.name.localeCompare(b.name) } )
    const widget=this.state.widget

    return (
      <Modal className="wide">
        <div className="ui top secondary header menu">
          <h3 className="ui header">Add widget</h3>
        </div>
        <div className="ui form text container" ref="form">
          <div className="ui field">
            <label>Widget type</label>
            <select name="widget">
              <option value="">Select a widget</option>
              {catalog.map( (w) => (
                <option value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          {widget ? (
            <div>
              <div className="ui meta" style={{marginBottom:30}}>{widget.description}</div>
              <GenericForm fields={widget.params} updateForm={this.setFormData}/>
              <button className="ui button yellow" style={{marginTop:20}} onClick={this.addWidget}>
                Add widget
              </button>
            </div>
          ) : []}
        </div>
      </Modal>
    )
  }
})

export default AddWidget
