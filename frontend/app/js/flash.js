var Flash = {
  log : function(message, options){
    window.alert(message)
  },
  debug : function(message, options={}){
    options.level='debug'
    Flash.log(message, options)
  },
  error : function(message, options={}){
    options.level='error'
    Flash.log(message, options)
  },
  success : function(message, options={}){
    options.level='success'
    Flash.log(message, options)
  },
  info : function(message, options={}){
    options.level='info'
    Flash.log(message, options)
  },
  warning : function(message, options={}){
    options.level='info'
    Flash.log(message, options)
  }
}

export default Flash
