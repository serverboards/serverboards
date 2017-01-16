const React = Serverboards.React
const {GenericForm} = Serverboards.Components

const EditAction = React.createClass({
  componentDidMount(){
    $(this.refs.form).find('.dropdown').dropdown()
    $(this.refs.form).find('.checkbox').checkbox()
  },
  render(){
    const props=this.props
    const action = props.action
    return (
      <div>
        <div className="ui header menu top">
          <h4>Edit action</h4>
        </div>

        <div className="ui container">
          <div className="ui form" ref="form">
            <div className="field">
              <label>Name</label>
              <input type="text" defaultValue={action.name} onChange={(ev) => props.onUpdateName(ev.target.value)}/>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea onChange={(ev) => props.onUpdateDescription(ev.target.value)}>{action.description}</textarea>
            </div>
            <div className="field ui checkbox">
              <input type="checkbox" defaultChecked={action.confirmation}  onChange={(ev) => props.onUpdateConfirmation(ev.target.value)}/>
              <label>Require confirmation</label>
            </div>
            <div className="field">
              <label>Service</label>
              <select className="ui dropdown search" defaultValue={action.service} onChange={(ev) => props.onServiceChange(ev.target.value)}>
                <option value=".">No service selected</option>
                {props.services.map( (s) => (
                  <option key={s.uuid} value={s.uuid}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Action</label>
              <select className="ui dropdown search" defaultValue={action.action} onChange={(ev) => props.onActionChange(ev.target.value)}>
                <option value=".">No action selected</option>
                {props.actions.map( (s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <GenericForm fields={props.form_fields} data={action.params} updateForm={props.onUpdateActionParams}/>
          </div>

          <div className="ui buttons" style={{marginTop: 30}}>
            <button onClick={props.onAccept} className="ui yellow button">Update quick action</button>
            <button onClick={props.onClose} className="ui grey button">Cancel</button>
          </div>
        </div>
      </div>
    )
  }
})

export default EditAction
