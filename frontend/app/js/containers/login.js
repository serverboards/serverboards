import React from 'react';
import rpc from '../rpc'
import Flash from '../flash'
import LoginView from '../components/login'
import {login} from '../actions/auth'
import { connect } from 'react-redux'

var Login = connect(
  (state) => ({}),
  (dispatch) => ({
    _onSubmit: (params) => dispatch(login(params))
  })
)(LoginView)

export default Login
