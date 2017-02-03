import connect from './connect'
import View from 'app/components/avatar'
import {get_avatar} from 'app/actions/avatar'

const Avatar = connect({
  state(state, props){
    return {avatar: state.avatar[props.email] }
  },
  store_enter(state, props){
    if (props.email && !state.avatar[props.email]){
      return [() => get_avatar(props.email)]
    }
    return []
  }
})(View)

export default Avatar
