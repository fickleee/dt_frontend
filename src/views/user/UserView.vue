<template>
    <div class="user-header">
        <div class="user-header-left">
            <div class="user-header-title">用户权限管理</div>
            <Button class="user-button" @click="showUserModal(null)">添加用户</Button>
            <Modal
        v-model:open="userModalVisible"
        :title="userModalTitle"
        ok-text="提交"
        cancel-text="取消"
        @ok="handleSubmitUser"
        @cancel="cancelUserModal"
    >
        <Form ref="userForm" :model="userFormData" :rules="userFormRules" layout="vertical">
            <FormItem name="userName" label="用户名">
                <Input v-model:value="userFormData.userName" placeholder="请输入用户名" :disabled="isEditUser" />
            </FormItem>
            <FormItem v-if="!isEditUser" name="userPwd" label="用户密码">
                <InputPassword v-model:value="userFormData.userPwd" placeholder="请输入用户密码"/>
            </FormItem>
            <FormItem v-if="!isEditUser" name="confirmUserPwd" label="确认密码">
                <InputPassword v-model:value="userFormData.confirmUserPwd" placeholder="请输入用户密码"/>
            </FormItem>
            <FormItem name="userType" label="用户权限">
                <Select v-model:value="userFormData.userType" placeholder="请选择用户权限">
                    <SelectOption value="admin">admin</SelectOption>
                    <SelectOption value="user">user</SelectOption>
                </Select>
            </FormItem>
            <FormItem name="userEmail" label="用户邮箱">
                <Input v-model:value="userFormData.userEmail" placeholder="请输入用户邮箱" />
            </FormItem>
            <FormItem name="userPhone" label="用户手机号">
                <Input v-model:value="userFormData.userPhone" placeholder="请输入用户手机号" />
            </FormItem>
        </Form>
    </Modal>
        </div>
        <div class="user-header-right">
            <div class="user-header-text">用户名:</div>
            <input placeholder="请输入用户名" v-model= "username" @keyup.enter="handleSearch"/>
            <Button class="user-button" @click.prevent="handleSearch">查询</Button>
        </div>
    </div>
    <div class="user-detail">
        <div class="user-detail-container">
            <Table ref="userTableRef" class="user-detail-table" :columns= runtimeColumns
                :dataSource=runtimeResults
                :scroll="{ x: '100%', y: tableBodyHeight }"></Table>
        </div>
    </div>
</template>

<script setup>
import { Button, Table, Tag, Space, message, Modal, Form, Input, Select, FormItem, SelectOption, InputPassword} from 'ant-design-vue';
import { onMounted, ref, h, reactive, onBeforeUnmount, nextTick} from 'vue';
import { getAllUser, getUserByName, changeUserStatus, deleteUser, editUser, postUsername, postUserRegister, resetUserPassword } from '@/api/user/apiUser';
import { md5 } from 'js-md5';

const DEFAULT_PASSWORD = '12345';

