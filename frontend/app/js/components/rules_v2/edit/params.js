import React from 'react'
import i18n from 'app/utils/i18n'
import GenericForm from 'app/components/genericform'
import cache from 'app/utils/cache'

class Params extends React.Component{
  constructor(props){
    super(props)
    this.state={
      data: props.data,
      fields: [],
      description: null
    }

    this.updateForm = (data) => this.setState({data})
  }
  componentDidMount(){
    cache.trigger_catalog().then( catalog => {
      console.log("Got catalog %o", catalog)
      const trigger = catalog.find( t => t.id == this.props.trigger )
      console.log("Trigger is %o", trigger)
      if (trigger){
        this.setState({
          fields: trigger.start.params || [],
          description: trigger.description,
        })
      }
    })
  }
  render(){
    return (
      <div className="ui extend with padding">
        <h2 className="ui centered header">
          <i className="ui wrench icon"/>
          Setup Options
        </h2>
        <div className="description">{this.state.description}</div>
        <div className="separator" style={{height: 40}}/>
        <GenericForm fields={this.state.fields} data={this.state.data} updateForm={this.updateForm}/>
        <div className="separator" style={{height: 40}}/>
        <button className="ui teal button">{i18n("Save and Continue")}</button>
      </div>
    )
  }
}

export default Params
