import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/user/LoginView.vue'
import RegisterView from '@/views/user/RegisterView.vue'
import MainView from '../views/MainView.vue'
import RepairView from '@/views/repair/RepairView.vue'
import Overview from '@/views/overview/OverView.vue'
import DetectView from '@/views/detect/DetectView.vue'
import MergeView from '@/views/merge/MergeView.vue'
import MergeCreateView from '@/views/merge/MergeCreateView.vue'
import DiagnosisView from '@/views/diagnosis/DiagnosisView.vue'
import StationView from '@/views/station/StationView.vue'
import PlanView from '@/views/plan/PlanView.vue'
import UserView from '@/views/user/UserView.vue'
import PredictView from '@/views/predict/PredictView.vue'
import { isAuthenticated, getUserType } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/main',
      name: 'main',
      component: MainView,
      children: [
        {
          path: '/overview',
          component: Overview,
          meta: { requiresAuth: true }
        },
        {
          path: '/station',
          component: StationView
        },
        {
          path: '/repair',
          component: RepairView,
          meta: { requiresAuth: true }
        },
        {
          path: '/detect',
          component: DetectView,
          meta: { requiresAuth: true }
        },
        {
          path: '/merge',
          name: 'merge',
          component: MergeView,
          meta: { requiresAuth: true }
        },
        {
          path: '/merge/create',
          name: 'merge-create',
          component: MergeCreateView,
          meta: { requiresAuth: true }
        },
        {
          path: '/diagnosis',
          name: 'diagnosis',
          component: DiagnosisView,
          meta: { requiresAuth: true }
        },
        {
          path: '/station',
          name: 'station',
          component: StationView,
          meta: { requiresAuth: true }
        },
        {
          path: '/predict',
          name: 'predict',
          component: PredictView,
          meta: { requiresAuth: true }
        },
        {
          path: '/plan',
          name: 'plan',
          component: PlanView,
          meta: { requiresAuth: true }
        },
        {
          path: '/user',
          name: 'user',
          component: UserView,
          meta: { requiresAuth: true }
        },
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  // 检查路由是否需要登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否已登录
    if (!isAuthenticated()) {
      // 用户未登录，重定向到登录页面
      next('/login');
    } else if(to.name === 'user' && getUserType() !== 'admin'){
      // 用户已登录尝试访问用户管理界面，但是不是管理员，重定向到首页
      next('/');
    }else {
      // 用户已登录，放行
      next();
    }
  } else {
    // 这个路由不需要登录，直接放行
    next();
  }
});

export default router
