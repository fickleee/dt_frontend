<template>
  <div class="container">
    <div class="header">
      <a-input-search
        v-model:value="reValue"
        placeholder="输入正则表达式以过滤"
        size="middle"
        @search="onSearch"
        style="width: 53%;"
        >
      </a-input-search>
      <a-switch v-model:checked="checked" /> 
      <span id="reverse-pick">反选</span>
      <a-button class="editable-add-btn" @click="saveToBackend">保存</a-button>
      <a-button class="editable-add-btn" type="primary" @click="updateToBackend">更新</a-button>
    </div>
    <div class="table">
      <a-table bordered :data-source="filteredDataSource" :columns="columns" :row-selection="rowSelection" style="max-height: 100%;">
        <template #ocr="{ text, record }">
          <div class="editable-cell">
            <div v-if="editableData[record.key]" class="editable-cell-input-wrapper">
              <a-input v-model:value="editableData[record.key].ocr" @pressEnter="save(record.key)" />
              <check-outlined class="editable-cell-icon-check" @click="save(record.key)" />
            </div>
            <div v-else class="editable-cell-text-wrapper">
              {{ text || ' ' }}
              <edit-outlined class="editable-cell-icon" @click="edit(record.key)" />
            </div>
          </div>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup> 
import { computed, reactive, ref, watch } from 'vue';
import { CheckOutlined, EditOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { requestMergedLabel, saveMergedLabel, updateMergedLabel } from '@/api/merge/create'; // 引入API请求函数 
import { cloneDeep } from 'lodash-es';

// 定义props
const props = defineProps({
  stationName: String,
  currentValue: String,
  currentBox: Object,
});

const emit = defineEmits(['update-box']);

const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
    },
    onSelect: (record, selected, selectedRows) => {
        if (selectedRows[selectedRows.length - 1]) {
            const currentBox = {
                x1: selectedRows[selectedRows.length - 1].x1,
                y1: selectedRows[selectedRows.length - 1].y1,
                x2: selectedRows[selectedRows.length - 1].x2,
                y2: selectedRows[selectedRows.length - 1].y2,
            }
            emit('update-box', currentBox);
        } else {
            emit('update-box', {
                x1:0,
                y1:0,
                x2:0,
                y2:0
            });
        }
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
        // console.log("onSelectAll: ", selected, selectedRows, changeRows);
    },
};

function convertLabel(label, pattern) {
    try {
        const regex = new RegExp(pattern);
        if (!regex.test(label)) return ''; // 不匹配则返回空
        
        // 提取所有数字部分并转换
        const numbers = label.match(/\d+/g);
        return numbers ? numbers.map(num => parseInt(num, 10)).join('-') : '';
    } catch (e) {
        console.error('正则转换失败:', e);
        return '';
    }
}

// 添加 radio 的响应式变量
const checked = ref(false);
const reValue = ref('');

// 修改过滤数据源的计算属性
const filteredDataSource = computed(() => {
    if (!reValue.value) {
        return dataSource.value; // 如果没有输入正则，返回原始数据
    }

    try {
        const regex = new RegExp(reValue.value);
        return dataSource.value.filter(item => {
            const isMatch = regex.test(item.ocr);
            // 使用 checked 状态决定是否反选
            return checked.value ? !isMatch : isMatch;
        });
    } catch (error) {
        console.error('正则表达式无效:', error);
        return dataSource.value; // 如果正则表达式无效，返回原始数据
    }
});

// 搜索处理函数
const onSearch = (searchValue) => {
    reValue.value = searchValue;
};

const columns = [
    {
        title: 'X',
        dataIndex: 'centerX',
        width: '17%',
    },
    {
        title: 'Y',
        dataIndex: 'centerY',
        width: '17%',
    },
    {
        title: 'ocr',
        dataIndex: 'ocr',
        width: '33%',
        slots: { customRender: 'ocr' },
    },
    {
        title: '转换ocr',
        dataIndex: 'converted_ocr',
        width: '33%',
    }
];

const dataSource = ref([]);
const editableData = reactive({});

const edit = (key) => {
    editableData[key] = cloneDeep(dataSource.value.filter(item => key === item.key)[0]);
};
const save = (key) => {
    Object.assign(dataSource.value.filter(item => key === item.key)[0], editableData[key]);
    delete editableData[key];
};