//获取用户名
const username = ref('');
const userModalVisible = ref(false); // 控制模态框显示
const userModalTitle = ref('添加用户'); // 模态框标题
const isEditUser = ref(false); // 标志位，判断是添加还是修改
const userForm = ref(null); // 用户表单
const userFormData = reactive({ // 用户表单数据
    userName: '',
    userPwd: '',
    confirmUserPwd: '',
    userType: '',
    userEmail: '',
    userPhone: '',
    originalUserName: '' // 用于存储修改前的用户名
});
// 用户表单验证规则
const userFormRules = {
    userName: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        {
            validator: async (rule, value) => {
                if (value && !isEditUser.value) { // 如果是添加用户操作
                    const exists = await postUsername(value);
                    if (exists) {
                        return Promise.reject(new Error('用户名已存在'));
                    }
                } else if (value && isEditUser.value && value !== userFormData.originalUserName) { // 如果是修改用户操作，并且用户名发生了改变
                    const exists = await postUsername(value);
                    if (exists) {
                        return Promise.reject(new Error('用户名已存在'));
                    }
                }
            },
            trigger: 'blur'
        },
        { pattern: /^[a-zA-Z0-9]+$/, message: '用户名只能包含字母和数字', trigger: 'blur' }
    ],
    userPwd: [
        { required: true, message: '请输入用户密码', trigger: 'blur' },
        // { pattern: /^[a-zA-Z0-9_]{6,12}$/, message: '密码需为6-12位字母、数字或下划线', trigger: 'blur' }
    ],
    confirmUserPwd: [
        { required: true, message: '请输入用户密码', trigger: 'blur' },
        {
        validator: (rule, value) => {
            if (value !== userFormData.userPwd) {
                return Promise.reject(new Error('两次输入的密码不一致'));
            } else {
                return Promise.resolve();
            }
        },
        trigger: 'blur'
        }
        ],
    userType: [{ required: true, message: '请选择用户权限', trigger: 'change' }],
    userEmail: [
        { required: true, message: '请输入用户邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
    ],
    userPhone: [
        { required: true, message: '请输入用户手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
    ]
};

// 显示用户模态框
const showUserModal = (record) => {
    if (record) {
        userModalTitle.value = '修改用户';
        isEditUser.value = true;
        userFormData.userName = record.userName;
        userFormData.userType = record.userType;
        userFormData.userEmail = record.userEmail;
        userFormData.userPhone = record.userPhone;
        userFormData.originalUserName = record.userName; // 存储修改前的用户名
    } else {
        userModalTitle.value = '添加用户';
        isEditUser.value = false;
        resetUserFormData();
    }
    userModalVisible.value = true;
};

const addUser = async (formData) => {
    const ret = await postUserRegister({
        username: formData.userName,
        password: md5(formData.userPwd),
        phone: formData.userPhone,
        email: formData.userEmail
    });
    return ret;
};
// 提交用户信息
const handleSubmitUser = async () => {
    try {
        await userForm.value.validate();

        const formData = userFormData;
        if (isEditUser.value) {
            const ret = await editUser(formData);
            if (ret.status) {
                message.success('修改用户成功');
            } else {
                message.error('修改用户失败');
            }
        } else {
            const ret = await addUser(formData);
            if (ret.status) {
                message.success('添加用户成功');
            } else {
                message.error('添加用户失败');
            }
        }
        userModalVisible.value = false;
        searchAllUsers(); // 重新加载用户列表
    } catch (error) {
        message.error('操作失败');
        console.log(error);
    }
};

// 取消用户模态框
const cancelUserModal = () => {
    userModalVisible.value = false;
    resetUserFormData();
};

const resetUserFormData = () => {
    userFormData.userName = '';
    userFormData.userPwd = '';
    userFormData.confirmUserPwd = '';
    userFormData.userType = '';
    userFormData.userEmail = '';
    userFormData.userPhone = '';
    userFormData.originalUserName = ''; 
};

//前后端数据格式转换代码
const transformData = (backData) =>{
    return backData.map(item => {
        return {
            userName: item[0],
            userType: item[1],
            userEmail: item[2],
            userPhone: item[3],
            userValidated: item[4]
        };
    });
}

//表格列
const runtimeColumns = [
    {
        title: '用户名',
        dataIndex: 'userName',
        // sorter: true,
    },
    {
        title: '用户权限',
        dataIndex: 'userType',
    },
    {
        title: '用户邮箱',
        dataIndex: 'userEmail',
    },
    {
        title: '用户手机号',
        dataIndex: 'userPhone',
    },
    {
        title: '是否激活',
        dataIndex: 'userValidated',
        customRender: ({ record }) => {
            return record.userValidated ? 
                h(Tag, { color: 'geekblue' }, () => '已激活') : 
                h(Tag, { color: 'default' }, () => '未激活');
        }
    },
    {
        title: '操作',
        key: 'action',
        customRender: ({ record }) => {
            return h(Space, null, [
                // 修改按钮
                h('a', { onClick: () => showUserModal(record) }, '修改'),
                // 删除按钮
                h('a', { onClick: () => showDeleteConfirm(record) }, '删除'),
                // 重置密码按钮
                h('a', { onClick: () => handleResetPassword(record) }, '重置密码'),
                // 激活/禁用按钮
                h('a', { 
                    onClick: () => handleActivate(record),
                }, record.userValidated ? '禁用' : '激活')
            ]);
        }
    }
];

//删除用户
const handleDelete = async(record) => {
    const ret = await deleteUser(record.userName);
    if(ret.status) {
        searchAllUsers();
    }
    else {
        // 删除失败
        console.log('删除失败', record.userName);
    }

    // 处理删除逻辑
};

//显示删除确认框
const showDeleteConfirm = (record) => {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除用户 ${record.userName} 吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
            handleDelete(record);
        },
        onCancel: () => {
            // console.log('取消删除');
        }
    });
};

