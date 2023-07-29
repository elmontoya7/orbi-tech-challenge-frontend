<template lang='pug'>
  b-navbar(type="dark" variant="dark")
    b-container
      b-navbar-brand.mx-auto
        h4.mb-0 🌮 🙂
          span.font-weight-bold.ml-1.text-light(style="font-size:10px;vertical-align:top;" v-if="isAdmin") Admin
      b-navbar-nav(v-if="has_session")
        b-nav-item(@click="logout") Salir
</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  mounted () {
    this.me()
  },
  methods: {
    logout () {
      this.$cookies.remove('tk')
      this.$cookies.remove('ui')
      this.$router.push({name: 'home'})
    }
  }
}
</script>

<style>

</style>