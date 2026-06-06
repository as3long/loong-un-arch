<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/tauri";
import * as OS from '@tauri-apps/api/os';
import { TauriEvent, listen } from '@tauri-apps/api/event';
import { Command } from '@tauri-apps/api/shell';
import * as dialog from '@tauri-apps/api/dialog';
import ExtraceDialog from "./ExtraceDialog.vue";
// import { appDataDir } from '@tauri-apps/api/path';
import dayjs from "dayjs";
import '../tree.css'; 
import Vue3TreeVue from 'vue3-tree-vue';
import {FileInfoNode, fileInfoToTree} from '../utils/path-to-tree';
import pThrottle from 'p-throttle';

const throttle = pThrottle({
	limit: 1,
	interval: 1000
});

  const desserts = ref<FileInfo[]>([])
  const fileItems = ref<FileInfoNode[]>([])
  const loading = ref(false)
  const dragOver = ref(false)
  
  
  /**
 * msdos的时间转换成Date
 * @param time msdos的时间转换成Date
 */
function parseEntryTime(time: string) {
    time = parseInt(time).toString(2);
    if (time.length < 32) {
        time = (new Array(32 - time.length + 1)).join('0') + time;
    }
    const matches = time.match(/(\d{7})(\d{4})(\d{5})(\d{5})(\d{6})(\d{5})/);
    if (!matches) {
        return new Date();
    }
    const vals = matches.slice(1).map((val) => {
        return parseInt(val, 2);
    });
    return new Date(1980 + vals[0], vals[1] - 1, vals[2], vals[3], vals[4], vals[5] * 2);
}

class FileInfo implements FileInfoNode {
    name: string;
    size: number;
    time: Date;
    id: number = 0;
    type: string = '';
    children: FileInfoNode[] = [];

    constructor(name: string, size: number, time: Date) {
        this.name = name;
        this.size = size;
        this.time = time;
    }
}

function parseRarList(listStr: string) {
    const arr = listStr.split(',');
    const out: FileInfo[] = [];
    arr.forEach(item => {
        const fileHeader = item.split('|');
        out.push(new FileInfo(fileHeader[0], parseInt(fileHeader[1], 10), parseEntryTime(fileHeader[2])))
    })
    return out;
}

// function parseZipName(str: string): string {
//     const temp = str.split('+');
//     const arr: number[] = [];
//     temp.forEach(item => {
//         arr.push(parseInt(item, 10))
//     })
//     const gbkDecoder = new TextDecoder('gbk')

//     return gbkDecoder.decode(new Uint8Array(arr))
// }

function parseZipList(listStr: string) {
    const arr = listStr.split(',');
    const out: FileInfo[] = [];
    arr.forEach(item => {
        const fileHeader = item.split('|');
        // console.log(window.gbkconvert(fileHeader[0]))
        console.log(fileHeader)
        out.push(new FileInfo(fileHeader[0], parseInt(fileHeader[1], 10), dayjs(fileHeader[2]).toDate()))
    })
    return out;
}

const selected = ref('');
const extractPath = ref('');
const password = ref('');
const extractDialogOpen = ref(false);
const snackbar = ref(false);
const snackbarWarn = ref(false);
const snackbarWarnMsg = ref('');
const extracting = ref(false);
let fileSuffix: string;

async function loadArchive(path: string) {
    selected.value = path;
    password.value = '';
    const arr = selected.value.split('.');
    fileSuffix = arr[arr.length - 1].toLowerCase();
    extractPath.value = selected.value.replace(/\.(zip|rar)$/i, '');
    loading.value = true;
    try {
        if (fileSuffix === 'rar') {
            const list: string = await invoke("rar_list", { pathStr: selected.value })
            desserts.value = parseRarList(list);
        } else if (fileSuffix === 'zip') {
            const list: string = await invoke("zip_list", { pathStr: selected.value })
            desserts.value = parseZipList(list);
        }
        fileItems.value = fileInfoToTree(desserts.value);
    } catch (error) {
        const errorMessage = String(error);
        snackbarWarnMsg.value = `读取压缩文件失败：${errorMessage}`;
        snackbarWarn.value = true;
        fileItems.value = [];
        if (errorMessage.includes('加密压缩包')) {
            extractDialogOpen.value = true;
        }
    } finally {
        loading.value = false;
    }
}

