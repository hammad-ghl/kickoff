import './style.css'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import { createApp } from 'vue'
import router from './router'
import Toast, { POSITION } from 'vue-toastification'

const app = createApp(App)

app.use(router)
app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
  transition: 'Vue-Toastification__bounce',
  maxToasts: 5,
  newestOnTop: true,
})

app.mount('#app')
