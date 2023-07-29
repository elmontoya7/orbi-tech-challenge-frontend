<template lang='pug'>
div
  Toolbar
  b-container.py-3.py-md-5
    h2.mb-3.mb-md-4 Dashboard
      h6.d-inline
        b-badge.ml-1(:variant="socket_connected ? 'success':'secondary'") Socket {{ socket_connected ? 'conectado' : 'no conectado' }}
    b-tabs
      b-tab(title="Órdenes activas")
        .mt-3
        b-row
          b-col
            h4 Ordenes
          b-col.d-flex.align-items-center(cols="auto") 
            b-form-checkbox.mr-3(v-model="show_cancel" style="font-size:13px;") Mostrar canceladas
        b-card.mb-3(no-body)
          b-table.mb-0(striped :items="orders_items" :fields="orders_fields")
            template(#cell(name)='{ item }')
              b-row
                b-col
                  p Pedido para {{ item.user.name }}:
                b-col(cols="auto")
                  p.mb-0.font-weight-bold ${{ item.total }}

              div.mb-3(v-for="{ dish: { id, name, price }, modifiers } in item.items" :key="id" style="font-size:14px;")
                p.mb-1 - {{ name }}
                p.mb-1(v-for="{ id, name, price } in modifiers" style="padding-left:15px;") - {{ name }}

              p.mb-0.text-secondary Dirección: {{ item.address.line_1 }}, {{ item.address.line_1 }}
                b-badge(variant="warning" v-if="item.payment.pay_on_delivery") Pago efectivo
            template(#cell(status)='{ item }')
              b-badge(:variant="badgeColor(item.status)") {{ item.status }}
              div.mt-3(v-if="item.status === 'preparando'")
                b-button(size="sm" variant="outline-danger" @click="cancelOrder(item)") Cancelar

        b-pagination(v-model="orders_page" :total-rows="orders_total" :per-page="orders_limit" @input="getOrders")
      b-tab(title="Platillos y modificadores")
        .mt-3
        b-row
          b-col(md="8")
            h4 Platillos
            b-card.mb-3(no-body)
              b-table.mb-0(striped :items="dishes_items" :fields="dishes_fields")
                template(#cell(name)='{ item }')
                  b-row(v-b-toggle="'dish_row_' + item._id")
                    b-col
                      p.mb-0 {{ item.name }}
                        b-badge.ml-1(variant="danger" v-if="item.available === false") ND
                      p.mb-0.text-secondary {{ item.notes }}
                    b-col(cols="auto")
                      p.mb-0 ${{ item.price }}

                  b-collapse.p-3(:id="'dish_row_' + item._id")
                    b-form
                      b-form-row
                        b-col(cols="6")
                          b-form-group(label="Nombre")
                            b-form-input(placeholder="Nombre" v-model="item.name")
                        b-col(cols="6")
                          b-form-group(label="Notas")
                            b-form-input(placeholder="Notas" v-model="item.notes")
                        b-col(cols="4")
                          b-form-group(label="Precio")
                            b-input-group(prepend="$")
                              b-form-input(placeholder="0.00" v-model="item.price")
                        b-col(cols="4")
                          b-form-group(label="Categoría")
                            b-form-select(:options="dish_categories" v-model="item.category")
                        b-col.d-flex.align-items-center(cols="4")
                          b-form-checkbox(v-model="item.available") Disponible
                        b-col(cols="8")
                          div
                            b-badge.mr-2.mb-2(v-for="(m, index) in item.modifiers") {{ m.name }}
                              b-icon(icon="x" style="cursor: pointer;" @click="item.modifiers.splice(index, 1)")
                            b-form-group.mb-0
                              b-form-input(placeholder="Agregar modificador..." v-model="search_modifiers" @blur="hideAfterSeconds" @focus="search_results_visible = true" autocomplete="off")
                              .modifiers-search(v-show='search_results_visible')
                                .modifier-item(v-for='modifier in modifiersList' :key='modifier._id', @click="addModifier(item, modifier)")
                                  p.mb-0.px-2.py-1 {{ modifier.name }}

                        b-col.d-flex.align-items-end.justify-content-end(cols="4")
                          b-form-row
                            b-col
                              b-button(variant="success" block size="sm" @click="updateDish(item)") Guardar
                            b-col(cols="auto")
                              b-button(variant="danger" size="sm" @click="deleteDish(item)")
                                b-icon(icon="trash")
            b-pagination(v-model="dishes_page" :total-rows="dishes_total" :per-page="dishes_limit" @input="getDishes")
          b-col(md="4")
            h4 Modificadores
            b-card.mb-3(no-body)
              b-table.mb-0(striped hover :items="modifiers_items" :fields="modifiers_fields")
                template(#cell(name)='{ item }')
                  b-row(v-b-toggle="'modifier_row_' + item._id")
                    b-col
                      p.mb-0 {{ item.name }}
                        b-badge.ml-1(variant="danger" v-if="item.available === false") ND
                    b-col(cols="auto")
                      p.mb-0 ${{ item.price }}   
                  b-collapse.p-3(:id="'modifier_row_' + item._id") 
                    b-form
                      b-form-row
                        b-col(cols="6")
                          b-form-group(label="Nombre")
                            b-form-input(placeholder="Nombre" v-model="item.name")
                        b-col(cols="6")
                          b-form-group(label="Precio")
                            b-input-group(prepend="$")
                              b-form-input(placeholder="0.00" v-model="item.price")
                        b-col.d-flex.align-items-center(cols="4")
                          b-form-checkbox(v-model="item.available") Disponible
                        b-col.d-flex.align-items-end.justify-content-end(cols="8")
                          b-form-row
                            b-col
                              b-button(variant="success" block size="sm" @click="updateModifier(item)") Guardar
                            b-col(cols="auto")
                              b-button(variant="danger" size="sm" @click="deleteModifier(item)")
                                b-icon(icon="trash")
            b-pagination(v-model="modifiers_page" :total-rows="modifiers_total" :per-page="modifiers_limit" @input="getModifiers")
</template>

<script>
import Toolbar from '@/components/Toolbar.vue'

export default {
  name: 'dashboard',
  data () {
    return {
      dishes_items: [],
      dishes_fields: [
        'name',
      ],
      dishes_total: 0,
      dishes_page: 1,
      dishes_limit: 15,

      modifiers_items: [],
      modifiers_fields: [
        'name',
      ],
      modifiers_total: 0,
      modifiers_page: 1,
      modifiers_limit: 15,

      dish_categories: [
        {
          value: null,
          text: '-- Seleccionar --',
          disabled: true
        },
        {
          value: 'entrada',
          text: 'Entrada'
        },
        {
          value: 'plato fuerte',
          text: 'Plato fuerte'
        },
        {
          value: 'bebida',
          text: 'Bebida'
        },
        {
          value: 'postre',
          text: 'Postre'
        }
      ],
      search_results_visible: false,
      search_modifiers: '',
      all_modifiers: [],

      orders_items: [],
      orders_fields: [
        'name',
        'status'
      ],
      orders_total: 0,
      orders_page: 1,
      orders_limit: 15,

      show_cancel: false,
      socket_connected: false
    }
  },
  mounted () {
    this.getDishes()
    this.getModifiers()
    this.getAllModifiers()
    this.getOrders()

    this.configureSockets()
  },
  computed: {
    modifiersList () {
      if (this.search_modifiers.length) {
        const regex = new RegExp(this.search_modifiers, 'gi')
        return this.all_modifiers.filter(i => i.available).filter(i => regex.test(i.name))
      }

      return this.all_modifiers.filter(i => i.available)
    }
  },
  methods: {
    async getDishes (page) {
      try {
        let res = await this.$axios.get('/api/restaurant/dish', {
          params: {
            page: page || this.dishes_page,
            limit: this.dishes_limit
          }
        })
        if (res.data.success) {
          this.dishes_items = res.data.resource
          this.dishes_total = res.data.total
        }
      } catch (e) {
        if (e.response.status === 400) {
          this.$bvToast.toast('Parámetros de petición inválidos', {
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
    },
    async getModifiers () {
      try {
        let res = await this.$axios.get('/api/restaurant/modifier', {
          params: {
            page: this.modifiers_page,
            limit: this.modifiers_limit
          }
        })
        if (res.data.success) {
          this.modifiers_items = res.data.resource
          this.modifiers_total = res.data.total
        }
      } catch (e) {
        if (e.response.status === 400) {
          this.$bvToast.toast('Parámetros de petición inválidos', {
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
    },
    async updateDish (item) {
      try {
        const { name, notes, price, category, available, modifiers } = item
        let res = await this.$axios.patch('/api/restaurant/dish/' + item._id, {
          name, notes, price, category, available, modifiers: modifiers.map(m => m._id)
        })
        if (res.data.success) {
          this.$bvToast.toast('Platillo actualizado con éxito', {
            title: 'Actualizado',
            autoHideDelay: 5000,
            variant: 'success'
          })

          this.$root.$emit('bv::toggle::collapse', 'dish_row_' + item._id)
        }
      } catch (e) {
        if (e.response.status === 400) {
          this.$bvToast.toast('Parámetros de petición inválidos', {
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
    },
    async deleteDish (item) {
      this.$bvModal.msgBoxConfirm('¿Deseas eliminar el platillo?', {
          title: 'Confirmar eliminado',
          okVariant: 'danger',
          okTitle: 'Eliminar',
          cancelTitle: 'Cancelar',
          centered: true
        })
          .then(async value => {
            if (value === true) {
              try {
                let res = await this.$axios.delete('/api/restaurant/dish/' + item._id)
                if (res.data.success) {
                  this.$bvToast.toast('Platillo eliminado con éxito', {
                    title: 'Eliminado',
                    autoHideDelay: 5000,
                    variant: 'success'
                  })

                  const index = this.dishes_items.findIndex(i => i._id === item._id)
                  this.dishes_items.splice(index, 1)
                }
              } catch (e) {
                if (e.response.status === 400) {
                  this.$bvToast.toast('Parámetros de petición inválidos', {
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
          })
          .catch(err => {
            // An error occurred
          })
    },
    addModifier (item, modifier) {
      const exists = item.modifiers.find(m => m._id === modifier._id)
      if (!exists) {
        item.modifiers.push(modifier)
      }
    },
    hideAfterSeconds () {
      setTimeout(() => {
        this.search_results_visible = false
        this.search_modifiers = ''
      }, 300);
    },
    async updateModifier (item) {
      try {
        const { name, price, available } = item
        let res = await this.$axios.patch('/api/restaurant/modifier/' + item._id, {
          name, price, available
        })
        if (res.data.success) {
          this.$bvToast.toast('Modificador actualizado con éxito', {
            title: 'Actualizado',
            autoHideDelay: 5000,
            variant: 'success'
          })
        }
      } catch (e) {
        if (e.response.status === 400) {
          this.$bvToast.toast('Parámetros de petición inválidos', {
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
    },
    async deleteModifier (item) {
      this.$bvModal.msgBoxConfirm('¿Deseas eliminar el modificador?', {
          title: 'Confirmar eliminado',
          okVariant: 'danger',
          okTitle: 'Eliminar',
          cancelTitle: 'Cancelar',
          centered: true
        })
          .then(async value => {
            if (value === true) {
              try {
                let res = await this.$axios.delete('/api/restaurant/modifier/' + item._id)
                if (res.data.success) {
                  this.$bvToast.toast('Modificador eliminado con éxito', {
                    title: 'Eliminado',
                    autoHideDelay: 5000,
                    variant: 'success'
                  })

                  const index = this.dishes_items.findIndex(i => i._id === item._id)
                  this.dishes_items.splice(index, 1)
                }
              } catch (e) {
                if (e.response.status === 400) {
                  this.$bvToast.toast('Parámetros de petición inválidos', {
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
          })
          .catch(err => {
            // An error occurred
          })
    },
    async getAllModifiers () {
      try {
        let res = await this.$axios.get('/api/restaurant/modifier', {
          params: {
            limit: 10000
          }
        })
        if (res.data.success) {
          this.all_modifiers = res.data.resource
        }
      } catch (e) {
        console.log(e)
      }
    },
    async getOrders (page) {
      try {
        let res = await this.$axios.get('/api/order', {
          params: {
            page: page || this.orders_page,
            limit: this.orders_limit,
            cancel: this.show_cancel
          }
        })
        if (res.data.success) {
          this.orders_items = res.data.resource
          this.orders_total = res.data.total
        }
      } catch (e) {
        if (e.response.status === 400) {
          this.$bvToast.toast('Parámetros de petición inválidos', {
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
    },
    badgeColor (status) {
      switch (status) {
        case 'preparando':
          return 'info'
        case 'cancelado':
          return 'danger'
        default:
          return 'success'
      }
    },
    async cancelOrder (item) {
      this.$bvModal.msgBoxConfirm('¿Deseas cancelar esta orden?', {
          title: 'Cancelar orden',
          okVariant: 'danger',
          okTitle: 'Continuar',
          cancelTitle: 'Omitir',
          centered: true
        })
          .then(async value => {
            if (value === true) {
              try {
                let res = await this.$axios.post('/api/order/' + item._id + '/cancel')
                if (res.data.success) {
                  item.status = 'cancelado'
                  this.$bvToast.toast('Orden cancelada con éxito', {
                    title: 'Cancelada',
                    autoHideDelay: 5000,
                    variant: 'success'
                  })
                }
              } catch (e) {
                if (e.response.status === 400) {
                  this.$bvToast.toast('Parámetros de petición inválidos', {
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
          })
          .catch(err => {
            // An error occurred
          })
    },
    configureSockets () {
      const script = document.createElement('script')
      script.src = 'http://localhost:3000/socket.io/socket.io.js'

      document.getElementsByTagName('head')[0].appendChild(script)

      this.connectSocket()
    },
    connectSocket () {
      if (!window.io) {
        setTimeout(() => {
          this.connectSocket()
        }, 500);
      } else {
        const socket = window.io('http://localhost:3000', {
          transports: ['websocket']
        })

        socket.on('welcome', () => {
          this.socket_connected = true
        })

        const ordersSocket = window.io('http://localhost:3000/orders', {
          transports: ['websocket']
        })

        ordersSocket.on('welcome', msg => console.log(msg))

        ordersSocket.on('status:update', order => {
          console.log(order);
          let index = this.orders_items.findIndex(o => o._id.toString() === order._id)
          if (index >= 0)
            this.orders_items.splice(index, 1, order)
        })

        ordersSocket.on('create', order => {
          this.orders_items.splice(0, 0, order)
        })
      }
    }
  },
  components: {
    Toolbar
  },
  watch: {
    show_cancel (value) {
      this.orders_page = 1
      this.getOrders(this.orders_page)
    }
  }
}
</script>

<style lang="scss">
  .modifiers-search {
    position: absolute;
    top: calc(100% + 5px);
    width: 50%;
    height: 150px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: white;
    border-radius: 5px;
    z-index: 100;

    .modifier-item {
      :hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    }
  }
</style>