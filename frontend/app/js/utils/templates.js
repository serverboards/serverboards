export function render_promise(template, future_vars){
  return future_vars.then( (vars) => {
    render(template, vars)
  })
}

const handlebards_re=/{{([^}]*)}}/g

export function render(template, vars){
  if (!template)
    return ""
  if (vars == undefined)
    return ""
  function find_var(v, vars){
    if (v.length==0)
      return vars
    console.log("Find: %o in %o", v, vars)
    return find_var(v.slice(1), vars[v[0]])
  }
  function vars_replacer(_, name){
    console.log("Find and replace: %s in %o", name, vars)
    return find_var(name.split('.'), vars)
  }
  return template.replace(handlebards_re, vars_replacer)
}
