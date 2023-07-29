<template lang='pug'>
  div
    Toolbar
    b-container.py-3.py-md-5
      b-row.justify-content-center
        b-col(md="8")
          b-row
            b-col.text-center.mb-3.mb-md-5(cols="12")
              b-button(variant="primary" size="lg" block :to="{name: 'login', query: { dashboard: 1 } }") Soy administrador
            b-col.text-center(cols="12")  
              b-button(variant="primary" size="lg" block :to="{name: 'login' }") Soy usuario
</template>

<script>
import Toolbar from '@/components/Toolbar.vue'

export default {
  name: 'HomeView',
  components: {
    Toolbar
  },
  mounted () {
    this.me(success => {
      this.$router.push({ name: this.is_admin_user ? 'dashboard' : 'store' })
    })
  }
}
</script>
