import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Antd from 'ant-design-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faChevronRight,
  faChevronDown,
  faCaretRight,
  faCaretDown,
  faSquare,
  faSquareCheck
} from '@fortawesome/free-solid-svg-icons'
import * as echarts from 'echarts';
import dttheme from './theme/dttheme.json';
import './assets/main.css'

echarts.registerTheme('dt', dttheme.theme);
const app = createApp(App)
library.add(faChevronDown, faChevronRight, faCaretRight, faCaretDown, faSquare, faSquareCheck) // 将图标添加到库中
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon) // 注册全局组件
app.use(store)
app.use(Antd)
app.mount('#app')