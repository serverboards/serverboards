import React from 'react'
import View from 'app/components/rules_v2/rule'
import Menu from 'app/components/rules_v2/rulemenu'
import Loading from 'app/components/loading'
import i18n from 'app/utils/i18n'
import {object_is_equal, merge, map_set, map_get, concat} from 'app/utils'
import cache from 'app/utils/cache'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import { goto } from 'app/utils/store'

import Description from 'app/components/rules_v2/edit/description'
import Service from 'app/components/rules_v2/edit/service'
import Trigger from 'app/components/rules_v2/edit/trigger'
import Params from 'app/components/rules_v2/edit/params'
import Condition from 'app/components/rules_v2/edit/condition'
import ActionEdit from 'app/components/rules_v2/edit/action'
import AddNode from 'app/components/rules_v2/edit/addnode'
import Error from 'app/components/error'

function find_action(actions, path){
  if (path.length==0)
    return actions
  let head = path[0]
  let rest = path.slice(1)
  return find_action(actions[path[0]], rest)
}

function update_rule(rule, path, value){
  if (path.length==0){
      switch (rule.type){
        case "action":
        case "condition":
          return merge(rule, value)
        case "add":
          return value
        default:
          console.error("Invalid rule leaf node for updating: %o", rule)
          return rule
      }
  }
  const [head, ...rest] = path
  if (!isNaN(head)){ // an index of an array
    const before=(head>0) ? rule.slice(0, head) : []
    const after=rule.slice(head+1)
    const item = update_rule(rule[head], rest, value)
    const ret = [...before, item, ...after]
    console.assert(ret.length==rule.length, ret.length, rule.length, rule, before, head, after)
    return ret
  }

  return merge(rule, {[head]: update_rule(rule[head], rest, value)})
}

function insert_add(rule, path){
  if (path.length == 1){
    return rule.concat({type: "add"})
  }
  const [head, ...rest] = path
  if (!isNaN(head)){
    const before=(head>0) ? rule.slice(0, head) : []
    const after=rule.slice(head+1)
    const item = insert_add(rule[head], rest)
    const ret = [...before, item, ...after]
    console.assert(ret.length==rule.length, ret.length, rule.length, rule, before, head, after)
    return ret
  }

  return {...rule, [head]: insert_add(rule[head], rest) }
}

function remove_step(rule, path){
  const [head, ...rest] = path
  if (path.length==1){ // can only remove from arrays. conditionals make no sense no then branch.
    console.assert(!isNaN(head), "%o is not a number", head)
    const before=(head>0) ? rule.slice(0, head) : []
    const after=rule.slice(head+1)
    return [...before, ...after]
  }
  const item = remove_step(rule[head], rest)
  if (!isNaN(head)){ // Replace (or remove) the element
    const before=(head>0) ? rule.slice(0, head) : []
    const after=rule.slice(head+1)
    const ret = [...before, item, ...after]
    console.assert(ret.length==rule.length, ret.length, rule.length, rule, before, head, after)
    return ret
  }
  else{ // is a conditional, change the branch
    return {...rule, [head]: item}
  }
}

function prepare_node_list(current){
  if (!current)
    return []
  if (current.type=="condition"){
    let ret=[[]] // condition is a terminal in itself
    for (let y of prepare_node_list(current.then)){
      ret.push(["then", ...y])
    }
    for (let y of prepare_node_list(current.else)){
      ret.push(["else", ...y])
    }
    return ret
  }
  if (current.type=="action"){
    return [[]] // this is a terminal, empty list to append at the end of the path
  }
  if (current.type=="add"){
    return [[]] // this is a terminal
  }
  let ret = []
  for (let x in current){
    for (let y of prepare_node_list(current[x])){
      ret.push([x, ...y])
    }
  }
  return ret
}

