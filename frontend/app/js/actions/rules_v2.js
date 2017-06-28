import rpc from 'app/rpc'


export function rules_v2_list(project){
  return rpc.call("rules_v2.list", {project}).then(payload => ({
    type: "RULES_V2_LIST",
    payload
  }))
}

export function rules_v2_list_clear(){
  return {
    type: "RULES_V2_LIST",
    payload: undefined
  }
}
