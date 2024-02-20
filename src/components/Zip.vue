<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/tauri";
import { TauriEvent, listen } from '@tauri-apps/api/event';
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
const snackbar = ref(false);
const snackbarWarn = ref(false);
const snackbarWarnMsg = ref('');
let fileSuffix: string;
async function open() {
    // await invoke("lzw", { command: { data: 'hello'} });
    // await invoke("log", {str : "这是一个日志"});
    // await invoke("rar_extract", {pathStr: 'C:\\Users\\huoying\\code\\tauri-app\\test\\07_ControlCenter.rar', toPathStr:"../test/demo"});


    let p = await dialog.open({
        multiple: false,
        filters: [{
            name: '压缩文件',
            extensions: ['zip', 'rar']
        }]
    });

    
    if (p) {
        selected.value = p?.toString() || ''
        const arr = selected.value.split('.');
        fileSuffix = arr[arr.length - 1];
        extractPath.value = selected.value.replace(/.(zip|rar)$/, '');
        console.log(selected.value, extractPath.value, arr, fileSuffix)
        if (fileSuffix === 'rar') {
            let list: string = await invoke("rar_list", { pathStr: selected.value })
            // console.log(parseRarList(list))
            desserts.value = parseRarList(list);
        } else if (fileSuffix === 'zip') {
            let list: string = await invoke("zip_list", { pathStr: selected.value })
            // console.log(parseRarList(list))
            desserts.value = parseZipList(list);
        }

        fileItems.value = fileInfoToTree(desserts.value);
        console.log(fileItems.value)
    }
}

async function dropFileHandler(p: string) {
    console.log(TauriEvent.WINDOW_FILE_DROP, p)
    const regex = /.(zip|rar)$/;
    if (regex.test(p)) {
        selected.value = p || '';
        const arr = selected.value.split('.');
        fileSuffix = arr[arr.length - 1];
        extractPath.value = selected.value.replace(/.(zip|rar)$/, '');
        console.log(selected.value, extractPath.value, arr, fileSuffix)
        if (fileSuffix === 'rar') {
            let list: string = await invoke("rar_list", { pathStr: selected.value })
            // console.log(parseRarList(list))
            desserts.value = parseRarList(list);
        } else if (fileSuffix === 'zip') {
            let list: string = await invoke("zip_list", { pathStr: selected.value })
            // console.log(parseRarList(list))
            desserts.value = parseZipList(list);
        }

        fileItems.value = fileInfoToTree(desserts.value);
        console.log(fileItems.value)
    } else {
        snackbarWarnMsg.value = '只支持rar和zip格式的文件';
        snackbarWarn.value = true;
    }
}

listen(TauriEvent.WINDOW_FILE_DROP, async ({ payload }) => {
    if (payload) {
        await throttle(dropFileHandler)((payload as Array<string>)[0])
    }
})

listen('tauri://file-drop-hover', (e) => {
    throttle(() => {
        console.log('tauri://file-drop-hover', e)
    })
    
});

listen('tauri://file-drop-cancelled', (e) => {
    throttle(() => {
        console.log('tauri://file-drop-cancelled', e)
    })
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
    if (num === 0) {
        return ''
    }

    if (num <= 1024) {
        return '1 KB'
    }

    if (num <= 1024 * 1024) {
        return Math.ceil(num / 102.4) / 10 + ' KB';
    }

    return Math.ceil(num / (1024 * 102.4)) / 10 + ' MB';
}


async function extractHandler() {
    console.log(selected.value, extractPath.value)
    if (fileSuffix === 'rar') {
        await invoke("rar_extract", { pathStr: selected.value, toPathStr: extractPath.value });
    } else if (fileSuffix === 'zip') {
        await invoke("zip_extract", { pathStr: selected.value, toPathStr: extractPath.value });
    }
    snackbar.value = true;
}

function hasIcon(type: string) {
    const iconStr = 'mp3, wav, aif, cda, mid, midi, mpa, mkv, ogg, wpa, wpl, 7z, zip, rar, tar.gz, pkg, z, csv, dat, json, xml, dat, db, dbf, sql, ns, 3ds, max, ai, psd, ttf, woff, woff2, png, bmp, jpg, jpeg, gif, tif, tiff, svg, rss, torrent, ppt, pps, pptx, odp, asp, c, cs, java, jsp, swift, php, hh, go, py, js, html, xhtml, css, vb, rb, scss, sass, less, jsx, sh, pl, xls, xlsx, xlsm, ods, dll, bak, ini, dmp, sys, cfg, tmp, icns, doc, docx, log, txt, pdf, avi, mov, mp4, mpg, mpeg, mkv, wmv, wps, exe';
    const list = iconStr.split(', ');

    return list.indexOf(type) > 0
}
</script>

<template>
    <div>
        <div class="fixed-top">
            <v-btn @click="open">打开压缩文件</v-btn>
            <!-- <v-btn @click="openExtraceDialog">解压</v-btn> -->
            <extrace-dialog v-if="!(selected == '')" v-model:path="extractPath" @confirm="extractHandler"></extrace-dialog>
        </div>
        <vue3-tree-vue :items="fileItems" style="width: 100%; display: block; border-right: 1px solid gray;">
            <template v-slot:item-prepend-icon="treeViewItem">
                <img style="scale: 0.8;" src="../assets/folder.svg" alt="folder" 
                    v-if="treeViewItem.type === 'folder'"
                    height="46" width="46">

                <div v-else-if="hasIcon(treeViewItem.type)" style="scale: 0.8;" :class="`fi fi-${treeViewItem.type}`">
                    <div class="fi-content">{{treeViewItem.type}}</div>
                </div>
            </template>
            <template v-slot:item-append="treeViewItem">
                <div class="file-info">
                    <span class="file-size">{{ calcSize(treeViewItem.size) }}</span>

                    <span class="file-time">{{ dayjs(treeViewItem.time).format('YYYY-MM-DD HH:mm:ss') }}</span>
                </div>
            </template>
        </vue3-tree-vue>
        <!-- <v-table fixed-header height="530px">
            <thead>
                <tr>
                    <th class="text-center" width="400px">
                        名称
                    </th>
                    <th class="text-center">
                        大小
                    </th>
                    <th class="text-center">
                        修改日期
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in desserts" :key="item.name">
                    <td class="text-left">{{ item.name }}</td>
                    <td>{{ calcSize(item.size) }}</td>
                    <td>{{ dayjs(item.time).format('YYYY-MM-DD HH:mm:ss') }}</td>
                </tr>
            </tbody>
        </v-table> -->
        <v-snackbar v-model="snackbar" timeout="2000">
            解压成功
            <template v-slot:actions>
                <v-btn color="blue" variant="text" @click="snackbar = false">
                    关闭
                </v-btn>
            </template>
        </v-snackbar>

        <v-snackbar v-model="snackbarWarn" timeout="2000">
            {{ snackbarWarnMsg }}
            <template v-slot:actions>
                <v-btn color="blue" variant="text" @click="snackbarWarn = false">
                    关闭
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>