// 添加保存到后端的函数
const saveToBackend = async () => {
    try {
        // 只发送必要的数据
        const saveData = dataSource.value.map(item => ({
            ocr: item.ocr  // 只发送OCR文本
        }));

        const txtFilename = props.currentValue.replace(/\.jpg$/, '.txt');
        const response = await saveMergedLabel(props.stationName, txtFilename, saveData);
        if (!response) {
            message.error('保存失败: 未获取到响应');
            return;
        }     
        if (response.message === '保存成功') {
            message.success(`保存成功，修改了 ${response.updated_rows} 行数据`);
        }
    } catch (error) {
        console.error('保存数据失败:', error);
        if (error.response?.error) {
            message.error('保存失败: ' + error.response.error);
        } else {
            message.error('保存失败: ' + error.message);
        }
    }
};

const updateToBackend = async () => {
    // 判断输入的正则表达式是否有效
    if (!reValue.value) {
        message.error('请输入有效的正则表达式');
        return;
    }

    try {
        // 只发送必要的数据
        const saveData = dataSource.value.map(item => ({
            ocr: item.converted_ocr  // 只发送OCR文本
        }));

        const txtFilename = props.currentValue.replace(/\.jpg$/, '.txt');
        const response = await updateMergedLabel(props.stationName, txtFilename, saveData);
        if (!response) {
            message.error('更新失败: 未获取到响应');
            return;
        }     
        if (response.message === '保存成功') {
            message.success(`更新成功，修改了 ${response.updated_rows} 行数据`);
        }
    } catch (error) {
        console.error('更新数据失败:', error);
        if (error.response?.error) {
            message.error('更新失败: ' + error.response.error);
        } else {
            message.error('更新失败: ' + error.message);
        }
    }
};

const label2datasource = (text) => {
    if (!text) {
        console.warn('未获取到标签数据');
        dataSource.value = [];
        return;
    }

    const lines = text.split('\n');
    const items = lines
        .filter(line => line.trim())
        .map(line => {
            const parts = line.split(/\s+/);
            if (parts.length < 10) return null;
            
            // 原有字段
            const x1 = parseFloat(parts[0]);
            const y1 = parseFloat(parts[1]);
            const x2 = parseFloat(parts[2]);
            const y2 = parseFloat(parts[3]);
            const ocrText = parts[9];

            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;

            return {
                key: `${centerX}-${centerY}`,
                centerX,
                centerY,
                ocr: ocrText,
                converted_ocr: '', // 初始化为空
                x1,
                y1,
                x2,
                y2,
            };
        })
        .filter(Boolean);

    dataSource.value = items;
}

const convertLabelColumn = (newRegex) => {
    if (!newRegex) {
        // 清空正则时重置 converted_ocr
        dataSource.value.forEach(item => item.converted_ocr = '');
    }

    try {
        dataSource.value.forEach(item => {
            item.converted_ocr = convertLabel(item.ocr, newRegex);
        });
    } catch (e) {
        console.error('正则表达式无效:', e);
        message.error('正则表达式无效');
    }
}

watch(() => props.currentValue, async (newValue) => {
    if (newValue) {
        try {
            const txtFilename = newValue.replace(/\.jpg$/, '.txt');
            const labelData = await requestMergedLabel(props.stationName, txtFilename);
            label2datasource(labelData);

            convertLabelColumn(reValue.value); 
        } catch (error) {
            console.error('获取标签数据失败：', error);
            dataSource.value = [];  // 异常时清空数据
        }
    }
}, { immediate: true });

// 新增：监听正则表达式变化并更新 converted_ocr
watch(reValue, (newRegex) => {
    convertLabelColumn(newRegex);
});

</script>

<style scoped>
.container{
  width: 100%;
  height: 100%;
}
.header{
    width: 100%;
    height: 40px;
    margin-bottom: 5px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}
span[data-v-dbb56153] {
    color: #ff0000
}
#reverse-pick{
    color: #ffffff
}
.table{
    width: 100%;
    height: calc(100% - 40px - 5px);
    border-radius: 15px;
}
</style>