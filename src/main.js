import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import './plugins/bootstrap-vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

import VueCookies from 'vue-cookies'
Vue.use(VueCookies)

import request from './plugins/request'
Vue.use(request)

Vue.mixin({
  data () {
    return {
      is_admin_user: false,
      has_session: false
    }
  },
  methods: {
    async me (successCallback, errorCallback) {
      try {
        let res = await this.$axios.get('/api/auth/me')
        if (res.data.resource) {
          this.has_session = true
          this.is_admin_user = res.data.resource.is_admin
          
          if (successCallback) successCallback()
        } else {
          this.has_session = false
          this.is_admin_user = false
          if (errorCallback) errorCallback()
        }
      } catch (e) {
        console.log(e)
        this.has_session = false
        this.is_admin_user = false
        if (errorCallback) errorCallback()
      }
    },
  }
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
