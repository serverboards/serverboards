import rpc from 'app/rpc'
import Flash from 'app/flash'
import event from 'app/utils/event'
import {i18n, i18n_nop} from 'app/utils/i18n'
import { set_lang } from './i18n'
import cache from 'app/utils/cache'
import {map_get} from 'app/utils'
import store from 'app/utils/store'

export function logout(){
  return {
    type: 'AUTH_LOGOUT'
  }
}
export function login(params){
  return function(dispatch){
    dispatch({type:"AUTH_TRY_LOGIN"})

    rpc
      .call("auth.auth",{email:params.email, password:params.password, type:"basic"})
      .then(function(user){
        logged_in_as(user)(dispatch)
      })
      .catch(function(msg){
        console.error(msg)
        Flash.error("Cant login "+msg)
        dispatch({type:"AUTH_FAIL_LOGIN"})
      })
  }
}

export function logged_in_as(user){
  return function(dispatch){
    if (user){
      Flash.log("Logged in as "+user.email)
      event.subscribe(["user.updated"])
      dispatch({type:"AUTH_LOGIN", user: user})
      rpc.call("settings.user.get", ["profile_avatar"]).then( (d) => {
        if (d && d.avatar)
          dispatch( user_update_avatar(d.avatar) )
      })
      rpc.call("settings.user.get", ["language"]).then( (props) => {
        let lang = props && props.lang
        if (lang){
          set_lang(lang)(dispatch)
        }
      })
      rpc.call("settings.user.get", ["tracking"]).then( (props) => {
        dispatch(set_tracking(props ? props.tracking : true))
      })
      dispatch(user_update_licenses())
    }
    else{
      Flash.error("Invalid email/password")
      dispatch({type:"AUTH_FAIL_LOGIN"})
    }
  }
}

export function user_update_avatar(avatar){
  return {
    type:"AUTH_PROFILE_AVATAR",
    avatar
  }
}

export function user_list(){
  return function(dispatch){
    rpc.call("user.list", []).then((list) => {
      list = list.sort(function(a,b){ a.email < b.email ? -1 : 1 })
      dispatch({type:'AUTH_USER_LIST', users: list})
    })
  }
}

export function user_add(user){
  return function(dispatch){
    rpc.call("user.create", user).then(() => {
      Flash.info("User added")
    })
  }
}

export function user_update(user, attributes){
  return function(dispatch){
    rpc.call("user.update", [user, attributes]).then(() => {
      Flash.info("User updated")
    })
  }
}

export function group_list(){
  return function(dispatch){
    rpc.call("group.list", []).then((list) => {
      let groups=[]
      Promise.all( list.map((g) => {
        return Promise.all([
          Promise.resolve(g),
          rpc.call("group.get", [g])
        ])
      }) ).then(function(gs){
        gs.map( (g) => {
          groups.push( {name: g[0], users: g[1].users, perms: g[1].perms} )
        })
        dispatch({type:'AUTH_GROUP_LIST', groups: groups})
      } )
    })
  }
}

export function group_update_perms(group, to_add, to_remove){
  return function(dispatch){
    Promise.all([
      Promise.all(
        to_add.map( (p) => rpc.call("group.perm.add", [group, p])  )
      ), Promise.all(
        to_remove.map( (p) => rpc.call("group.perm.delete", [group, p]) )
      )
    ]).then(() => {
      Flash.info("Updated group permissions.")
    })
  }
}

export function group_update_users(group, to_add, to_remove){
  return function(dispatch){
    Promise.all([
      Promise.all(
        to_add.map( (u) => rpc.call("group.user.add", [group, u])  )
      ), Promise.all(
        to_remove.map( (u) => rpc.call("group.user.delete", [group, u]) )
      )
    ]).then(() => {
      Flash.info("Updated group users.")
    })
  }
}

export function group_remove_user(group, user){
  return function(dispatch){
    rpc.call("group.user.delete", [group, user])
  }
}

export function group_add_user(group, user){
  return function(dispatch){
    rpc.call("group.user.add", [group, user])
  }
}

export function group_add(group){
  return function(dispatch){
    rpc.call("group.create", [group]).then(() => {
      Flash.info("Group added")
    })
  }
}
export function group_remove(group){
  return function(dispatch){
    rpc.call("group.delete", [group]).then(() => {
      Flash.info("Group removed")
    })
  }
}

export function perm_list(){
  return function(dispatch){
    rpc.call("perm.list", []).then((l) =>{
      dispatch({type: "AUTH_PERMS_LIST", perms: l})
    })
  }
}

const LANG_LIST={
  "es" : i18n_nop("spanish"),
  "en" : i18n_nop("english"),
}

export function user_settings_set_language(lang){
  return function(dispatch){
    rpc.call("settings.user.set", ["language", {lang}]).then( () => {
      Flash.info(i18n("Set language to {lang}", {lang: i18n( LANG_LIST[lang] )}))
      set_lang(lang)(dispatch)
    })
  }
}

export function user_settings_set_tracking(tracking){
  return function(dispatch){
    rpc.call("settings.user.set", ["tracking", {tracking}]).then( () => {
      dispatch(set_tracking(tracking))
    })
  }
}

export function user_settings_accept_license(license){
  console.log("Accept license", license)
  const email = store.getState().auth.user.email
  rpc.call("log.info", [`${email} accepted license ${license}`, {email, license}])
  return rpc
    .call("settings.user.get", ["legal"]).then( prev => {
      const accepted = map_get(prev, ["accepted"], []).concat(license)
      return rpc
        .call("settings.user.set", ["legal", {accepted}])
        .then( () => user_update_licenses() )
    })
}

export function user_update_licenses(){
  return Promise.all([
    rpc.call("settings.user.get", ["legal"]),
    cache.plugin_component({type: "license"})
  ]).then( al => {
    // console.log(al)
    let [legal, licenses] = al
    console.log({legal, licenses})
    const have = map_get(legal, ["accepted"], [])
    licenses = licenses.filter( l => have.indexOf(l.id)<0 )
    return {
      type: "AUTH_SET_LICENSES",
      payload: licenses
    }
  })
  .catch(console.error)
}

export function set_tracking(tracking){
  return {
    type: "AUTH_SET_TRACKING",
    payload: tracking,
  }
}
