import React from 'react'
import Modal from 'app/components/modal'
import AddIssue from 'app/containers/issues/add'

function AddModal(props){
  return (
    <Modal className="wide">
      <AddIssue {...props}/>
    </Modal>
  )
}

export default AddModal
