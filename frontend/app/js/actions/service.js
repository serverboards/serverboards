import rpc from '../rpc'
import Flash from '../flash'

function components_update_catalog(){
  return {
    type:"UPDATE_COMPONENTS",
    components: [
      {
        id: "core.generic",
        name: "Generic Server",
        description: "Assorted data for a generic server",
        type: "generic",
        configuration: [
          {name: "URL", type: "url"}
        ]
      },
      {
        id: "core.email",
        name: "Email server",
        description: "Email server",
        type: "generic",
        configuration: [
          {name: "URL", type: "url"}
        ]
      },
      {
        id: "core.email_account",
        name: "Email account",
        description: "Email account data",
        type: "email",
        configuration: [
          {name: "email", type: "email"},
          {name: "smtp_server", label:"SMTP Server", type: "text"},
          {name: "imap_server", label:"IMAP Server", type: "text"},
          {name: "username", type: "text"},
          {name: "password_pw", type: "password"}
        ]
      },

    ]
  }
}

function service_update_all(){
  return function(dispatch){
    rpc.call("service.list",[]).then(function(data){
      dispatch({type: "UPDATE_ALL_SERVICES", services: data})
    })
  }
}

function service_add(data){
  return function(dispatch, store){
    rpc.call("service.add",
        [ data.shortname, {name: data.name || "", tags: data.tags.split(' ')}]
      ).then(function(){
        Flash.info(`Added service ${data.name}`)
      })
  }
}

function service_delete(shortname){
  return function(dispatch){
    rpc.call("service.delete", [shortname]).then(function(){
      Flash.info(`Removed service ${shortname}`)
    })
  }
}


export {
  components_update_catalog,
  service_add,
  service_update_all,
  service_delete
  }
