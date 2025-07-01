<template>
  <div class="login-container">
    <div class="company-logo">
      <img src="@/assets/images/datang_logo.png" alt="大唐logo" />
    </div>
    <div class="login-box">
      <div class="login-box-header">
        <img src="@/assets/images/login.png" />
        <div class="login-title">登录系统</div>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <div class="form-label-container">
            <img src="@/assets/images/union.png" />
            <div class="form-label">用户名</div>
          </div>
          <input v-model="username" :class="{'input-error': errorType === 'login' || errorType === 'unregistered'}" type="text" required />
        </div>
        <div class="form-group">
          <div class="form-label-container">
            <img src="@/assets/images/pwd.png" />
            <div class="form-label">密码</div>
          </div>
          <input v-model="password" :class="{'input-error': errorType === 'login'}" type="password" required />
        </div>
        <div class="login-box-footer">
          <button type="submit" class="login-button">登录</button>
          <button type="button" @click.prevent="handleRegister" class="register-button">注册</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { postUserLogin } from '@/api/user/apiUser';
import { md5 } from 'js-md5';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { setToken } from '@/utils/auth';
import { message } from 'ant-design-vue';

const username = ref('');
const password = ref('');
const errorType = ref(''); // '', 'validate', 'login', 'unregistered'
const router = useRouter();

const handleLogin = async () => {
  const user = {
    username: username.value,
    password: md5(password.value)
  };
  const ret = await postUserLogin(user);
  if (ret.status == 0) {
    setToken(ret.token);
    router.push('/main');
  }
  else if (ret.status == 1) {
    errorType.value = 'validate';
    message.warning('该用户还未通过验证审核，请联系管理员！', 2);
  }
  else if (ret.status == 2) {
    errorType.value = 'login';
    message.error('用户名或密码错误，登录失败！', 2);
  }
  else {
    errorType.value = 'unregistered';
    message.error('该用户名未注册！', 2);
  }
};

const handleRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: url('@/assets/images/background_day.png') no-repeat center center;
  background-size: cover;
}

.login-box {
  width: 280px;
}

.form-group {
  margin-bottom: 1rem;
}

input {
  font-size: 12px;
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  /* 黑色透明色 */
  background-color: rgba(255, 255, 255, .2);
  box-sizing: border-box;
}

input:focus {
  outline: none;
}

.login-button,
.register-button {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #FFFFFF;
  box-sizing: border-box;
}

.login-button {
  background-color: #3c49c2;
  margin-bottom: 10px;
}

.register-button {
  background-color: #aed3ff;
}

.login-button:hover,
.register-button:hover {
  opacity: 0.9;
}

.login-box-header {
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;
  /* background-color: orange; */
}

.login-box-header img {
  width: 27px;
  height: 18px;
}

.login-title {
  margin-left: 10px;
  font-size: 20px;
}

.login-form {
  margin-top: 30px;
}

.form-label-container {
  padding-left: 5px;
  margin-bottom: 5px;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: start;
  /* background-color: orange; */
}

.form-label {
  margin-left: 10px;
  font-size: 12px;
}

.form-label-container img {
  width: 10px;
  height: 10px;
}

.login-box-footer {
  margin-top: 30px;
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

.input-error {
  border: 1px solid #ff4d4f !important;
  /* background-color: #fff1f0; */
}
</style>