function get_next(current, path){
  const nl = prepare_node_list(current)
  let stop=false // mark stop on next iteration
  for (let i of nl){
    if (stop)
      return i
    if (object_is_equal(i,path))
      stop=true
  }
  return [0]
}
function get_prev(current, path){
  const nl = prepare_node_list(current)
  let prev="when:params"
  for (let i of nl){
    if (object_is_equal(i,path))
      return prev
    prev=i
  }
  return "when:params"
}

function decorate_actions(actions){
  if (actions.length!=undefined){
    let ret = actions.map( a => decorate_actions(a) )
    ret.push({type: 'add'})
    return ret
  }
  if (actions.type=="condition")
    return {
      ...actions,
      then: decorate_actions(actions.then),
      else: decorate_actions(actions.else),
    }
  return actions
}

function prepare_for_save(rule){
  switch(rule.type){
    case "condition":
      return {
        ...rule,
        then: prepare_for_save(rule.then),
        else: prepare_for_save(rule.else)
      }
      break;
    case "action":
    case "trigger":
      return rule
      break;
    case "add":
      return undefined
      break;
    default:
      return rule
        .map( prepare_for_save )
        .filter( r => r != undefined )
  }
}

class Model extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      rule: map_set( this.props.rule, ['rule','actions'], decorate_actions(this.props.rule.rule.actions) ),
      section: {
        id: "description",
        data: {},
        section: "description"
      },
    }
    this.updateRule = this.updateRule.bind(this)
    this.gotoStep = this.gotoStep.bind(this)
    this.removeStep = this.removeStep.bind(this)
  }
  componentDidMount(){
    const props = this.props
    props.setSectionMenu(Menu)
    props.setSectionMenuProps({
      gotoRules: () => { goto(`/project/${props.project.shortname}/rules_v2/`) },
    })
  }
  componentWillUnmount(){
    const props = this.props
    props.setSectionMenu(null)
    props.setSectionMenuProps({})
  }
  updateRule(what, value){
    let rule = this.state.rule
    if (what=="name"){
      rule = map_set( rule, ["name"], value )
    }
    else if (what=="description"){
      rule = map_set( rule, ["description"], value )
    }
    else if (what=="is_active"){
      rule = map_set( rule, ["is_active"], value )
    }
    else if (!isNaN(what[0])){
      rule = update_rule(rule, ["rule", "actions", ...what], value )
    }
    else{
      rule = map_set( rule, ["rule", ...what], value )
    }
    this.setState({rule})
    this.props.setSectionMenuProps({
      gotoRules: () => { goto(`/project/${this.props.project.shortname}/rules_v2/`) },
      saveRule: () => this.saveRule(), // added this to signal it has been modified
    })
    return rule
  }
  insertAdd(path, rule=undefined){
    if (!rule)
      rule = this.state.rule
    rule = insert_add(rule, ["rule", "actions", ...path])
    this.setState({rule})
    return rule
  }
  // Passing the optional rule is necesary when updating state and changing section
  // if not, by the wayt react apply state, will not realize of the updated
  // data on section change. Maybe on next gotoStep.
  gotoStep(step, rule=undefined, extra=undefined){
    console.log(step)
    const section = this.state.section
    if (!rule)
      rule=this.state.rule
    const when = rule.rule.when
    const onChangeSection = (section, id, data) =>
      this.setState({section: {id, section, data}})

    switch(step){
      case "description":
        onChangeSection("description")
        break;
      case "when:service":
        cache.service(when.params.service_id).then( s =>
          onChangeSection("when:service", null, {
            service_id: s.uuid,
            onSelect: (s) => {
              console.log("Selected service %o", s)
              const rule = this.updateRule(["when", "params", "service_id"], s.uuid )
              this.gotoStep("when:trigger", rule)
            },
            type: s.type,
            nextStep: () => this.gotoStep("when:trigger")
          })
        )
        break;
      case "when:trigger":
        onChangeSection("when:trigger", null, {
          current: when.trigger,
          onSelect: (t) => {
            const rule = this.updateRule(["when","trigger"], t.id)
            this.gotoStep("when:params", rule)
          },
          prevStep: () => this.gotoStep("when:service"),
          nextStep: () => this.gotoStep("when:params")
        })
        break;
      case "when:params":
        if (when.params.service_id){
          cache.service(when.params.service_id).then( s =>{
            console.log(s)
            onChangeSection("params", ["when", "params"], {
              data: when.params,
              trigger: when.trigger,
              skip_fields: Object.keys(s.config).concat("service_id").concat("service"),
              prevStep: () => this.gotoStep("when:trigger"),
              onUpdate: (data) => {
                this.updateRule(["when","params"], data)
                this.gotoStep([0])
              }
            } )
          })
        }
        else{
          onChangeSection("params", ["when", "params"], {
            data: when.params,
            trigger: when.trigger,
            skip_fields: [],
            prevStep: () => this.gotoStep("when:trigger"),
            onUpdate: (data) => {
              this.updateRule(["when","params"], data)
              this.gotoStep("action:"+rule.rule.actions[0].id)
            }
          } )
        }
        break;
      case "next":
        const next = get_next(rule.rule.actions, extra)
        console.warn("from %o to %o", extra, next)
        this.gotoStep(next)
        break;
      case "prev":
        const prev = get_prev(rule.rule.actions, extra)
        console.warn("from %o to %o", extra, next)
        this.gotoStep(prev)
        break;
      default:
        const action = find_action(rule.rule.actions, step)
        if (action){
          if (action.type=="action"){
            onChangeSection("action", step, {
              action,
              onUpdate: (data) => {
                this.updateRule(step, data)
                this.gotoStep("next", undefined, step)
              }
            })
          }
          else if (action.type=="condition"){
            onChangeSection("condition", step, {
              action,
              condition: action.condition,
              onUpdate: (data) => {
                this.updateRule(step, data)
                this.gotoStep("next", undefined, step)
              }
            })
          }
          else if (action.type=="add"){
            onChangeSection("add", step, {
              action,
              addNode: (type) => {
                console.log("Add node %o, %o", step, type)
                let rule
                switch(type){
                  case "action":
                    rule = this.updateRule(step, {type: type})
                    break;
                  case "condition":
                    rule = this.updateRule(step, decorate_actions( {type: type, then: [], else: []} ))
                    break;
                }
                rule = this.insertAdd(step, rule)
                this.gotoStep(step, rule)
              }
            })
          }
        }
        else{
          console.error("Unknown step %o", step)
        }
        break;
    }
  }
  removeStep(path){
    console.log("Remove step %o", path)
    const rule = remove_step(this.state.rule, ["rule", "actions", ...path])
    this.setState({rule})
    return rule
  }
  saveRule(){
    const r = this.state.rule
    const rule = {
      uuid: r.uuid,
      description: r.description,
      name: r.name,
      project: r.project,
      rule: {
        when: prepare_for_save(r.rule.when),
        actions: prepare_for_save(r.rule.actions),
      }
    }
    rpc.call("rules_v2.update", [r.uuid, rule]).then(() => {
      Flash.success(i18n("Updated rule *{name}*", {name: r.name}))
    })
  }
  getCurrentSection(){
    switch(this.state.section.section){
      case "description":
        return Description
      case "params":
        return Params
      case "when:service":
        return Service
      case "when:trigger":
        return Trigger
      case "condition":
        return Condition
      case "action":
        return ActionEdit
      case "add":
        return AddNode
    }
    return () => (
      <Error>{i18n(`Unknown section ${this.state.section.section}`)}</Error>
    )
  }
  render(){
    const props = this.props
    const state = this.state
    if (!props.rule)
      return (
        <div>{i18n("Unknown Rule. Try another.")}</div>
      )
    return (
      <View
        {...props}
        {...state}
        Section={this.getCurrentSection()}
        onUpdate={this.updateRule}
        gotoStep={this.gotoStep}
        removeStep={this.removeStep}
        addNode={this.addNode}
        />
    )
  }
}

export default Model
