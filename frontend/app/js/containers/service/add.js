import connect from 'app/containers/connect'
import View from 'app/components/service/add'
import i18n from 'app/utils/i18n'
import rpc from 'app/rpc'
import Flash from 'app/flash'

export function service_add_future(sbds, service){
  return rpc.call("service.create", service).then(function(service_uuid){
    if (sbds){
      return rpc.call("service.attach",[sbds, service_uuid]).then(function(){
        Flash.info(i18n("Added service and attached to project"))
      }).then( () => service_uuid )
    }
    else{
      Flash.warning(i18n("Added DETACHED service"))
      return service_uuid
    }
  }).catch( error => {
    Flash.error(i18n("Error creating service. {error}", {error}))
  })
}

const Model = connect({
  state(state, props){
    return {
      project: state.project.project
    }
  },
  handlers(dispatch, props){
    return {
      onAddService(project, service){
        let fut = service_add_future(project, service)
        if (props.onAddService)
          fut = fut.then((uuid) => { props.onAddService(uuid); return uuid })
        return fut
      },
      onAttachService(project, service_uuid){
        console.log("Attach service %o %o", project, service_uuid)
        return rpc.call("service.attach", [project, service_uuid]).then(function(){
          Flash.success(i18n("Service attached to current project"))
        }).catch(error => {
          Flash.error(i18n("Could not attach service to current project: {error}", {error}))
        })
      }
    }
  }
})(View)

export default Model
