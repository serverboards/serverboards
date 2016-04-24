let flash={
  add: (message, options) => {
    console.log("Flash message: %o, %o", message, options.level)
    return {
     type: 'FLASH_ADD',
     message, options
   }
 },
  remove: (message) => ({
    type: 'FLASH_REMOVE',
    message
  })
}

export default flash
