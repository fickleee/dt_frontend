<template>
  <div class="login-container">
    <div class="company-logo">
      <img src="@/assets/images/datang_logo.png" alt="大唐logo" />
    </div>
    <div class="login-box">
      <div class="login-box-header">
        <img src="@/assets/images/login.png" />
        <div class="login-title">注册系统</div>
      </div>
      <form @submit.prevent="handleRegister" class="login-form">
        <div class="form-group">
          <div class="form-label-container">
            <img src="@/assets/images/union.png" />
            <div class="form-label">用户名</div>
          </div>
          <input v-model="user.username" :class="{'input-error': !usernameValid || usernameExists}" type="text" required @change="checkUsernameExists" />
        </div>
        <div class="form-group">
          <div class="form-label-container">
            <img src="@/assets/images/pwd.png" />
            <div class="form-label">密码</div>
          </div>
          <input v-model="user.password" type="password" required />
        </div>
        <div class="form-group">
          <div class="form-label-container">
            <img src="@/assets/images/pwd.png" />
            <div class="form-label">重复密码</div>
          </div>
          <input v-model="confirmPassword" :class="{'input-error': passwordMismatch}" type="password" required @change="checkPasswordsMatch" />
        </div>
        <div class="form-group">
          <div class="form-label-container">
            <img src="@/assets/images/pwd.png" />
            <div class="form-label">安全邮箱</div>
          </div>
          <input v-model="user.email" :class="{'input-error': emailFormat}" type="text" required @change="checkEmailFormat" />
        </div>
        <div class="form-group">
          <div class="form-label-container">
            <img src="@/assets/images/pwd.png" />
            <div class="form-label">安全手机</div>
          </div>
          <input v-model="user.phone" :class="{'input-error': phoneFormat}" type="text" required @change="checkPhoneFormat" />
        </div>
        <div class="login-box-footer">
          <button type="submit" class="register-button">注册</button>
          <button type="button" class="return-button" @click="returnHome">返回</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { postUsername, postUserRegister } from '@/api/user/apiUser';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import md5 from 'js-md5';
import { message } from 'ant-design-vue';

const user = reactive({
  username: '',
  password: '',
  email: '',
  phone: '',
});
const confirmPassword = ref('');
const passwordMismatch = ref(false);
const emailFormat = ref(false);
const phoneFormat = ref(false);
const usernameExists = ref(false);
const usernameValid = ref(true);
const router = useRouter();

const checkPasswordsMatch = () => {
  passwordMismatch.value = user.password !== confirmPassword.value;
  if (passwordMismatch.value) {
    message.error('密码不匹配，请重新输入', 2);
  }
};

const validateNameFormat = () => {
  const pattern = /^[a-zA-Z0-9]+$/;
  usernameValid.value = pattern.test(user.username);
  if (!usernameValid.value) {
    message.error('用户名只能包含字母和数字', 2);
  }
};

const handleRegister = async () => {
  if (usernameExists.value) {
    message.error('用户名已被使用', 2);
    return;
  }
  if (!usernameValid.value) {
    message.error('用户名只能包含字母和数字', 2);
    return;
  }
  if (passwordMismatch.value || user.password !== confirmPassword.value) {
    message.error('密码不匹配，请重新输入', 2);
    return;
  }
  if (emailFormat.value) {
    message.error('邮箱格式有误，请重新输入', 2);
    return;
  }
  if (phoneFormat.value) {
    message.error('手机格式有误，请重新输入', 2);
    return;
  }
  if (!user.username || !user.password || !user.email || !user.phone) {
    message.error('请填写所有必填项', 2);
    return;
  }
  const curUser = { username: user.username, password: md5(user.password), phone: user.phone, email: user.email };
  const ret = await postUserRegister(curUser);
  message.info(`${ret.username}：${ret.message}`, 2);
};

const checkEmailFormat = () => {
  const email = user.email;
  const pattern = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
  emailFormat.value = !pattern.test(email);
  if (emailFormat.value) {
    message.error('邮箱格式有误，请重新输入', 2);
  }
};

const checkPhoneFormat = () => {
  const phone = user.phone;
  const pattern = /^1\d{10}$/;
  phoneFormat.value = !pattern.test(phone);
  if (phoneFormat.value) {
    message.error('手机格式有误，请重新输入', 2);
  }
};

const checkUsernameExists = async () => {
  validateNameFormat();
  usernameExists.value = await postUsername(user.username);
  if (usernameExists.value) {
    message.error('用户名已被使用', 2);
  }
};

const returnHome = () => {
  router.push('/');
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
  color: white;
}

.password-mismatch {
  color: red;
  font-size: 12px;
  margin-top: 10px;
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
}


input:focus {
  outline: none;
}

.login-button,
.register-button,
.return-button {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
  color: #FFFFFF;
}

.register-button {
  background-color: #3c49c2;
}

.return-button {
  background-color: #494b5f;
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