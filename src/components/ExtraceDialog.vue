<script setup lang="ts">
    import { defineModel } from "vue";
    import * as dialog from '@tauri-apps/api/dialog';

    const showTxt = '解压';
    const extractPath = defineModel<string>('path', {default: ''})
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
    <v-dialog width="500">
            <template v-slot:activator="{ props }">
                <v-btn color="cyan-darken-1" v-bind="props" :text="showTxt"> </v-btn>
            </template>

            <template v-slot:default="{ isActive }">
                <v-card title="解压文件">
                    <v-card-text>
                        <v-text-field label="解压路径" v-model="extractPath"></v-text-field>
                        <v-btn color="cyan-darken-1" text="选择路径" @click="openExtraceDialog"></v-btn>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>

                        <v-btn text="确定" @click="() => { emit('confirm'); isActive.value = false}"></v-btn>
                        <v-btn text="取消" @click="isActive.value = false && emit('cancel')"></v-btn>
                    </v-card-actions>
                </v-card>
            </template>
        </v-dialog>
</template>