import React from 'react'
import Flash from '../flash'
import FlashMessageListView from '../components/flashmessages'
import { connect } from 'react-redux'
import flash from '../actions/flash'

let FlashMessageList = connect(
  (state) => {
    //console.log("map to state %o", state.flash.messages)
    return {
      messages: state.flash.messages || []
    }
  },
  (dispatch) => ({
    handleClose: (message) =>{
       return dispatch(flash.remove(message))
     }
  })
)(FlashMessageListView)

export default FlashMessageList
