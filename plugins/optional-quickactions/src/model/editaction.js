const {React, cache} = Serverboards
import View from '../views/editaction'
const {Loading} = Serverboards.Components

const EditActionModel = React.createClass({
  getInitialState(){
    return {
      actions: undefined,
      services: undefined,
      form_fields: []
    }
  },
  componentDidMount(){
    cache.services().then( services => this.setState({services}))
    cache.action_catalog().then( actions => {
      this.setState({actions})
      this.handleActionChange(this.props.action.action)
    })
  },
  handleActionChange(action_id){
    const action = this.state.actions.find( ac => ac.id == action_id )
    if (!action)
      this.setState({form_fields: []})
    else
      this.setState({form_fields: action.extra.call.params})
  },
  render(){
    if (!this.state.actions || !this.state.services)
      return (
        <Loading>Actions and services</Loading>
      )
    return (
      <View {...this.state} {...this.props} onActionChange={this.handleActionChange}/>
    )
  }
})

export default EditActionModel
