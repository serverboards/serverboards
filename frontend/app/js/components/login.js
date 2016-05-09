import React, {PropTypes} from 'react';

var LoginView = React.createClass({
  handleSubmit(ev){
    let $form = $(this.refs.el)
    let fields = $form.form('get values')

    console.log("%o %o", ev, fields);
    if ($form.form('validate form')){
      this.props._onSubmit(
        Object.assign({type: 'basic'}, fields)
      )
    }
    ev.preventDefault()
  },
  componentDidMount( ){
    self=this

    $(this.refs.el).form({
      on: 'blur',
      fields: {
        email: 'email',
        password: 'minLength[6]'
      }
    }).on('submit', self.handleSubmit)

    $(self.refs.el).find('[type=email]').focus()
  },
  render: function(){
    return (
      <form ref="el" className="ui form" method="POST">
        <div className="ui small modal active" id="login">
          <div className="header">
            Login
          </div>

          <div className="content">
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" placeholder="user@company.com"
                />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" name="password" placeholder="*******"
                />
            </div>
            <div className="ui error message"></div>
          </div>

          <div className="actions">
            <span className="ui checkbox action left" style={{float: "left"}}>
                <input type="checkbox" name="keep_logged_in"/>
                <label>
                Keep logged login
              </label>
            </span>
            <button type="submit" className="ui positive right labeled icon button">
              Login
              <i className="caret right icon"></i>
            </button>
          </div>
        </div>
      </form>
    )
  },
  propTypes: {
    _onSubmit: PropTypes.func.isRequired
  }
})


export default LoginView
