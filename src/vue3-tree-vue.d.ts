declare module 'vue3-tree-vue' {
  import type { PropType, DefineComponent } from 'vue';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface TreeViewItem { [key: string]: any }

  const Vue3TreeVue: DefineComponent<{
    items: { type: PropType<TreeViewItem[]>; required: true };
    isCheckable?: BooleanConstructor;
    hideGuideLines?: BooleanConstructor;
    onDropValidator?: PropType<Function | undefined>;
    treeState?: PropType<any>;
    checkboxStyle?: StringConstructor;
    lazyLoad?: BooleanConstructor;
  }> & {
    install: (app: any) => void;
  };

  export default Vue3TreeVue;
}
