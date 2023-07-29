import Vue from 'vue'
import axios from 'axios';

export default {
  install (app, options) {
    const instance = axios.create({
      baseURL: `http://localhost:3000`
    })

    instance.interceptors.request.use(function (config) {
      config.headers['x-auth-user'] = app.prototype.$cookies.get('tk')
      return config
    }, function (error) {
      return Promise.reject(error)
    })
    
    instance.interceptors.response.use(function (response) {
      return response
    }, function (error) {
      if (error.response.status === 401 || error.response.status === 403) {
        app.prototype.$cookies.remove('tk')
        app.prototype.$cookies.remove('ui')
      }
      return Promise.reject(error);
    })

    app.prototype.$axios = instance
  }
}