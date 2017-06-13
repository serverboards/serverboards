import cache from './cache'

export function get_last_project(){
  let last_project = localStorage.last_project

  // if (!state.project.projects.find( (p) => p.shortname == last_project )) // not real, dont use it
  //   last_project = undefined
  // if (!last_project){
  //   const prjs = state.project.projects
  //   console.log(prjs)
  //   if (prjs && prjs.length > 0)
  //     last_project=prjs[0].shortname
  // }
  if (!last_project)
    return cache.projects().then( (projects) => projects.length > 0 ? projects[0].shortname : false )


  if (last_project.indexOf("/")>0)
    return Promise.resolve(false)
  // Ensure it exists, if it does, go there, if not no previous.
  return cache.projects().then( (projects) =>
    projects.find((p) => p.shortname == last_project)
    ? last_project
    : false )
}
