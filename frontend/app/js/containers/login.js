import React from 'react';
import rpc from 'app/rpc'
import Flash from 'app/flash'
import LoginView from 'app/components/login'
import {login} from 'app/actions/auth'
import { connect } from 'react-redux'

var Login = connect(
  (state) => ({
    lang_counter: state.auth.lang_counter,
    logging: state.auth.logging
  }),
  (dispatch) => ({
    _onSubmit: (params) => dispatch(login(params))
  })
)(LoginView)

export default Login
