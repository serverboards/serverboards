import React from 'react'
import Modal from 'app/components/modal'
import i18n from 'app/utils/i18n'

class AddGroup extends React.createClass{
  handleAddGroup(ev){
    ev.preventDefault()

    let $form = $(this.refs.form)
    this.props.onAddGroup( $form.find('[name=name]').val() )
    this.props.setModal(false)
  }
  componentDidMount(){
    $(this.refs.form).form({
      on:'blur',
      fields:{
        name: 'empty'
      }
    })
  }
  render(){
    let props=this.props

    return (
      <Modal onClose={props.onClose}>
        <div className="ui top secondary menu">
          <h3 className="ui header">
            {i18n("Add a new group")}
          </h3>
        </div>
        <div className="ui padding with scroll">
          <form ref="form" className="ui form" onSubmit={this.handleAddGroup.bind(this)}>
            <div className="field">
              <label>Group name</label>
              <input type="text" name="name" placeholder="This will be used as the group identifier"/>
            </div>
            <div className="field">
              <div className="ui accept teal button" onClick={this.handleAddGroup.bind(this)}>Add group</div>
            </div>
          </form>
        </div>
      </Modal>
    )
  }
}

export default AddGroup
