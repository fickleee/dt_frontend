<script setup>
import { Button, ConfigProvider, Select, theme, TimePicker } from 'ant-design-vue';
import { RouterView } from 'vue-router'
</script>

<template>
  <ConfigProvider :theme="{
    algorithm: theme.darkAlgorithm,
    token: {
      'colorBgContainer': '#393C41',
      'colorBgElevated': '#393C41',
      'colorPrimaryBg': '#3C49C2',
      'colorPrimary': '#FFFFFF'
    },
    components: {
      Select: {
        controlHeight: '6vh',

      }
    }
  }">
    <div id="app-container">
      <RouterView />
    </div>
  </ConfigProvider>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 防止滚动条出现 */
}

#app-container {
  width: 100vw;
  /* 容器宽度等于视口宽度 */
  height: 100vh;
  /* 容器高度等于视口高度 */
  display: flex;
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
}
</style>
