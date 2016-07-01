import React from 'react'
import Modal from 'app/components/modal'

let AddGroup = React.createClass({
  handleAddGroup : function(ev){
    ev.preventDefault()

    let $form = $(this.refs.form)
    this.props.onSubmit( $form.find('[name=name]').val() )
  },
  componentDidMount(){
    $(this.refs.form).form({
      on:'blur',
      fields:{
        name: 'empty'
      }
    })
  },
  render(){
    let props=this.props

    return (
      <Modal onClose={props.onClose}>
        <h2 className="ui header">
          Add a new group
        </h2>
        <form ref="form" className="ui form" onSubmit={this.handleAddUser}>
          <div className="field">
            <label>Group name</label>
            <input type="text" name="name" placeholder="This will be used as the group identifier"/>
          </div>
          <div className="field">
            <div className="ui accept green button" onClick={this.handleAddGroup}>Add group</div>
          </div>
        </form>
      </Modal>
    )
  }
})

export default AddGroup
