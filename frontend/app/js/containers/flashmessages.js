import React from 'react'
import Flash from 'app/flash'
import FlashMessageListView from 'app/components/flashmessages'
import { connect } from 'react-redux'
import flash from 'app/actions/flash'

let FlashMessageList = connect(
  (state) => {
    //console.log("map to state %o", state.flash.messages)
    return {
      messages: state.flash.messages || [],
      lang_counter: state.auth.lang_counter
    }
  },
  (dispatch) => ({
    handleClose: (message) =>{
       return dispatch(flash.remove(message))
     }
  })
)(FlashMessageListView)

export default FlashMessageList
