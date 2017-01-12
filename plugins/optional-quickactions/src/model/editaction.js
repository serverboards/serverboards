const {React, cache} = Serverboards
import View from '../views/editaction'
const {Loading} = Serverboards.Components
const merge = Serverboards.utils.merge

const EditActionModel = React.createClass({
  getInitialState(){
    return {
      actions: undefined,
      services: undefined,
      action: merge(this.props.action, {}),
      action_template: undefined,
      service: undefined,
      form_fields: [],
    }
  },
  componentDidMount(){
    const self = this
    Promise.all([
      cache.action_catalog().then( actions => {
        const action_id = self.props.action.action
        const action_template=actions.find( ac => ac.id == action_id )
        self.setState({ actions, action_template })
        return action_template
      }),
      cache.services().then( services => {
        const service_id = self.props.action.service
        const service = services.find( (s) => s.uuid == service_id )
        self.setState({ services, service })
        return service
      })
    ]).then( ([action_template, service]) => {
      self.updateFormFields(action_template, service)
    })
  },
  handleActionChange(action_id){
    const action_template = this.findActionTemplate(action_id)
    this.setState({action_template, action: merge(this.state.action, {action: action_id})})
    this.updateFormFields(action_template, this.state.service)
  },
  updateFormFields(action_template, service){
    if (!action_template)
      this.setState({form_fields: []})
    else{
      let form_fields = action_template.extra.call.params

      if (service != undefined){
        const service_params = service.fields.map( (f) => f.name )
        form_fields = form_fields.filter( (p) => service_params.indexOf(p.name)<0 )
      }
      this.setState({form_fields})
    }
  },
  handleUpdateActionParams(params){
    this.setState({action: merge(this.state.action, {params})})
  },
  handleServiceChange(service_id){
    const service = this.findService(service_id)
    this.setState({service, action: merge(this.state.action, {service: service_id})})
    this.updateFormFields(this.state.action_template, service)
  },
  findActionTemplate(action_id){
    return this.state.actions.find( ac => ac.id == action_id )
  },
  findService(service_id){
    return this.state.services.find( (s) => s.uuid == service_id )
  },
  handleAcceptChanges(){
    console.log(this.state.action)
    //props.onAccept(this.state.action)
  },
  render(){
    if (!this.state.actions || !this.state.services)
      return (
        <Loading>Actions and services</Loading>
      )
    return (
      <View {...this.state} {...this.props}
        onActionChange={this.handleActionChange}
        onServiceChange={this.handleServiceChange}
        onUpdateActionParams={this.handleUpdateActionParams}
        onAccept={this.handleAcceptChanges}
        />
    )
  }
})

export default EditActionModel
