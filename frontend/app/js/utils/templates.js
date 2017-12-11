import Moustache from 'moustache'

export function render_promise(template, future_vars){
  return future_vars.then( (vars) => {
    render(template, vars)
  })
}

export function render(template, vars){
  return Moustache.render(template, vars)
}

export default {render, render_promise}
