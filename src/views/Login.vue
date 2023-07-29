<template lang='pug'>
  div
    Toolbar
    b-container.py-3.py-md-5
      b-row.justify-content-center
        b-col(md="8")
          b-form(@submit.prevent="login")
            b-form-group(label="Email")
              b-form-input(placeholder="Email" v-model="form.email")
            b-form-group.mb-4(label="Contraseña")
              b-form-input(placeholder="Contraseña" type="password" v-model="form.password")
            b-button(variant="primary" block type="submit" :disabled="!canLogin") Entrar
</template>

<script>
import Toolbar from '@/components/Toolbar.vue'

export default {
  name: 'Login',
  data () {
    return {
      is_admin: false,
      form: {
        email: '',
        password: ''
      }
    }
  },
  mounted () {
    if (this.$route.query.dashboard == '1') {
      this.is_admin = true
    }

    this.me(success => {
      this.$router.push({ name: this.is_admin_user ? 'dashboard' : 'store' })
    })
  },
  computed: {
    canLogin () {
      return !!this.form.email && !!this.form.password
    }
  },
  methods: {
    async login () {
      try {
        const body = { ...this.form }
        if (this.is_admin) body['admin'] = 'yes'
        
        let res = await this.$axios.post('/api/auth/login', body)
        if (res.data.success) {
          this.$bvToast.toast('Bienveni@ de nuevo', {
            title: 'Acceso correcto',
            autoHideDelay: 5000,
            variant: 'success'
          })

          this.$cookies.set('tk', res.data.resource.access_token)
          this.$cookies.set('ui', res.data.resource._id)
          this.$router.push({name: 'home'})
        } else {
          this.$bvToast.toast('Datos de acceso incorrectos', {
            title: 'Error',
            autoHideDelay: 5000,
            variant: 'danger'
          })
        }
      } catch (e) {
        if (e.response.status === 401 || e.response.status === 400) {
          this.$bvToast.toast('Datos de acceso incorrectos', {
            title: 'Error',
            autoHideDelay: 5000,
            variant: 'danger'
          })
        } else {
          this.$bvToast.toast('Ocurrió un error', {
            title: 'Error',
            autoHideDelay: 5000,
            variant: 'danger'
          })
        }
      }
    }
  },
  components: {
    Toolbar
  }
}
</script>

<style>

</style>