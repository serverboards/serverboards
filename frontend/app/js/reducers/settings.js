// Default status, put over current
const default_state={
  settings: undefined,
}

export const settings = (state = default_state , action) => {
  switch(action.type){
    case "SETTINGS_ALL":
      return {settings: action.settings}
  }
  return state
}

export default settings
