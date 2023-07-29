<template lang='pug'>
div
  Toolbar
  b-container.py-3.py-md-5
    h2.mb-3.mb-md-4 Ordena tus tacos favoritos
    b-row
      b-col(md="8")
        h4 Platillos
        b-card.mb-3(no-body)
          b-table.mb-0(striped :items="dishes_items" :fields="dishes_fields")
            template(#cell(name)='{ item }')
              b-row.mb-2
                b-col
                  p.mb-0 {{ item.name }}
                    b-badge.ml-1(variant="danger" v-if="item.available === false") ND
                  p.mb-0.text-secondary {{ item.notes }}
                b-col(cols="auto")
                  p.mb-0 ${{ item.price }}

              b-row
                b-col
                  b-form-checkbox-group(v-model="item.extras")
                    b-form-checkbox(v-for="m in item.modifiers" :key="m._id" :value="m") {{ m.name }} (+${{ m.price }})
                b-col.d-flex.align-items-end(cols="auto")
                  b-button(variant="success" size="sm" @click="addToCart(item)") Agregar
        b-pagination(v-model="dishes_page" :total-rows="dishes_total" :per-page="dishes_limit" @input="getDishes")

      b-col(md="4")
        h4 Carrito
        b-card.mb-3(no-body)
          b-table.mb-0(striped :items="cart_items" :fields="cart_fields" show-empty)
            template(#empty)
              span Tu carrito está vacío
            template(#cell(name)="{ item, index }")
              b-row
                b-col
                  p.mb-1.font-weight-bold {{ item.name }}
                  p.mb-0.text-secondary ${{ item.price }}
                  p.mb-0.text-secondary(v-if="!item.extras.length") Sin extras
                  p.mb-0.text-secondary(v-for="extra in item.extras" :key="extra._id") {{ extra.name }} (+${{ extra.price }})
                b-col(cols="auto" style="position:relative;")
                  p.mb-0.font-weight-bold ${{ sumTotal(item) }}
                  b-icon(icon="trash" style="position:absolute;bottom:5px;right:15px;cursor:pointer;" @click="cart_items.splice(index, 1)")

        b-form-group(label="Dirección de entrega:")
          b-form-input.mb-1(placeholder="Línea 1" v-model="address_line_1")
          b-form-input(placeholder="Línea 2" v-model="address_line_2")
        
        b-form-group(label="Agrega propina:")
          b-form-radio-group(:options="tip_options" buttons v-model="selected_tip" size="sm" button-variant="light")
        
        b-button(variant="success" block :disabled="!canCheckout" @click="checkout") Checkout

  b-modal(v-model="payment_modal" title="Confirmar pedido" ok-title="Confirmar pedido" ok-variant="success" cancel-title="Cancelar" @ok="createOrder" :ok-disabled="loading")
    b-card.mb-3(no-body)
      b-table.mb-0(striped :items="cart_items" :fields="cart_fields" show-empty)
        template(#empty)
          span Tu carrito está vacío
        template(#cell(name)="{ item, index }")
          b-row
            b-col
              p.mb-1.font-weight-bold {{ item.name }}
              p.mb-0.text-secondary ${{ item.price }}
              p.mb-0.text-secondary(v-if="!item.extras.length") Sin extras
              p.mb-0.text-secondary(v-for="extra in item.extras" :key="extra._id") {{ extra.name }} (+${{ extra.price }})
            b-col(cols="auto" style="position:relative;")
              p.mb-0.font-weight-bold ${{ sumTotal(item) }}

    b-card(no-body)
      b-table.mb-0(striped :items="total_table_items" :fields="total_table_fields")
        template(#cell(total)="{item}")
          p.mb-0.text-right.font-weight-bold ${{item.total}}

    b-card
      b-form-checkbox.mb-3(v-model="pay_on_delivery") Pago contra entrega
      b-form(v-if="!pay_on_delivery")
        b-form-group(label="Número de tarjeta")
          b-form-input(placeholder="Número de tarjeta" v-model="card_number")
        b-form-group(label="Fecha expiración")
          b-form-row
            b-col(cols="6")
              b-form-input(placeholder="MM/YYYY" v-model="card_exp_date")

</template>

<script>
import Toolbar from '@/components/Toolbar.vue'

export default {
  name: 'store',
  data () {
    return {
      loading: false,

      dishes_items: [],
      dishes_fields: [
        'name',
      ],
      dishes_total: 0,
      dishes_page: 1,
      dishes_limit: 15,

      cart_items: [],
      cart_fields: [
        'name'
      ],

      selected_tip: 0,
      tip_options: [
        {
          text: '0%',
          value: 0
        },
        {
          text: '5%',
          value: 5
        },
        {
          text: '10%',
          value: 10
        },
        {
          text: '15%',
          value: 15
        }
      ],

      address_line_1: '',
      address_line_2: '',
      pay_on_delivery: true,
      card_number: '',
      card_exp_date: '',

      payment_modal: false,
      total_table_items: [],
      total_table_fields: [
        'concepto',
        'total'
      ]
    }
  },
  mounted () {
    this.getDishes()
  },
  computed: {
    canCheckout () {
      return this.cart_items.length && this.address_line_1 && this.address_line_2 && !this.loading
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
          this.dishes_items = res.data.resource.map(d => ({
            ...d,
            extras: []
          }))
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
    addToCart (item) {
      const clone = {...item}
      item.extras = []
      this.cart_items.push(clone)
    },
    sumTotal (item) {
      let total = 0

      total += item.price

      for (let { price } of item.extras) {
        total += price
      }

      return total
    },
    async checkout () {
      this.loading = true
      this.total_table_items = []
      try {
        let res = await this.$axios.post('/api/order/checkout', {
          user_id: this.$cookies.get('ui'),
          tip: this.selected_tip,
          address_line_1: this.address_line_1,
          address_line_2: this.address_line_2,
          pay_on_delivery: this.pay_on_delivery,
          card_number: this.card_number,
          card_exp_date: this.card_exp_date,
          items: this.cart_items.map(i => {
            return {
              dish_id: i._id,
              modifiers: i.extras.map(m => m._id)
            }
          })
        })
        
        if (res.data.success) {
          const data = res.data.resource
          this.total_table_items.push(...[
            {
              concepto: 'Total platillos',
              total: data.total_dishes
            },
            {
              concepto: 'Total modificadores',
              total: data.total_modifiers
            },
            {
              concepto: 'Subtotal',
              total: data.subtotal
            },
            {
              concepto: 'Propina',
              total: data.tip
            },
            {
              concepto: 'Total',
              total: data.total
            }
          ])

          this.payment_modal = true
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

      this.loading = false
    },
    async createOrder (evt) {
      evt.preventDefault()
      this.loading = true
      try {
        let res = await this.$axios.post('/api/order', {
          user_id: this.$cookies.get('ui'),
          tip: this.selected_tip,
          address_line_1: this.address_line_1,
          address_line_2: this.address_line_2,
          pay_on_delivery: this.pay_on_delivery,
          card_number: this.card_number,
          card_exp_date: this.card_exp_date,
          items: this.cart_items.map(i => {
            return {
              dish_id: i._id,
              modifiers: i.extras.map(m => m._id)
            }
          })
        })
        
        if (res.data.success) {
          this.$bvToast.toast('Tu orden se creó con éxito y recibirás una confirmación por correo electrónico', {
            title: 'Creada',
            autoHideDelay: 10000,
            variant: 'success'
          })

          this.cart_items = []
          this.address_line_1 = ''
          this.address_line_2 = ''
          this.pay_on_delivery = true
          this.selected_tip = 0
          this.payment_modal = false
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

      this.loading = false
    },
  },
  components: {
    Toolbar
  },
}
</script>