import { createApp } from "vue";
import "./styles.css";
import "css-file-icons";
import App from "./App.vue";
import VConsole from 'vconsole';

new VConsole();

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
    components,
    directives,
  })
  

createApp(App).use(vuetify).mount("#app");
