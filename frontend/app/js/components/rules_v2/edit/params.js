import React from 'react'
import i18n from 'app/utils/i18n'
import GenericForm from 'app/components/genericform'
import cache from 'app/utils/cache'
import PropTypes from 'prop-types'
import {map_get, servername} from 'app/utils'
import templates from 'app/utils/templates'
import {MarkdownPreview} from 'react-marked-markdown';


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
    cache.trigger(this.props.trigger).then( trigger => {
      let fields = map_get(trigger, ["start", "params"], [])
      const toskip = this.props.skip_fields || []
      fields = fields.filter( f => !toskip.includes(f.name) )
      if (trigger){
        this.setState({
          fields,
          description: templates.render(i18n(trigger.description), {
            BASE_URL: servername(),
            rule: this.props.rule
          }),
        })
      }
    })
  }
  componentWillReceiveProps(next){
    if (next.trigger != this.props.trigger)
      this.componentDidMount()
  }
  render(){
    return (
      <div className="ui extend with padding">
        <h2 className="ui centered header">
          <i className="ui wrench icon"/>
          {i18n("Setup Options")}
        </h2>
        <div className="description"><MarkdownPreview value={this.state.description || ""}/></div>
        <div className="separator" style={{height: 40}}/>
        <div className="ui scroll">
          <GenericForm
            fields={this.state.fields}
            data={this.state.data}
            updateForm={this.updateForm}
          />
        </div>
        <div className="separator" style={{height: 40}}/>
        <div className="ui right aligned">
          <div className="ui buttons">
            <button className="ui button basic" onClick={this.props.prevStep}>{i18n("Previous step")}</button>
            <button className="ui teal button" onClick={() => this.props.onUpdate(this.state.data)}>{i18n("Save and Continue")}</button>
          </div>
        </div>
      </div>
    )
  }
}
Params.propTypes={
  onSelect: PropTypes.func.isRequired,
  prevStep: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  skip_fields: PropTypes.array.isRequired,
  trigger: PropTypes.string.isRequired
}

export default Params
