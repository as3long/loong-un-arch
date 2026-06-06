  <script setup lang="ts">
  import { ref } from "vue";
  import Zip from "./components/Zip.vue";
  import { useTheme } from 'vuetify'
  
  const theme = useTheme()
  const isDark = ref(false)
  
  function toggleTheme() {
    isDark.value = !isDark.value
    theme.global.name.value = isDark.value ? 'dark' : 'light'
  }
  </script>
  
  <template>
    <v-app>
      <v-app-bar flat density="compact" color="primary">
        <v-app-bar-title>
          <v-icon class="mr-2">mdi-archive</v-icon>
          LoongUnArch
        </v-app-bar-title>
        <template v-slot:append>
          <v-btn :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" @click="toggleTheme" variant="text"></v-btn>
        </template>
      </v-app-bar>
      <v-main>
        <Zip />
      </v-main>
    </v-app>
  </template>