async function openDialog() {
    const p = await dialog.open({
        multiple: false,
        filters: [{
            name: '压缩文件',
            extensions: ['zip', 'rar']
        }]
    });

    if (p) {
        await loadArchive(p.toString());
    }
}

async function dropFileHandler(p: string) {
    dragOver.value = false;
    const regex = /\.(zip|rar)$/i;
    if (regex.test(p)) {
        await loadArchive(p || '');
    } else {
        snackbarWarnMsg.value = '只支持 rar 和 zip 格式的文件';
        snackbarWarn.value = true;
    }
}

listen(TauriEvent.WINDOW_FILE_DROP, async ({ payload }) => {
    dragOver.value = false;
    if (payload) {
        await throttle(dropFileHandler)((payload as Array<string>)[0])
    }
})

listen('tauri://file-drop-hover', () => {
    dragOver.value = true;
});

listen('tauri://file-drop-cancelled', () => {
    dragOver.value = false;
});

declare global {
  interface Window {
    openedUrls: string;
  }
}

onMounted(() => {
    if (window.openedUrls) {
        console.log(window.openedUrls)
        dropFileHandler(window.openedUrls)
    }
});

function calcSize(num: number) {
    if (!num) {
        return ''
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = num;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size = size / 1024;
        unitIndex += 1;
    }

    return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function formatTime(time: Date) {
    return dayjs(time).format('YYYY-MM-DD HH:mm');
}

function cancelExtractHandler() {
    snackbarWarnMsg.value = '已取消解压';
    snackbarWarn.value = true;
}

async function extractHandler() {
    extracting.value = true;
    try {
        const extractPassword = password.value || null;
        if (fileSuffix === 'rar') {
            await invoke("rar_extract", { pathStr: selected.value, toPathStr: extractPath.value, password: extractPassword });
        } else if (fileSuffix === 'zip') {
            await invoke("zip_extract", { pathStr: selected.value, toPathStr: extractPath.value, password: extractPassword });
        }
        snackbar.value = true;
    } catch (error) {
        snackbarWarnMsg.value = `解压失败：${String(error)}`;
        snackbarWarn.value = true;
    } finally {
        extracting.value = false;
    }
}

function hasIcon(type: string) {
    const iconStr = 'mp3, wav, aif, cda, mid, midi, mpa, mkv, ogg, wpa, wpl, 7z, zip, rar, tar.gz, pkg, z, csv, dat, json, xml, dat, db, dbf, sql, ns, 3ds, max, ai, psd, ttf, woff, woff2, png, bmp, jpg, jpeg, gif, tif, tiff, svg, rss, torrent, ppt, pps, pptx, odp, asp, c, cs, java, jsp, swift, php, hh, go, py, js, html, xhtml, css, vb, rb, scss, sass, less, jsx, sh, pl, xls, xlsx, xlsm, ods, dll, bak, ini, dmp, sys, cfg, tmp, icns, doc, docx, log, txt, pdf, avi, mov, mp4, mpg, mpeg, mkv, wmv, wps, exe';
    const list = iconStr.split(', ');

    return list.indexOf(type) >= 0
}

async function openFolder(path: string) {
    console.log(path, `explorer /select,"${path}"`)
    const osType = await OS.type()
    
    switch (osType) {
        case 'Windows_NT':
            const explorerCommand = new Command('explorer-select', ['/select,', `${path}`])
            await explorerCommand.spawn()
            break;
        case 'Darwin':
            const macOpenCommand = new Command('mac-open', ['-R', `${path}`])
            await macOpenCommand.spawn()
            break;
        default:
            break;
    }
}

</script>

<template>
    <v-container fluid class="pa-4 pa-md-6">
        <v-card class="app-card" elevation="3">
            <v-card-text>
                <div class="d-flex flex-wrap align-center ga-3 mb-4">
                    <v-btn color="primary" variant="flat" prepend-icon="mdi-folder-open" :loading="loading" @click="openDialog">
                        打开压缩文件
                    </v-btn>
                    <extrace-dialog
                        v-if="selected"
                        v-model:open="extractDialogOpen"
                        v-model:path="extractPath"
                        v-model:password="password"
                        @confirm="extractHandler"
                        @cancel="cancelExtractHandler"
                    ></extrace-dialog>
                    <span v-if="selected" class="text-body-2 text-medium-emphasis text-truncate selected-path">
                        {{ selected }}
                    </span>
                </div>

                <div class="drop-zone" :class="{ 'drag-over': dragOver }" @click="openDialog">
                    <v-icon class="drop-zone-icon" color="primary">mdi-cloud-upload-outline</v-icon>
                    <div class="text-h6">拖拽 ZIP / RAR 文件到这里</div>
                    <div class="text-body-2 text-medium-emphasis">或点击选择本地压缩文件</div>
                </div>

                <v-expand-transition>
                    <div v-if="extracting" class="extract-progress mb-4">
                        <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-body-2">正在解压到：{{ extractPath }}</span>
                            <v-progress-circular indeterminate color="primary" size="20" width="2"></v-progress-circular>
                        </div>
                        <v-progress-linear indeterminate color="primary" rounded></v-progress-linear>
                    </div>
                </v-expand-transition>

                <div v-if="loading" class="loading-overlay">
                    <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
                    <span class="text-body-1 text-medium-emphasis">正在读取压缩文件...</span>
                </div>

                <div v-else-if="fileItems.length === 0" class="empty-state">
                    <div class="empty-state-icon">
                        <v-icon size="64" color="grey-lighten-1">mdi-archive-outline</v-icon>
                    </div>
                    <div class="text-h6 text-medium-emphasis mb-1">还没有打开压缩文件</div>
                    <div class="text-body-2 text-medium-emphasis">支持 .zip 和 .rar 文件预览与解压</div>
                </div>

                <div v-else class="tree-container">
                    <vue3-tree-vue :items="fileItems" style="width: 100%; display: block;">
                        <template v-slot:item-prepend-icon="treeViewItem">
                            <img src="../assets/folder.svg" alt="folder"
                                v-if="treeViewItem.type === 'folder'"
                                height="24" width="24">

                            <div v-else-if="hasIcon(treeViewItem.type)" style="margin: -8px 0; scale: 0.6;" :class="`fi fi-${treeViewItem.type}`">
                                <div class="fi-content">{{treeViewItem.type}}</div>
                            </div>
                            <v-icon v-else size="22" color="grey">mdi-file-outline</v-icon>
                        </template>
                        <template v-slot:item-append="treeViewItem">
                            <div class="file-info">
                                <span class="file-size">{{ calcSize(treeViewItem.size) }}</span>
                                <span class="file-time">{{ formatTime(treeViewItem.time) }}</span>
                            </div>
                        </template>
                    </vue3-tree-vue>
                </div>
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar" timeout="4000" color="success" class="success-snackbar">
            <v-icon start>mdi-check-circle</v-icon>
            <span>解压成功</span>
            <template v-slot:actions>
                <v-btn color="white" size="small" variant="flat" @click="openFolder(extractPath)">
                    打开解压目录
                </v-btn>
                <v-btn color="white" variant="text" @click="snackbar = false">
                    关闭
                </v-btn>
            </template>
        </v-snackbar>

        <v-snackbar v-model="snackbarWarn" timeout="3000" color="warning">
            <v-icon start>mdi-alert-circle</v-icon>
            <span>{{ snackbarWarnMsg }}</span>
            <template v-slot:actions>
                <v-btn color="white" variant="text" @click="snackbarWarn = false">
                    关闭
                </v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>
