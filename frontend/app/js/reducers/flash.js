let flashid=1

function flash(state={messages:[]}, action){
  switch(action.type){
    case 'FLASH_ADD':
      flashid+=1
      return {messages: state.messages.concat({
        message: action.message,
        level: action.options.level || 'log',
        id: flashid
      })}
    case 'FLASH_REMOVE':
      return {messages: state.messages.filter( (st) => (st.message!=action.message) )}
  }
  return state
}

export default flash