//激活/禁用用户
const handleActivate = async(record) => {
    if(record.userValidated) record.userValidated = 0;
    else record.userValidated = 1;
    const ret = await changeUserStatus(record.userName, record.userValidated);
    if(ret.status) searchAllUsers();
    else console.log('激活/禁用失败', record.userName);

};

//重置密码
const handleResetPassword = async(record) => {
    Modal.confirm({
        title: '确认重置密码',
        content: `确定要将用户 ${record.userName} 的密码重置为${DEFAULT_PASSWORD}吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
            const ret = await resetUserPassword(record.userName, md5(DEFAULT_PASSWORD));
            if(ret.status) {
                message.success('密码重置成功');
            } else {
                message.error('密码重置失败');
            }
        }
    });
};

//查询用户
const handleSearch = async() => {
    if(!username.value || username.value.trim() === '') {
        runtimeResults.value = searchAllUsers();
    }

    // 处理查询逻辑
    const ret = await getUserByName(username.value.trim());
    const backData = await ret.users;
    if(backData) {
        const frontData = transformData(backData);
        runtimeResults.value = frontData;
    }
    else {
        runtimeResults.value = [];
    }
};

//查询所有用户
const searchAllUsers = async() => {
    const ret = await getAllUser();
    const backData = await ret.users;
    const frontData = transformData(backData);
    runtimeResults.value = frontData;
};

let runtimeResults = ref(null);

const userTableRef = ref(null);
const tableBodyHeight = ref(200); // 初始值

const calcTableBodyHeight = () => {
  nextTick(() => {
    if (userTableRef.value && userTableRef.value.$el) {
      const tableEl = userTableRef.value.$el;
      const parentEl = tableEl.parentElement; // .user-detail-container
      
      if (parentEl) {
        const parentHeight = parentEl.clientHeight;

        // 获取表头高度
        const tableHeaderEl = tableEl.querySelector('.ant-table-thead');
        const headerHeight = tableHeaderEl ? tableHeaderEl.offsetHeight : 0;

        // 你可以根据实际情况加上表格分页、标题等高度
        // 这里只减去表头
        tableBodyHeight.value = Math.max(0, parentHeight - headerHeight);
      }
    }
  });
};

onMounted(() => {
  calcTableBodyHeight();
  searchAllUsers();
  window.addEventListener('resize', calcTableBodyHeight);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', calcTableBodyHeight);
});

</script>

<style>

.user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 40px;
    padding: 0 20px;
    height: 6%;
    background-color: #393C41;
    border-radius: 10px;
}

.user-header-left {
    display: flex;
    align-items: center;
}

.user-header-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #e2e2e2;
    margin-right: 1rem;
}

.user-button {
    margin-left: 20px;
    width: 140px;
    height: 75%;
    background-color: #484d50;
    border: none;
    border-radius: 20px;
}

.user-header-right {
    display: flex;
    align-items: center;
}

.user-header-right div {
    font-size: 1rem;
}

.user-header-right input {
    width: 200px;
    height: 30px;
    margin-left: 20px;
    border-radius: 20px;
    background-color: #484d50;
    color: #e2e2e2;
    border: none;
    padding-left: 10px;
}

.user-detail {
    height: 86%;
    margin-top: 20px;
}

.user-detail-container {
    width: 100%;
    height: 100%;
    background-color: #393C41;
    border-radius: 10px;
    overflow-x: hidden;
    overflow-y: auto;
}

.ant-space-item {
    margin-left: 15px;
}

.ant-space-item:first-child {
    margin-left: 0;
}
</style>