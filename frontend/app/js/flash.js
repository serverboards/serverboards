var Flash = {
  log : function(message, options){
    window.alert(message)
  },
  debug : function(message, options={}){
    options.level='debug'
    this.log(message, options)
  },
  error : function(message, options={}){
    options.level='error'
    this.log(message, options)
  },
  success : function(message, options={}){
    options.level='success'
    this.log(message, options)
  },
  info : function(message, options={}){
    options.level='info'
    this.log(message, options)
  }
}

export default Flash
