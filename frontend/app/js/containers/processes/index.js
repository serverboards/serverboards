import event from 'app/utils/event'
import {update_process_list} from 'app/actions/processes'
import ProcessesView from 'app/components/processes'

console.log('update process list', update_process_list)

const Processes = event.subscribe_connect(
  (state) => ({
    processes: state.processes.processes
  }),
  (dispatch, props) => ({

  }),
  ["action.started","action.stopped"],
  [ update_process_list ]
)(ProcessesView)

export default Processes
