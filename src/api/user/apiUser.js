import request from '@/utils/request'

const postUserRegister = async (user) => {
    try {
        const response = await request.post('/user/register', user);
        return response;
    }   
    catch {
        console.error("用户注册失败");
    }
};

const postUserLogin = async (user) => {
    try {
        const response = await request.post('/user/login', user);
        return response;
    }
    catch {
        console.error("用户登录失败");
    }
}

const postUsername = async (username) => {
    try {
        const response = await request.post('/user/validate_name',{username:username});
        return response.exist;
    }   
    catch {
        console.error("用户名验证失败");
    }
};

const getAllUser = async () => {
    try {
        const response = await request.post('/user/all');
        return response;
    }
    catch {
        console.error("获取用户列表失败");
    }
};

const getUserByName = async (username) => {
    try {
        const response = await request.post('/user/getUserByName',{username:username});
        console.log('response', response);
        return response;
    }
    catch {
        console.error("获取用户信息失败");
    }
}

const changeUserStatus = async (username, status) => {
    try {
        const response = await request.post('/user/changeUserStatus',{username:username, status:status});
        if(!response.status)
            console.log("修改用户状态失败");
        return response;
    }
    catch {
        console.error("修改用户状态失败");
    }
}

const deleteUser = async (username) => {
    try {
        const response = await request.post('/user/deleteUser',{username:username});
        if(!response.status)
            console.log("删除用户失败");
        return response;
    }
    catch {
        console.error("删除用户失败");
    }
}

const editUser = async (user) => {
    try {
        const response = await request.post('/user/editUser', user);
        if(!response.status)
            console.log("编辑用户失败");
        return response;
    }
    catch {
        console.error("编辑用户失败");
    }
}

const resetUserPassword = async (username, password) => {
    try {
        const response = await request.post('/user/resetPassword', {
            username: username,
            password: password
        });
        if(!response.status)
            console.log("重置密码失败");
        return response;
    }
    catch {
        console.error("重置密码失败");
    }
}

export {postUsername, postUserRegister, postUserLogin, getAllUser, getUserByName, changeUserStatus, deleteUser, editUser, resetUserPassword};