<template>
  <div class="editable-container">
    <p id="editable-title">修正文字识别结果</p>
    <a-table :data-source="dataSource" :columns="columns"
      :row-class-name="(record) => (record.isEdited ? 'edited-row' : 'my-table-row')">
      <template #Y_transformed_modified_point="{ text, record }">
        <div class="editable-cell">
          <div v-if="editableData[record.key]" class="editable-cell-input-wrapper">
            <a-input v-model:value="editableData[record.key].Y_transformed_modified_point"
              @pressEnter="save(record.key)" />
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
</template>
<script>
import { computed, defineComponent, reactive, ref, watch,nextTick } from 'vue';
import { CheckOutlined, EditOutlined } from '@ant-design/icons-vue';
import { cloneDeep } from 'lodash-es';
import { useStore } from 'vuex';
export default defineComponent({
  components: {
    CheckOutlined,
    EditOutlined,
  },
  setup() {
    const myStore = useStore()
    
    const columns = [
      {
        title: '组串标号',
        dataIndex: 'Y_transformed_point',
        key: 'Y_transformed_point',
        slots: {
          customRender: 'Y_transformed_point',
        },
        width: 110,
      },
      {
        title: '修正组串标号',
        dataIndex: 'Y_transformed_modified_point',
        key: 'Y_transformed_modified_point',
        slots: {
          customRender: 'Y_transformed_modified_point',
        },
        width: 150,
      },
    ];
    const dataSource = ref([
    ]);
    const count = computed(() => dataSource.value.length);
    const editableData = reactive({});
    const edit = key => {
      editableData[key] = cloneDeep(dataSource.value.filter(item => key === item.key)[0]);
    };
    const save = async key => {
      const editedItem = dataSource.value.find(item => key === item.key);
      if (editedItem) {
        Object.assign(editedItem, editableData[key]);

        // 使用 $nextTick 确保 DOM 更新完成后再进行 watch 监听的数据修改
        await nextTick();
        Object.assign(myStore.state.mergeDisplay.matchModifiedData, {
          [editedItem.key]: editedItem.Y_transformed_modified_point
        });

        editedItem.isEdited = true; // 将 isEdited 设置为 true
        delete editableData[key];
      }
    };

    const handleAdd = (newValue) => {
      const newData = {
        key: newValue.key,
        Y_transformed_point: newValue.Y_transformed_point,
        Y_transformed_modified_point: newValue.Y_transformed_point,
        isEdited: false
      };

      if (newData.key !== undefined) {
        // 使用 some 方法来检查是否已经存在
        const is_in_source = dataSource.value.some(item => item.key === newData.key);

        // 如果不在源数据中，才添加
        if (!is_in_source) {
          dataSource.value.push(newData);
        } else {
          console.warn(`数据项 ${newData.key} 已存在，无法添加。`);
        }
      }
    };

    // watch(() => store.state.matchJSONData, (newValue) => {
    watch(() => myStore.state.mergeDisplay.matchJSONData, (newValue) => {
      dataSource.value = [];
    })

    // watch(() => store.state.matchSelectedConnection, (newValue) => {
    watch(() => myStore.state.mergeDisplay.matchSelectedConnection, (newValue) => {
      handleAdd(newValue);
    }, { immediate: true });

    return {
      columns,
      // onDelete,
      dataSource,
      editableData,
      count,
      edit,
      save,
    };
  },
});
</script>
<style>
.editable-container {
  height: 100%;
  width: 100%;
  background-color: #141414;
  border-radius: 10px;
}

.editable-cell {
  position: relative;

  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 10px;
  }

  .editable-cell-text-wrapper {
    padding: 5px 24px 5px 5px;
  }

  .editable-cell-icon,
  .editable-cell-icon-check {
    position: absolute;
    right: 0;
    width: 20px;
    cursor: pointer;
  }

  .editable-cell-icon {
    margin-top: 4px;
    /* display: none; */
  }

  .editable-cell-icon-check {
    line-height: 28px;
  }

  .editable-cell-icon:hover,
  .editable-cell-icon-check:hover {
    color: #108ee9;
  }

  .editable-add-btn {
    margin-bottom: 8px;
  }
}

.editable-cell:hover .editable-cell-icon {
  display: inline-block;
}

.edited-row {
  background-color: #747474;
  /* 或者任何你喜欢的颜色 */
}

#editable-title {
  font-family: 'PT Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 20.7px;
  text-align: left;
  color: rgba(255, 255, 255, 0.85);
  /* 深色文字，确保在浅色背景上可读性 */
  padding-left: 15px;
  /* padding-top: 15px; */
}
</style>