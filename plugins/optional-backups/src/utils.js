const {rpc} = Serverboards

const UNITS = [ "B", "KiB", "MiB", "GiB", "TiB", "ZiB"]

export function calculate_size(size){
  let csize = size
  let i
  for (i=0;i<UNITS.length;i++){
    let nsize = csize/1024;
    if (nsize<1.0)
      break
    csize = nsize
  }

  return {
    size: csize,
    unit: UNITS[i]
  }
}

let cache={}


export function get_source_catalog(){
  let res = cache["source_catalog"]
  if (res)
    return Promise.resolve(res)
  else{
    return new Promise( (accept, reject) => {
      rpc
        .call("plugin.component.catalog", {type: "backup source"})
        .then( sources => {
          cache["source_catalog"]=sources
          accept(sources)
        })
        .catch(e => reject(e))
    })
  }
}

export function get_source_type(id){
  return get_source_catalog().then( all => {
    let ret = all.find( x => x.id == id )
    if (!ret)
      throw ("source_type_not_found")
    return ret
  })
}

export function get_destination_catalog(){
  let res = cache["destination_catalog"]
  if (res)
    return Promise.resolve(res)
  else{
    return new Promise( (accept, reject) => {
      rpc
        .call("plugin.component.catalog", {type: "backup destination"})
        .then( dests => {
          cache["destination_catalog"]=dests
          accept(dests)
        })
        .catch(e => reject(e))
    })
  }
}

export function get_destination_type(id){
  return get_destination_catalog().then( all => {
    let ret = all.find( x => x.id == id )
    if (!ret)
      throw ("destination_type_not_found")
    return ret
  })
}
