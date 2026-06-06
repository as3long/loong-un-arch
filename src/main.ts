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
  import '@mdi/font/css/materialdesignicons.css'
  
  const vuetify = createVuetify({
      components,
      directives,
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#1976D2',
              secondary: '#424242',
              surface: '#FFFFFF',
              background: '#F5F5F5',
            }
          },
          dark: {
            dark: true,
            colors: {
              primary: '#90CAF9',
              secondary: '#BDBDBD',
              surface: '#1E1E1E',
              background: '#121212',
            }
          }
        }
      }
    })
    
  
  createApp(App).use(vuetify).mount("#app");
