<template>
  <a-layout id="view-container">
    <a-layout-sider width="310px">
      <div class="logo-system">
        <IconLogo></IconLogo>
        <span>
          <p class="h2">浙江大唐新能源</p>
          <p class="h4">智慧光伏运维系统</p>
        </span>
      </div>
      <Menu v-model:selectedKeys="selectedKeys" mode="inline" theme="dark" :items="items" @select="handleMenuChange">
      </Menu>
      <div class="user-info-bar">
        <div class="user-info-box">
          <a-tooltip :title="userType === 'admin' ? '管理员' : '用户'">
            <span class="user-type">
              <a-avatar :size="22" :style="{background: userType === 'admin' ? '#3C49C2' : '#888', verticalAlign: 'middle'}">
                <template #icon>
                  <UserOutlined />
                </template>
              </a-avatar>
            </span>
          </a-tooltip>
          <span class="user-divider">|</span>
          <span class="user-id">
            <a-icon :component="UserOutlined" />
            <span class="user-id-text">{{ username }}</span>
          </span>
          <a-button class="logout-btn" type="primary" danger size="small" @click="handleLogout">退出登录</a-button>
        </div>
      </div>
    </a-layout-sider>
    <a-layout style="background: #484d50">
      <a-layout-content id="main-content-container">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import {
  PieChartOutlined,
  HighlightOutlined,
  ReconciliationOutlined,
  FileOutlined,
  BugOutlined,
  UserOutlined,
  ToolOutlined,
  BarChartOutlined
} from '@ant-design/icons-vue'
import AnalyzeOutlined from '../icons/AnalyzeOutlined.vue'
import { reactive, ref, h, watch } from 'vue'
import IconLogo from '../components/icons/IconLogo.vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Modal } from 'ant-design-vue'
import { getUserType, getUsername, removeToken } from '@/utils/auth'

const selectedKeys = ref(['1']);

const items = reactive([
  {
    key: '1',
    icon: () => h(AnalyzeOutlined),
    label: '主界面',
    title: '主界面',
  },
  {
    key: '2',
    icon: () => h(PieChartOutlined),
    label: '数据总览',
    title: '数据总览',
  },
  {
    key: '3',
    icon: () => h(HighlightOutlined),
    label: '数据问题修复',
    title: '数据问题修复',
  },
  {
    key: '4',
    icon: () => h(ReconciliationOutlined),
    icon: () => h(ReconciliationOutlined),
    label: '多源数据融合',
    title: '多源数据融合',
  },
  // {
  //   key: 'sub1',
  //   icon: () => h(ClearOutlined),
  //   label: '数据智能清洗',
  //   title: '数据智能清洗',
  //   children: [
  //     {
  //       key: '3',
  //       label: '数据问题修复',
  //       title: '数据问题修复',
  //     },
  //     {
  //       key: '4',
  //       label: '多源数据融合',
  //       title: '多源数据融合',
  //     },
  //   ],
  // },
  {
    key: '5',
    icon: () => h(BugOutlined),
    label: '低效组串识别',
    title: '低效组串识别',
  },
  // {
  //   key: '6',
  //   icon: () => h(SearchOutlined),
  //   label: '异常诊断',
  //   title: '异常诊断',
  // },
  // {
  //   key: '7',
  //   icon: () => h(BarChartOutlined),
  //   label: '损失估计',
  //   title: '损失估计',
  // },
  // {
  //   key: 'sub2',
  //   icon: () => h(BarChartOutlined),
  //   label: '低效损失研判',
  //   title: '低效损失研判',
  //   children: [
  //     {
  //       key: '6',
  //       label: '异常诊断',
  //       title: '异常诊断',
  //     },
  //     {
  //       key: '7',
  //       label: '损失估计',
  //       title: '损失估计',
  //     },
  //   ],
  // },
  {
    key: '8',
    icon: () => h(FileOutlined),
    label: '运维方案',
    title: '运维方案',
  },
]);

// console.log(getUserType());
if (getUserType() === 'admin') {
  items.push({
    key: '9',
    icon: () => h(UserOutlined),
    label: '用户管理',
    title: '用户管理',
  });
}

const router = useRouter();
const route = useRoute(); // 适合监听路径变化
router.push('/overview')

const userType = getUserType();
const username = getUsername();

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出登录',
    content: '确定要退出当前账号吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      removeToken();
      router.push('/login');
    }
  });
}

// Map route paths to menu keys
const routeToKeyMap = {
  '/overview': '1',
  '/station': '2',
  '/repair': '3',
  '/merge': '4',
  '/detect': '5',
  '/diagnosis': '6',
  '/predict': '7',
  '/plan': '8',
  '/user': '9'
}

const handleMenuChange = (e) => {
  switch (e.key) {
    case '1':
      router.push('/overview');
      break;
    case '2':
      router.push('/station');
      break;
    case '3':
      router.push('/repair');
      break;
    case '4':
      router.push('/merge');
      break;
    case '5':
      router.push('/detect');
      break;
    case '6':
      router.push('/diagnosis');
      break;
    case '7':
      router.push('/predict')
      break;
    case '8':
      router.push('/plan')
      break;
    case '9':
      router.push('/user')
      break;
    default:
      break;
  }
}

// Watch route changes and update selectedKeys
watch(() => route.path, (newPath) => {
  console.log(newPath)
  const key = Object.entries(routeToKeyMap).find(([path]) => newPath.startsWith(path))?.[1]
  if (key) selectedKeys.value = [key]
}, { immediate: true })
</script>

<style>
#view-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

#main-content-container {
  padding: 10px;
  height: 100%;
}

.logo-system {
  margin-top: 1rem;
  margin-bottom: 1rem;
  margin-left: 1rem;
  display: flex;
  color: #e2e2e2;
  align-items: center;
}

.h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.h4 {
  font-size: 1rem;
  font-weight: 300;
  margin: 0;
}

.logo-system svg {
  height: 5rem;
  margin-right: 2rem;
}

.ant-layout-sider-children {
  background: #393C41;
}

.ant-menu-inline {
  background: #393C41 !important;
}

.ant-menu-item {
  height: 6vh !important;
  line-height: 6vh !important;
}

.ant-menu-item-selected {
  height: 6vh !important;
  line-height: 6vh !important;
  background: #3C49C2 !important;
}

.user-info-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px 0 22px 0;
  z-index: 10;
}
.user-info-box {
  background: #2d2f36;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 8px 18px 8px 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 240px;
  justify-content: center;
}
.user-type {
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  gap: 4px;
}
.user-id {
  color: #e2e2e2;
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 90px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-id-text {
  display: inline-block;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.user-divider {
  color: #888;
  font-size: 1rem;
  margin: 0 4px;
}
.logout-btn {
  margin-left: 10px;
  font-weight: 500;
  border-radius: 8px;
  font-size: 0.92rem;
}
</style>