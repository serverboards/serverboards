import connect from 'app/containers/connect'
import View from 'app/components/service/add'
import i18n from 'app/utils/i18n'
import rpc from 'app/rpc'
import Flash from 'app/flash'

function service_add_future(sbds, service){
  console.log("Try to add service %o %o", sbds, service)
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
  }).catch( e => {
    Flash.error(i18n("Error creating service. {error}", {error: e}))
  })
}

const Model = connect({
  handlers(dispatch, props){
    return {
      handleAddService(project, service){
        return service_add_future(project, service)
      }
    }
  }
})(View)

export default Model
