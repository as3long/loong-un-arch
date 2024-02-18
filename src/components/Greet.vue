<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/tauri";

const greetMsg = ref("");
const name = ref("");

async function lzw_decode() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  greetMsg.value = await invoke("lzw_decode", { command: { data: name.value} });
}

async function lzw() {
  greetMsg.value = await invoke("lzw", { command: { data: name.value} });
}

// function onSubmit() {
//   // return false;
// }
</script>

<template>
  <form class="row" @submit.prevent>
    <input id="greet-input" v-model="name" placeholder="Enter a name..." />
    <button v-on:click="lzw_decode">lzw解码</button>
    <button v-on:click="lzw">lzw编码</button>
  </form>

  <p>{{ greetMsg }}</p>
</template>
