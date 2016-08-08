let command_searchs = []

export function add_command_search(f){
  command_searchs.push(f)
}

export function search(Q, context){
  //console.log("Search for %o", Q)
  return new Promise(function(resolve, reject){
    let results = []

    for(let f of command_searchs){
      try{
        results = results.concat(f(Q, context))
      } catch(e) {
        console.error("%o at %o",e,f)
      }
    }

    resolve(results)
  })
}


add_command_search(require('./serverboards').search)
add_command_search(require('./profile').search)

export default { search, add_command_search }
