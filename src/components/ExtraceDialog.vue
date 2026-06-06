<script setup lang="ts">
    import * as dialog from '@tauri-apps/api/dialog';

    const showTxt = '解压';
    const open = defineModel<boolean>('open', { default: false })
    const extractPath = defineModel<string>('path', {default: ''})
    const password = defineModel<string>('password', { default: '' })
    const emit = defineEmits(['confirm', 'cancel', 'update:path'])

    async function openExtraceDialog() {
        // TODO 弹出解压弹窗
        // 路径选择框
        // 确定按钮
        const selected = await dialog.open({
            multiple: false,
            directory:true,
        });
        emit('update:path', selected?.toString() || '');
    }

    
</script>
<template>
    <v-dialog width="560" v-model="open">
        <template v-slot:activator="{ props }">
            <v-btn color="secondary" variant="tonal" prepend-icon="mdi-archive-arrow-down" v-bind="props" :text="showTxt"></v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card rounded="lg">
                <v-card-title class="d-flex align-center ga-2">
                    <v-icon color="primary">mdi-archive-arrow-down-outline</v-icon>
                    解压文件
                </v-card-title>
                <v-card-text>
                    <v-text-field label="解压路径" v-model="extractPath" variant="outlined" density="comfortable"></v-text-field>
                    <v-btn color="primary" variant="tonal" prepend-icon="mdi-folder-search" text="选择路径" @click="openExtraceDialog"></v-btn>
                    <v-text-field class="mt-4" label="密码（可选）" v-model="password" type="password" variant="outlined" density="comfortable" clearable></v-text-field>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="flat" text="确定" @click="() => { emit('confirm'); isActive.value = false }"></v-btn>
                    <v-btn variant="text" text="取消" @click="() => { isActive.value = false; emit('cancel') }"></v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>