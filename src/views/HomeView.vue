<script setup>
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <main class="home-container">
    <div class="company-logo">
      <img src="@/assets/images/datang_logo.png" alt="大唐logo" />
    </div>
    <div class="home-box">
      <img class="home-logo" src="../assets/images/logo.png" />
      <div class="home-title">浙江大唐</div>
      <div class="home-title">国际新能源有限责任公司</div>
      <div class="home-title">智慧光伏运维系统</div>
      <div class="home-footer">
        <button @click.prevent="handleLogin" class="login-button">登录</button>
        <button @click.prevent="handleRegister" class="register-button">注册</button>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  methods: {
    handleLogin() {
      // 跳转到登录页面
      this.$router.push('/login')
    },
    handleRegister() {
      // 跳转到注册页面
      this.$router.push('/register')
    }
  }

}
</script>


<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: url('../assets/images/background_day.png') no-repeat center center;
  background-size: cover;
  color: white;
}

.home-box {
  width: 380px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-content: center;
  justify-items: center;
}

.home-box img {
  margin-bottom: 20px;
}

.home-logo {
  height: 50px;
  width: 60px;
}

.home-title {
  font-size: 30px;
  font-weight: bold;
  letter-spacing: 4px;
}

.login-button,
.register-button {
  width: 180px;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-button {
  background-color: #3c49c2;
  margin-bottom: 10px;
}

.register-button {
  background-color: #aed3ff;
  margin-bottom: 10px;
}

.login-button:hover,
.register-button:hover {
  opacity: 0.9;
}

.home-footer {
  width: 100%;
  margin-top: 30px;
  /* background-color: pink; */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.company-logo {
  position: fixed;
  top: 40px;
  left: 40px;
  z-index: 100;
}

.company-logo img {
  height: 40px;
  width: auto;
}
</style>
