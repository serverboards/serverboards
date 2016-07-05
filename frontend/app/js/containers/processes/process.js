import event from 'app/utils/event'
import {update_process} from 'app/actions/processes'
import ProcessView from 'app/components/processes/process'

const Process = event.subscribe_connect(
  (state) => ({
    process: state.processes.processes && state.processes.processes[0]
  }),
  (dispatch, props) => ({

  }),
  (props) => [`action.stopped[${props.params.uuid}]`],
  (props) => [ () => update_process(props.params.uuid) ]
)(ProcessView)

export default Process
