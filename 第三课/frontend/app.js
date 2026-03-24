const { createApp, ref, onMounted, computed } = Vue;

const API_BASE_URL = 'http://localhost:8000/api';

createApp({
    setup() {
        const todos = ref([]);
        const newTodo = ref('');
        const loading = ref(true);
        const currentTab = ref('tasks'); // 'tasks' or 'history'

        const fetchTodos = async () => {
            try {
                loading.value = true;
                const response = await axios.get(`${API_BASE_URL}/todos`);
                todos.value = response.data;
            } catch (error) {
                console.error('获取待办事项失败:', error);
            } finally {
                loading.value = false;
            }
        };

        const addTodo = async () => {
            if (!newTodo.value.trim()) return;
            try {
                const response = await axios.post(`${API_BASE_URL}/todos`, {
                    title: newTodo.value,
                    status: 0
                });
                todos.value.unshift(response.data);
                newTodo.value = '';
            } catch (error) {
                console.error('添加待办事项失败:', error);
            }
        };

        const toggleStatus = async (todo) => {
            const newStatus = todo.status === 0 ? 1 : 0;
            try {
                await axios.put(`${API_BASE_URL}/todos/${todo.id}`, {
                    status: newStatus
                });
                todo.status = newStatus;
            } catch (error) {
                console.error('更新状态失败:', error);
            }
        };

        const deleteTodo = async (id) => {
            if (!confirm('确定要删除这个待办事项吗？')) return;
            try {
                await axios.delete(`${API_BASE_URL}/todos/${id}`);
                todos.value = todos.value.filter(t => t.id !== id);
            } catch (error) {
                console.error('删除失败:', error);
            }
        };

        // 计算每日任务统计
        const historyStats = computed(() => {
            const stats = {};
            todos.value.forEach(todo => {
                // 格式化日期为 YYYY-MM-DD
                const date = new Date(todo.created_at).toLocaleDateString('zh-CN');
                stats[date] = (stats[date] || 0) + 1;
            });
            // 按日期倒序排序
            return Object.fromEntries(
                Object.entries(stats).sort((a, b) => new Date(b[0]) - new Date(a[0]))
            );
        });

        onMounted(fetchTodos);

        return {
            todos,
            newTodo,
            loading,
            currentTab,
            historyStats,
            addTodo,
            toggleStatus,
            deleteTodo
        };
    }
}).mount('#app');
