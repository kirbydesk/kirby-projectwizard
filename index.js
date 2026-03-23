(function() {
  "use strict";
  function normalizeComponent(scriptExports, render, staticRenderFns, functionalTemplate, injectStyles, scopeId, moduleIdentifier, shadowMode) {
    var options = typeof scriptExports === "function" ? scriptExports.options : scriptExports;
    if (render) {
      options.render = render;
      options.staticRenderFns = staticRenderFns;
      options._compiled = true;
    }
    return {
      exports: scriptExports,
      options
    };
  }
  const _sfc_main$8 = {
    props: {
      blockType: {
        type: String,
        default: null
      }
    },
    data() {
      return {
        loading: true,
        blocks: [],
        activeBlocks: [],
        activeTab: "global",
        globalActiveTab: "blocks",
        blockConfigs: {},
        blockOverrides: {},
        originalOverrides: {},
        originalActiveBlocks: [],
        dirtyTabs: {},
        snapshots: {},
        writerActive: {},
        blockViewTab: "settings",
        globalDefaults: {},
        globalOverrides: {},
        originalGlobalOverrides: {},
        fontsData: {},
        fontDefaults: {},
        fontOverrides: {},
        originalFontOverrides: {},
        elementDefaults: {},
        elementOverrides: {},
        originalElementOverrides: {},
        navDefaults: {},
        navOverrides: {},
        originalNavOverrides: {},
        footerDefaults: {},
        footerOverrides: {},
        originalFooterOverrides: {}
      };
    },
    computed: {
      hasStoredOverrides() {
        if (this.activeTab === "global") {
          if (this.globalActiveTab === "global") return Object.keys(this.originalGlobalOverrides).length > 0;
          if (this.globalActiveTab === "elements") return Object.keys(this.originalElementOverrides).length > 0 || Object.keys(this.originalFontOverrides).length > 0;
          if (this.globalActiveTab === "elements") return Object.keys(this.originalElementOverrides).length > 0;
          if (this.globalActiveTab === "header") return Object.keys(this.originalNavOverrides).length > 0;
          if (this.globalActiveTab === "footer") return Object.keys(this.originalFooterOverrides).length > 0;
        } else if (this.activeTab && this.originalOverrides[this.activeTab]) {
          return Object.keys(this.originalOverrides[this.activeTab]).length > 0;
        }
        return false;
      },
      bodyDefaultFont() {
        const groups = this.globalDefaults || {};
        let def = "Inter";
        for (const group of Object.values(groups)) {
          if (group && group.vars && group.vars["font-family-default"]) {
            def = group.vars["font-family-default"].value || def;
          }
        }
        const ov = this.globalOverrides && this.globalOverrides["global"];
        return ov && ov["font-family-default"] || def;
      },
      isDirty() {
        if (this.activeTab === "global") {
          return this.dirtyTabs["global"] || this.dirtyTabs[this.globalActiveTab] || this.dirtyTabs[this.globalActiveTab + "-settings"];
        }
        return this.dirtyTabs[this.activeTab];
      }
    },
    watch: {
      blockType: {
        immediate: true,
        handler(val) {
          this.activeTab = val || "global";
        }
      }
    },
    async created() {
      await this.load();
      this._onKeydown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          if (this.isDirty) {
            this.saveCurrentView();
          }
        }
      };
      window.addEventListener("keydown", this._onKeydown);
    },
    beforeDestroy() {
      window.removeEventListener("keydown", this._onKeydown);
    },
    methods: {
      async load() {
        try {
          const res = await this.$api.get("projectwizard/blocks");
          this.blocks = res.blocks || [];
          this.activeBlocks = res.activeBlocks || [];
          this.originalActiveBlocks = [...this.activeBlocks];
          this.$set(this.snapshots, "global", JSON.stringify(this.activeBlocks));
          for (const block of this.blocks) {
            const config = await this.$api.get("projectwizard/block/" + block.blockType);
            this.$set(this.blockConfigs, block.blockType, config);
            const overrides = config.overrides && !Array.isArray(config.overrides) ? config.overrides : {};
            this.$set(this.blockOverrides, block.blockType, JSON.parse(JSON.stringify(overrides)));
            this.$set(this.originalOverrides, block.blockType, JSON.parse(JSON.stringify(overrides)));
            this.$set(this.snapshots, block.blockType, JSON.stringify(overrides));
          }
          const globalData = await this.$api.get("projectwizard/global");
          this.globalDefaults = globalData.defaults || {};
          const globalOv = globalData.overrides && !Array.isArray(globalData.overrides) ? globalData.overrides : {};
          this.globalOverrides = JSON.parse(JSON.stringify(globalOv));
          this.originalGlobalOverrides = JSON.parse(JSON.stringify(globalOv));
          this.$set(this.snapshots, "global-settings", JSON.stringify(globalOv));
          const fonts = await this.$api.get("projectwizard/fontsizes");
          this.fontDefaults = fonts.defaults || {};
          const fontOv = fonts.overrides && !Array.isArray(fonts.overrides) ? fonts.overrides : {};
          this.fontOverrides = JSON.parse(JSON.stringify(fontOv));
          this.originalFontOverrides = JSON.parse(JSON.stringify(fontOv));
          this.$set(this.snapshots, "fontsizes", JSON.stringify(fontOv));
          const elems = await this.$api.get("projectwizard/elements");
          this.elementDefaults = elems.defaults || {};
          const elemOv = elems.overrides && !Array.isArray(elems.overrides) ? elems.overrides : {};
          this.elementOverrides = JSON.parse(JSON.stringify(elemOv));
          this.originalElementOverrides = JSON.parse(JSON.stringify(elemOv));
          this.$set(this.snapshots, "elements", JSON.stringify(elemOv));
          await this.loadFontsData();
          const navData = await this.$api.get("projectwizard/navigation");
          this.navDefaults = navData.defaults || {};
          const navOv = navData.overrides && !Array.isArray(navData.overrides) ? navData.overrides : {};
          this.navOverrides = JSON.parse(JSON.stringify(navOv));
          this.originalNavOverrides = JSON.parse(JSON.stringify(navOv));
          this.$set(this.snapshots, "header", JSON.stringify(navOv));
          const footerData = await this.$api.get("projectwizard/footer");
          this.footerDefaults = footerData.defaults || {};
          const footerOv = footerData.overrides && !Array.isArray(footerData.overrides) ? footerData.overrides : {};
          this.footerOverrides = JSON.parse(JSON.stringify(footerOv));
          this.originalFooterOverrides = JSON.parse(JSON.stringify(footerOv));
          this.$set(this.snapshots, "footer", JSON.stringify(footerOv));
          this.loading = false;
        } catch (e) {
          console.error("Failed to load", e);
        }
      },
      blockLabel(blockType) {
        const block = this.blocks.find((b) => b.blockType === blockType);
        if (block) {
          const translated = this.$t(block.plugin + ".name");
          if (translated && translated !== block.plugin + ".name") return translated;
        }
        const name = blockType.replace(/^pw/, "").replace(/([A-Z])/g, " $1").trim() || blockType;
        return name.charAt(0).toUpperCase() + name.slice(1);
      },
      // --- Global: Elements ---
      toggleBlock(blockType, checked) {
        const block = this.blocks.find((b) => b.blockType === blockType);
        if (block) block.active = checked;
        if (checked) {
          if (!this.activeBlocks.includes(blockType)) this.activeBlocks.push(blockType);
        } else {
          this.activeBlocks = this.activeBlocks.filter((b) => b !== blockType);
        }
        this.$set(this.dirtyTabs, "global", JSON.stringify(this.activeBlocks) !== this.snapshots["global"]);
      },
      // --- Global: Settings ---
      onGlobalOverridesUpdate(overrides) {
        this.globalOverrides = overrides;
        this.$set(this.dirtyTabs, "global-settings", JSON.stringify(this.globalOverrides) !== this.snapshots["global-settings"]);
      },
      // --- Global: Fonts ---
      onFontOverridesUpdate(overrides) {
        this.fontOverrides = overrides;
        this.updateElementsDirty();
      },
      updateElementsDirty() {
        const elemDirty = JSON.stringify(this.elementOverrides) !== this.snapshots["elements"];
        const fontDirty = JSON.stringify(this.fontOverrides) !== this.snapshots["fontsizes"];
        this.$set(this.dirtyTabs, "elements", elemDirty || fontDirty);
      },
      async saveFonts() {
        try {
          const res = await this.$api.post("projectwizard/fontsizes", this.fontOverrides);
          this.fontOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.originalFontOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.snapshots, "fontsizes", JSON.stringify(this.safeOverrides(res.overrides)));
        } catch (e) {
          this.$panel.notification.error("Failed to save font sizes");
        }
      },
      // --- Global: Footer ---
      onFooterOverridesUpdate(overrides) {
        this.footerOverrides = overrides;
        this.$set(this.dirtyTabs, "footer", JSON.stringify(this.footerOverrides) !== this.snapshots["footer"]);
      },
      async saveFooter() {
        try {
          const res = await this.$api.post("projectwizard/footer", this.footerOverrides);
          const ov = this.safeOverrides(res.overrides);
          this.footerOverrides = JSON.parse(JSON.stringify(ov));
          this.originalFooterOverrides = JSON.parse(JSON.stringify(ov));
          this.$set(this.snapshots, "footer", JSON.stringify(ov));
          this.$set(this.dirtyTabs, "footer", false);
          this.$panel.notification.success("Footer settings saved");
        } catch (e) {
          this.$panel.notification.error("Failed to save footer settings");
        }
      },
      // --- Global: Elements ---
      onElementOverridesUpdate(overrides) {
        this.elementOverrides = overrides;
        this.updateElementsDirty();
      },
      async saveElements() {
        try {
          const res = await this.$api.post("projectwizard/elements", this.elementOverrides);
          this.elementOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.originalElementOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.snapshots, "elements", JSON.stringify(this.safeOverrides(res.overrides)));
          await this.saveFonts();
          this.$set(this.dirtyTabs, "elements", false);
          this.$panel.notification.success("Elements settings saved");
        } catch (e) {
          this.$panel.notification.error("Failed to save elements settings");
        }
      },
      // --- Global: Fonts ---
      async loadFontsData() {
        try {
          this.fontsData = await this.$api.get("projectwizard/fonts");
        } catch (e) {
          console.error("Failed to load fonts", e);
        }
      },
      // --- Global: Navigation ---
      onNavOverridesUpdate(overrides) {
        this.navOverrides = overrides;
        this.$set(this.dirtyTabs, "header", JSON.stringify(this.navOverrides) !== this.snapshots["header"]);
      },
      async saveNavigation() {
        try {
          const res = await this.$api.post("projectwizard/navigation", this.navOverrides);
          this.navOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.originalNavOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.snapshots, "header", JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.dirtyTabs, "header", false);
          this.$panel.notification.success("Header settings saved");
        } catch (e) {
          this.$panel.notification.error("Failed to save header settings");
        }
      },
      // --- Block overrides ---
      onBlockOverridesUpdate(blockType, overrides) {
        this.$set(this.blockOverrides, blockType, overrides);
        const current = JSON.stringify(overrides);
        const snapshot = this.snapshots[blockType] || "{}";
        this.$set(this.dirtyTabs, blockType, current !== snapshot);
        const config = this.blockConfigs[blockType];
        if (config) config.hasOverrides = Object.keys(overrides || {}).length > 0;
      },
      // --- Save / Discard ---
      async resetCurrentView() {
        const name = this.activeTab === "global" ? this.$t("prw.tab." + this.globalActiveTab) || this.globalActiveTab : this.blockLabel(this.activeTab);
        try {
          await new Promise((resolve, reject) => {
            this.$panel.dialog.open({
              component: "k-text-dialog",
              props: {
                text: 'Reset "' + name + '" to defaults? All saved overrides for this section will be removed.',
                submitBtn: {
                  text: "Reset",
                  icon: "undo",
                  theme: "negative"
                }
              },
              on: {
                submit: () => {
                  this.$panel.dialog.close();
                  resolve();
                },
                cancel: () => reject()
              }
            });
          });
        } catch (e) {
          return;
        }
        if (this.activeTab === "global") {
          if (this.globalActiveTab === "global") {
            this.globalOverrides = {};
            await this.saveGlobalSettings();
          } else if (this.globalActiveTab === "elements") {
            this.elementOverrides = {};
            this.fontOverrides = {};
            await this.saveElements();
          } else if (this.globalActiveTab === "header") {
            this.navOverrides = {};
            await this.saveNavigation();
          } else if (this.globalActiveTab === "footer") {
            this.footerOverrides = {};
            await this.saveFooter();
          }
        } else {
          await this.resetBlock(this.activeTab);
        }
      },
      async saveCurrentView() {
        if (this.activeTab === "global") {
          if (this.globalActiveTab === "global") {
            await this.saveGlobalSettings();
          } else if (this.globalActiveTab === "elements") {
            await this.saveElements();
          } else if (this.globalActiveTab === "header") {
            await this.saveNavigation();
          } else if (this.globalActiveTab === "footer") {
            await this.saveFooter();
          } else {
            await this.saveGlobal();
          }
        } else {
          await this.saveBlock(this.activeTab);
        }
        try {
          fetch(window.location.origin, { cache: "no-store" });
        } catch (e) {
        }
      },
      discardChanges() {
        if (this.activeTab === "global") {
          if (this.globalActiveTab === "global") {
            this.globalOverrides = JSON.parse(JSON.stringify(this.originalGlobalOverrides));
            this.$set(this.dirtyTabs, "global-settings", false);
          } else if (this.globalActiveTab === "elements") {
            this.elementOverrides = JSON.parse(JSON.stringify(this.originalElementOverrides));
            this.fontOverrides = JSON.parse(JSON.stringify(this.originalFontOverrides));
            this.$set(this.dirtyTabs, "elements", false);
          } else if (this.globalActiveTab === "header") {
            this.navOverrides = JSON.parse(JSON.stringify(this.originalNavOverrides));
            this.$set(this.dirtyTabs, "header", false);
          } else if (this.globalActiveTab === "footer") {
            this.footerOverrides = JSON.parse(JSON.stringify(this.originalFooterOverrides));
            this.$set(this.dirtyTabs, "footer", false);
          } else {
            this.activeBlocks = [...this.originalActiveBlocks];
            for (const block of this.blocks) {
              block.active = this.activeBlocks.includes(block.blockType);
            }
            this.$set(this.dirtyTabs, "global", false);
          }
        } else {
          const bt = this.activeTab;
          this.$set(this.blockOverrides, bt, JSON.parse(JSON.stringify(this.originalOverrides[bt] || {})));
          this.$set(this.dirtyTabs, this.activeTab, false);
        }
      },
      async saveGlobal() {
        try {
          await this.$api.post("projectwizard/blocks/active", { blocks: this.activeBlocks });
          this.originalActiveBlocks = [...this.activeBlocks];
          this.$set(this.snapshots, "global", JSON.stringify(this.activeBlocks));
          this.$set(this.dirtyTabs, "global", false);
          this.$panel.notification.success("Blocks settings saved");
        } catch (e) {
          this.$panel.notification.error("Failed to save blocks settings");
        }
      },
      async saveGlobalSettings() {
        try {
          const res = await this.$api.post("projectwizard/global", this.globalOverrides);
          this.globalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.originalGlobalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.snapshots, "global-settings", JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.dirtyTabs, "global-settings", false);
          this.$panel.notification.success("Global settings saved");
        } catch (e) {
          this.$panel.notification.error("Failed to save global settings");
        }
      },
      async saveBlock(blockType) {
        try {
          const res = await this.$api.post(
            "projectwizard/block/" + blockType,
            this.blockOverrides[blockType] || {}
          );
          this.$set(this.blockConfigs, blockType, res);
          this.$set(this.blockOverrides, blockType, JSON.parse(JSON.stringify(this.safeOverrides(res.overrides))));
          this.$set(this.originalOverrides, blockType, JSON.parse(JSON.stringify(this.safeOverrides(res.overrides))));
          const block = this.blocks.find((b) => b.blockType === blockType);
          if (block) block.customized = Object.keys(this.safeOverrides(res.overrides)).length > 0;
          this.$set(this.snapshots, blockType, JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.dirtyTabs, blockType, false);
          this.$panel.notification.success(this.blockLabel(blockType) + " settings saved");
        } catch (e) {
          this.$panel.notification.error("Failed to save " + this.blockLabel(blockType) + " settings");
        }
      },
      async resetBlock(blockType) {
        try {
          const res = await this.$api.post("projectwizard/block/" + blockType + "/reset");
          this.$set(this.blockConfigs, blockType, res);
          this.$set(this.blockOverrides, blockType, {});
          this.$set(this.originalOverrides, blockType, {});
          this.$set(this.snapshots, blockType, "{}");
          this.$set(this.dirtyTabs, blockType, false);
          const block = this.blocks.find((b) => b.blockType === blockType);
          if (block) block.customized = false;
          this.$panel.notification.success(this.blockLabel(blockType) + " reset to defaults");
        } catch (e) {
          this.$panel.notification.error("Failed to reset " + this.blockLabel(blockType) + " settings");
        }
      },
      safeOverrides(ov) {
        return ov && !Array.isArray(ov) ? ov : {};
      }
    }
  };
  var _sfc_render$8 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-panel-inside", { staticClass: "pw-wizard" }, [_c("k-header", { scopedSlots: _vm._u([_vm.isDirty || _vm.hasStoredOverrides ? { key: "buttons", fn: function() {
      return [_c("div", { staticClass: "k-form-controls" }, [_c("div", { staticClass: "k-button-group", attrs: { "data-layout": "collapsed" } }, [_vm.hasStoredOverrides && !_vm.isDirty ? _c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": "Reset " + (_vm.activeTab === "global" ? _vm.$t("prw.tab." + _vm.globalActiveTab) || _vm.globalActiveTab : _vm.blockLabel(_vm.activeTab)) + " Settings", "icon": "undo", "variant": "filled", "size": "sm", "responsive": "true" }, on: { "click": _vm.resetCurrentView } }) : _vm._e(), _vm.isDirty ? _c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": "Discard", "icon": "undo", "theme": "notice", "variant": "filled", "size": "sm", "responsive": "true" }, on: { "click": _vm.discardChanges } }) : _vm._e(), _vm.isDirty ? _c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": "Save", "icon": "check", "theme": "notice", "variant": "filled", "size": "sm" }, on: { "click": _vm.saveCurrentView } }) : _vm._e()], 1)])];
    }, proxy: true } : null], null, true) }, [_vm._v(" " + _vm._s(_vm.blockType ? _vm.blockLabel(_vm.blockType) : "Project Wizard") + " ")]), !_vm.loading && _vm.activeTab === "global" ? _c("nav", { staticClass: "k-tabs k-model-tabs" }, _vm._l([
      { key: "blocks", icon: "dashboard" },
      { key: "global", icon: "globe" },
      { key: "elements", icon: "layers" },
      { key: "header", icon: "header" },
      { key: "footer", icon: "footer" }
    ], function(tab) {
      return _c("button", { key: tab.key, staticClass: "k-tabs-button k-button", attrs: { "type": "button", "aria-current": _vm.globalActiveTab === tab.key ? "true" : null, "data-has-icon": "true", "data-has-text": "true", "data-variant": "dimmed" }, on: { "click": function($event) {
        _vm.globalActiveTab = tab.key;
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": tab.icon } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab." + tab.key)))])]);
    }), 0) : _vm._e(), _vm.loading ? _c("div", { staticClass: "pw-wizard-loading" }, [_vm._v("Loading...")]) : _c("div", { staticClass: "pw-wizard-content" }, [_vm.activeTab === "global" ? _c("div", { staticClass: "pw-wizard-panel" }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "blocks", expression: "globalActiveTab === 'blocks'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-elements", { attrs: { "blocks": _vm.blocks }, on: { "toggle": function($event) {
      return _vm.toggleBlock($event.blockType, $event.checked);
    } } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "global", expression: "globalActiveTab === 'global'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } }), _c("pw-global-font-manager", { attrs: { "fonts": _vm.fontsData }, on: { "update": _vm.loadFontsData } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "elements", expression: "globalActiveTab === 'elements'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-elements-styles", { attrs: { "element-defaults": _vm.elementDefaults, "element-overrides": _vm.elementOverrides, "fonts": _vm.fontsData, "font-defaults": _vm.fontDefaults, "font-overrides": _vm.fontOverrides, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onElementOverridesUpdate, "update:font-overrides": _vm.onFontOverridesUpdate } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "header", expression: "globalActiveTab === 'header'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onNavOverridesUpdate } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "footer", expression: "globalActiveTab === 'footer'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.footerDefaults, "nav-overrides": _vm.footerOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onFooterOverridesUpdate } })], 1)]) : _vm._e(), _vm._l(_vm.blocks, function(block) {
      return _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === block.blockType, expression: "activeTab === block.blockType" }], key: block.blockType, staticClass: "pw-wizard-panel" }, [_vm.blockConfigs[block.blockType] ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.blockViewTab === "settings", expression: "blockViewTab === 'settings'" }] }, [_c("pw-block-settings", { attrs: { "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1) : _vm._e()]);
    })], 2)], 1);
  };
  var _sfc_staticRenderFns$8 = [];
  _sfc_render$8._withStripped = true;
  var __component__$8 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$8,
    _sfc_render$8,
    _sfc_staticRenderFns$8
  );
  __component__$8.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/Overview.vue";
  const Overview = __component__$8.exports;
  const _sfc_main$7 = {
    props: {
      uid: String,
      label: String,
      allOptions: Array,
      activeOptions: Array,
      currentDefault: String,
      pluginDefault: String,
      enabled: { type: Boolean, default: true },
      modified: { type: Boolean, default: false },
      noDefault: { type: Boolean, default: false },
      noCheckbox: { type: Boolean, default: false },
      required: { type: Boolean, default: false }
    },
    data() {
      return {
        active: this.activeOptions && this.activeOptions.length > 0,
        touched: this.modified,
        localDefault: null,
        localActive: [...this.activeOptions || []]
      };
    },
    watch: {
      modified(val) {
        if (!val) {
          this.touched = false;
          this.localDefault = null;
          this.localActive = [...this.activeOptions || []];
          this.active = this.activeOptions && this.activeOptions.length > 0;
        }
      },
      activeOptions(newVal) {
        this.localActive = [...newVal || []];
        this.active = newVal && newVal.length > 0;
      }
    },
    methods: {
      toggleActive(checked) {
        this.active = checked;
        if (!checked) {
          this.$emit("update:options", null);
        } else {
          this.$emit("update:options", this.allOptions);
        }
      },
      propertyLabel(key) {
        const tKey = "prw.property." + key;
        const translated = this.$t(tKey);
        return translated && translated !== tKey ? translated : key;
      },
      optionLabel(opt) {
        const prwKey = "prw.option." + opt;
        const prwTranslated = this.$t(prwKey);
        if (prwTranslated && prwTranslated !== prwKey) return prwTranslated;
        const pwKey = "pw.option." + opt;
        const pwTranslated = this.$t(pwKey);
        if (pwTranslated && pwTranslated !== pwKey) return pwTranslated;
        const prefixes = ["multicolumn"];
        for (const prefix of prefixes) {
          if (opt.startsWith(prefix)) {
            const subKey = "kirbyblock-" + prefix + ".sub." + opt.slice(prefix.length);
            const subTranslated = this.$t(subKey);
            if (subTranslated && subTranslated !== subKey) return subTranslated;
          }
        }
        return opt;
      },
      handleClick(opt) {
        if (this.noDefault) {
          if (!this.touched) {
            this.touched = true;
            this.localActive = [opt];
          } else {
            const isActive2 = this.localActive.includes(opt);
            if (isActive2) {
              const updated = this.localActive.filter((o) => o !== opt);
              if (updated.length === 0) {
                if (this.required) return;
                this.touched = false;
                this.localActive = [...this.allOptions];
                this.$emit("update:options", this.allOptions);
                return;
              }
              this.localActive = updated;
            } else {
              this.localActive = this.allOptions.filter(
                (o) => this.localActive.includes(o) || o === opt
              );
            }
          }
          this.$emit("update:options", this.localActive);
          return;
        }
        if (!this.touched) {
          this.touched = true;
          this.localActive = [opt];
          this.$emit("update:options", [opt]);
          return;
        }
        const isActive = this.localActive.includes(opt);
        const isLocalDefault = opt === this.localDefault;
        if (!isActive) {
          const updated = this.allOptions.filter(
            (o) => this.localActive.includes(o) || o === opt
          );
          this.localActive = updated;
          this.$emit("update:options", updated);
        } else if (isActive && !isLocalDefault) {
          this.localDefault = opt;
          this.$emit("update:default", opt);
        } else if (isActive && isLocalDefault) {
          const updated = this.localActive.filter((o) => o !== opt);
          if (updated.length === 0) {
            this.touched = false;
            this.localDefault = null;
            this.localActive = [...this.allOptions];
            this.$emit("update:options", []);
            return;
          }
          this.localDefault = null;
          this.localActive = updated;
          this.$emit("update:options", updated);
        }
      }
    }
  };
  var _sfc_render$7 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row", class: { "is-disabled": !_vm.enabled, "is-modified": _vm.modified || _vm.touched } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [!_vm.noCheckbox ? _c("input", { staticClass: "pw-field-row-check", attrs: { "id": "pw-prop-" + _vm.uid, "type": "checkbox" }, domProps: { "checked": _vm.active }, on: { "change": function($event) {
      return _vm.toggleActive($event.target.checked);
    } } }) : _vm._e(), _c("label", { staticClass: "pw-field-row-label", attrs: { "for": _vm.noCheckbox ? null : "pw-prop-" + _vm.uid } }, [_vm._v(_vm._s(_vm.propertyLabel(_vm.label))), _vm.required ? _c("span", { staticClass: "pw-field-required" }, [_vm._v("*")]) : _vm._e()])]), _vm.active ? _c("div", { staticClass: "pw-field-row-options" }, _vm._l(_vm.allOptions, function(opt) {
      return _c("button", { key: opt, staticClass: "pw-field-row-option", class: {
        "is-active": _vm.localActive.includes(opt),
        "is-default": !_vm.noDefault && opt === _vm.localDefault,
        "is-plugin-default": !_vm.noDefault && opt === _vm.pluginDefault && !_vm.touched && !_vm.modified
      }, attrs: { "type": "button" }, on: { "click": function($event) {
        return _vm.handleClick(opt);
      } } }, [_vm._v(" " + _vm._s(_vm.optionLabel(opt)) + " ")]);
    }), 0) : _vm._e()])])]);
  };
  var _sfc_staticRenderFns$7 = [];
  _sfc_render$7._withStripped = true;
  var __component__$7 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$7,
    _sfc_render$7,
    _sfc_staticRenderFns$7
  );
  __component__$7.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/FieldRow.vue";
  const FieldRow = __component__$7.exports;
  const _sfc_main$6 = {
    props: {
      group: String,
      varName: String,
      defaultValue: String,
      overrideValue: String
    },
    computed: {
      displayValue() {
        const val = this.overrideValue || this.defaultValue;
        if (!val) return "#000000";
        return val;
      }
    },
    methods: {
      onInput(value) {
        this.$emit("update:value", value === this.defaultValue ? "" : value || "");
      }
    }
  };
  var _sfc_render$6 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-color-field" }, [_c("k-color-field", { attrs: { "value": _vm.displayValue, "alpha": true, "mode": "picker" }, on: { "input": _vm.onInput } })], 1);
  };
  var _sfc_staticRenderFns$6 = [];
  _sfc_render$6._withStripped = true;
  var __component__$6 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$6,
    _sfc_render$6,
    _sfc_staticRenderFns$6
  );
  __component__$6.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/ColorFieldRow.vue";
  const ColorFieldRow = __component__$6.exports;
  const _sfc_main$5 = {
    props: {
      blocks: {
        type: Array,
        default: () => []
      }
    },
    methods: {
      blockLabel(blockType) {
        const block = this.blocks.find((b) => b.blockType === blockType);
        if (block) {
          const translated = this.$t(block.plugin + ".name");
          if (translated && translated !== block.plugin + ".name") return translated;
        }
        const name = blockType.replace(/^pw/, "").replace(/([A-Z])/g, " $1").trim() || blockType;
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
  };
  var _sfc_render$5 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-wizard-global-content" }, [_c("fieldset", { staticClass: "pw-wizard-fieldgroup" }, [_c("h3", { staticClass: "pw-wizard-fieldgroup-title" }, [_vm._v("Active Blocks")]), _c("p", { staticClass: "pw-wizard-hint" }, [_vm._v("Select which blocks are available in the content editor.")]), _c("div", { staticClass: "pw-wizard-checklist" }, _vm._l(_vm.blocks, function(block) {
      return _c("label", { key: block.blockType, staticClass: "pw-wizard-check" }, [_c("input", { attrs: { "type": "checkbox" }, domProps: { "checked": block.active }, on: { "change": function($event) {
        return _vm.$emit("toggle", { blockType: block.blockType, checked: $event.target.checked });
      } } }), _c("span", { staticClass: "pw-wizard-check-label" }, [_vm._v(_vm._s(_vm.blockLabel(block.blockType)))]), _c("span", { staticClass: "pw-wizard-check-meta" }, [_vm._v(_vm._s(block.plugin))])]);
    }), 0)])]);
  };
  var _sfc_staticRenderFns$5 = [];
  _sfc_render$5._withStripped = true;
  var __component__$5 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$5,
    _sfc_render$5,
    _sfc_staticRenderFns$5
  );
  __component__$5.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalElements.vue";
  const GlobalElements = __component__$5.exports;
  const _sfc_main$4 = {
    props: {
      block: {
        type: Object,
        required: true
      },
      config: {
        type: Object,
        required: true
      },
      overrides: {
        type: Object,
        default: () => ({})
      },
      writerActive: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        sectionState: {}
      };
    },
    computed: {
      blockType() {
        return this.block.blockType;
      }
    },
    methods: {
      // --- Content fields ---
      getContentFields() {
        const settings = this.getDefault("settings.fields.content") || {};
        const fields = [];
        for (const [key, settingVal] of Object.entries(settings)) {
          if (key === "editor" || key === "column-blocks" || key.startsWith("item-")) continue;
          if (settingVal === "enabled") {
            fields.push({ key, enabled: true, properties: [] });
            continue;
          }
          if (this.isObject(settingVal) && "default" in settingVal && !this.hasNestedProps(settingVal)) {
            continue;
          }
          const field = { key, enabled: true, properties: [] };
          if (this.isObject(settingVal)) {
            for (const [propKey, propValue] of Object.entries(settingVal)) {
              if (propValue === false) continue;
              const propObj = this.isObject(propValue) ? propValue : {};
              const allOptions = propObj.options || (Array.isArray(propValue) ? propValue : []);
              if (allOptions.length === 0) continue;
              const pluginDefault = propObj.default !== void 0 ? String(propObj.default) : "";
              if (allOptions.length > 1) {
                field.properties.push({
                  key: propKey,
                  allOptions,
                  options: allOptions,
                  pluginDefault,
                  required: propObj.required === true
                });
              }
            }
          }
          if (field.properties.length === 0 && settingVal !== "enabled") continue;
          fields.push(field);
        }
        return fields;
      },
      getItemFields() {
        const settings = this.getDefault("settings.fields.content") || {};
        const fields = [];
        for (const [key, settingVal] of Object.entries(settings)) {
          if (!key.startsWith("item-")) continue;
          if (settingVal === "enabled") continue;
          if (this.isObject(settingVal) && "default" in settingVal && !this.hasNestedProps(settingVal)) continue;
          const displayKey = key.replace(/^item-/, "");
          const field = { key, displayKey, enabled: true, properties: [] };
          if (this.isObject(settingVal)) {
            for (const [propKey, propValue] of Object.entries(settingVal)) {
              if (propValue === false) continue;
              const propObj = this.isObject(propValue) ? propValue : {};
              const allOptions = propObj.options || (Array.isArray(propValue) ? propValue : []);
              if (allOptions.length === 0) continue;
              const pluginDefault = propObj.default !== void 0 ? String(propObj.default) : "";
              if (allOptions.length > 1) {
                field.properties.push({
                  key: propKey,
                  allOptions,
                  options: allOptions,
                  pluginDefault,
                  required: propObj.required === true
                });
              }
            }
          }
          fields.push(field);
        }
        return fields;
      },
      getEditorField() {
        const settings = this.getDefault("settings.fields.content") || {};
        const settingVal = settings["editor"];
        if (!settingVal || !this.isObject(settingVal)) return null;
        const field = { key: "editor", enabled: true, properties: [] };
        for (const [propKey, propValue] of Object.entries(settingVal)) {
          if (propValue === false) continue;
          const propObj = this.isObject(propValue) ? propValue : {};
          const allOptions = propObj.options || (Array.isArray(propValue) ? propValue : []);
          if (allOptions.length === 0) continue;
          const pluginDefault = propObj.default !== void 0 ? String(propObj.default) : "";
          if (allOptions.length > 1) {
            field.properties.push({
              key: propKey,
              allOptions,
              options: allOptions,
              pluginDefault,
              required: propObj.required === true
            });
          }
        }
        return field.properties.length ? field : null;
      },
      getEditorConfigRows() {
        const raw = this.getDefault("editor");
        const editorConfig = JSON.parse(JSON.stringify(raw || {}));
        const rows = [];
        for (const [key, val] of Object.entries(editorConfig)) {
          if (Array.isArray(val) && val.length > 0) {
            rows.push({ key, type: "array", values: val });
          } else if (val && typeof val === "object") {
            for (const [subKey, subVal] of Object.entries(val)) {
              if (typeof subVal === "boolean") {
                rows.push({ key: key + "-" + subKey, label: key + " › " + subKey, type: "toggle", path: key + "." + subKey, value: subVal });
              }
            }
          }
        }
        return rows;
      },
      // --- Column blocks ---
      getColumnBlocks() {
        const settings = this.getDefault("settings.fields.content") || {};
        const val = settings["column-blocks"];
        return Array.isArray(val) && val.length ? val : null;
      },
      getActiveColumnBlocks() {
        const override = this.getOverrideOnly("settings.fields.content.column-blocks");
        if (Array.isArray(override) && override.length) return override;
        return this.getColumnBlocks() || [];
      },
      isColumnBlockField(fieldKey) {
        const columnBlocks = this.getColumnBlocks();
        if (!columnBlocks) return true;
        const active = this.getActiveColumnBlocks();
        return active.some((cb) => cb.replace("multicolumn", "") === fieldKey);
      },
      setColumnBlocks(values, allBlocks) {
        const ordered = allBlocks.filter((b) => values.includes(b));
        if (JSON.stringify(ordered) === JSON.stringify(allBlocks)) {
          this.deleteNested(this.overrides || {}, "settings.fields.content.column-blocks");
          this.cleanEmpty(this.overrides || {}, "settings.fields.content");
          this.cleanEmpty(this.overrides || {}, "settings.fields");
          this.cleanEmpty(this.overrides || {}, "settings");
        } else {
          this.setVal("settings.fields.content.column-blocks", ordered);
        }
        this.markDirty();
      },
      // --- Editor options ---
      setEditorContentOptions(propKey, prop, values) {
        this.setActiveOptions("editor", propKey, prop, values);
        if (propKey === "mode") {
          this.$emit("update:writer-active", values.includes("writer"));
        }
      },
      // --- Active options ---
      getActiveOptions(fieldKey, propKey, prop) {
        const fullOverride = this.getOverrideOnly("settings.fields.content." + fieldKey + "." + propKey);
        if (fullOverride === false) return [];
        const override = this.isObject(fullOverride) ? fullOverride.options : void 0;
        if (Array.isArray(override)) return override;
        return prop.allOptions;
      },
      setActiveOptions(fieldKey, propKey, prop, values) {
        const basePath = "settings.fields.content." + fieldKey + "." + propKey;
        if (values === null) {
          this.setVal(basePath, false);
          this.markDirty();
          return;
        }
        const updated = Array.isArray(values) ? values : [];
        if (updated.length === 0) {
          this.deleteNested(this.overrides || {}, basePath);
          this.cleanEmpty(this.overrides || {}, "settings.fields.content." + fieldKey);
          this.cleanEmpty(this.overrides || {}, "settings.fields.content");
          this.cleanEmpty(this.overrides || {}, "settings.fields");
          this.cleanEmpty(this.overrides || {}, "settings");
          this.markDirty();
          return;
        }
        const ordered = prop.allOptions.filter((o) => updated.includes(o));
        if (JSON.stringify(ordered) === JSON.stringify(prop.allOptions)) {
          const currentDefault2 = this.getVal(basePath + ".default", prop.pluginDefault);
          if (currentDefault2 === prop.pluginDefault || currentDefault2 === String(prop.pluginDefault)) {
            this.deleteNested(this.overrides || {}, basePath);
            this.cleanEmpty(this.overrides || {}, "settings.fields.content." + fieldKey);
            this.cleanEmpty(this.overrides || {}, "settings.fields.content");
            this.cleanEmpty(this.overrides || {}, "settings.fields");
            this.cleanEmpty(this.overrides || {}, "settings");
            this.markDirty();
            return;
          }
          this.deleteNested(this.overrides || {}, basePath + ".options");
          this.markDirty();
          return;
        }
        this.setVal(basePath + ".options", ordered);
        const currentDefault = this.getVal(basePath + ".default", prop.pluginDefault);
        if (currentDefault && !ordered.includes(currentDefault) && ordered.length) {
          this.setVal(basePath + ".default", ordered[0]);
        }
        this.markDirty();
      },
      // --- Categories ---
      getCategories() {
        const cats = [];
        for (const catKey of ["layout", "style", "effects", "grid", "settings"]) {
          const settingsFields = this.getDefault("settings.fields." + catKey) || {};
          if (Object.keys(settingsFields).length === 0) continue;
          const fields = [];
          const grouped = {};
          for (const [key, val] of Object.entries(settingsFields)) {
            if (key === "padding" || key === "radius") continue;
            if (val === "enabled") continue;
            if (key.startsWith("radius-")) {
              if (!grouped["radius"]) {
                grouped["radius"] = { key: "radius", type: "toggle-group", subFields: [] };
              }
              const subLabel = key.replace("radius-", "");
              const defaultValue = this.isObject(val) && "default" in val ? val.default : false;
              grouped["radius"].subFields.push({ key, label: subLabel, defaultValue });
              continue;
            }
            if (key === "padding-top" || key === "padding-bottom") {
              const defaultValue = this.isObject(val) && "default" in val ? val.default : "large";
              fields.push({
                key,
                type: "toggles",
                defaultValue,
                options: [
                  { value: "small", text: "Small" },
                  { value: "large", text: "Large" }
                ]
              });
              continue;
            }
            if (this.isObject(val) && "options" in val) {
              const opts = val.options;
              const defaultValue = val.default !== void 0 ? val.default : opts[0];
              const required = val.required === true;
              if (val.fixed) {
                fields.push({
                  key,
                  type: "toggles",
                  defaultValue,
                  required,
                  reset: !required,
                  options: opts.map((v) => ({ value: v, text: this.toggleOptionLabel(v) }))
                });
                continue;
              }
              if (opts.length > 5 || required) {
                fields.push({
                  key,
                  type: "fieldrow",
                  allOptions: opts,
                  pluginDefault: String(defaultValue),
                  defaultValue,
                  required
                });
              } else {
                fields.push({
                  key,
                  type: "toggles",
                  defaultValue,
                  required,
                  reset: !required,
                  options: opts.map((v) => ({ value: v, text: this.toggleOptionLabel(v) }))
                });
              }
              continue;
            }
            if (key.startsWith("grid-size-") && this.isObject(val) && "default" in val) {
              const opts = Array.from({ length: 12 }, (_, i) => i + 1);
              fields.push({
                key,
                type: "toggles",
                defaultValue: val.default,
                required: true,
                reset: false,
                options: opts.map((v) => ({ value: v, text: String(v) }))
              });
              continue;
            }
            if (key.startsWith("grid-offset-") && this.isObject(val) && "default" in val) {
              const opts = Array.from({ length: 12 }, (_, i) => i);
              fields.push({
                key,
                type: "toggles",
                defaultValue: val.default,
                required: true,
                reset: false,
                options: opts.map((v) => ({ value: v, text: String(v) }))
              });
              continue;
            }
            if (this.isObject(val) && "default" in val) {
              fields.push({
                key,
                type: "single",
                defaultValue: val.default
              });
              continue;
            }
            if (Array.isArray(val) && val.length > 0) {
              fields.push({
                key,
                type: "toggles",
                defaultValue: val[0],
                required: false,
                reset: true,
                options: val.map((v) => ({ value: v, text: this.toggleOptionLabel(v) }))
              });
              continue;
            }
          }
          for (const group of Object.values(grouped)) {
            fields.push(group);
          }
          cats.push({ key: catKey, fields });
        }
        return cats;
      },
      getCategoryActiveOptions(catKey, fieldKey, field) {
        const override = this.getOverrideOnly("settings.fields." + catKey + "." + fieldKey + ".options");
        if (Array.isArray(override) && override.length > 0) return override;
        return field.allOptions;
      },
      setCategoryOptions(catKey, fieldKey, field, values) {
        const basePath = "settings.fields." + catKey + "." + fieldKey;
        const ordered = Array.isArray(values) ? field.allOptions.filter((o) => values.includes(o)) : [];
        if (ordered.length === 0) {
          this.deleteNested(this.overrides || {}, basePath);
          this.cleanEmpty(this.overrides || {}, "settings.fields." + catKey);
          this.cleanEmpty(this.overrides || {}, "settings.fields");
          this.cleanEmpty(this.overrides || {}, "settings");
          this.markDirty();
          return;
        }
        if (JSON.stringify(ordered) === JSON.stringify(field.allOptions)) {
          const currentDefault2 = this.getVal(basePath + ".default", field.pluginDefault);
          if (currentDefault2 === field.pluginDefault || currentDefault2 === String(field.pluginDefault)) {
            this.deleteNested(this.overrides || {}, basePath);
            this.cleanEmpty(this.overrides || {}, "settings.fields." + catKey);
            this.cleanEmpty(this.overrides || {}, "settings.fields");
            this.cleanEmpty(this.overrides || {}, "settings");
            this.markDirty();
            return;
          }
          this.deleteNested(this.overrides || {}, basePath + ".options");
          this.markDirty();
          return;
        }
        this.setVal(basePath + ".options", ordered);
        const currentDefault = this.getVal(basePath + ".default", field.pluginDefault);
        if (!ordered.includes(currentDefault) && ordered.length) {
          this.setVal(basePath + ".default", ordered[0]);
        }
        this.markDirty();
      },
      // --- Field enabled/toggle ---
      isFieldEnabled(field) {
        const disabled = this.getOverrideOnly("settings.fields.content." + field.key + "._disabled");
        if (disabled === true) return false;
        const override = this.getOverrideOnly("settings.fields.content." + field.key);
        if (override === false) return false;
        if (override === true || this.isObject(override)) return true;
        return field.enabled !== false;
      },
      toggleField(field, enabled) {
        if (!this.overrides || Array.isArray(this.overrides)) {
          this.$emit("update:overrides", {});
        }
        const path = "settings.fields.content." + field.key;
        if (enabled) {
          this.deleteNested(this.overrides, path + "._disabled");
          this.cleanEmpty(this.overrides, path);
          this.cleanEmpty(this.overrides, "settings.fields.content");
          this.cleanEmpty(this.overrides, "settings.fields");
          this.cleanEmpty(this.overrides, "settings");
        } else {
          this.setVal(path + "._disabled", true);
        }
        this.markDirty();
      },
      toggleVisibility(path) {
        const current = this.getVal(path, "enabled");
        if (current === false) {
          this.deleteNested(this.overrides || {}, path);
          const parts = path.split(".");
          for (let i = parts.length - 1; i > 0; i--) {
            this.cleanEmpty(this.overrides || {}, parts.slice(0, i).join("."));
          }
        } else {
          this.setVal(path, false);
        }
        this.markDirty();
      },
      toggleSection(sectionKey) {
        const key = this.blockType + "-" + sectionKey;
        this.$set(this.sectionState, key, !this.isSectionOpen(sectionKey));
      },
      isSectionOpen(sectionKey) {
        const key = this.blockType + "-" + sectionKey;
        return this.sectionState[key] !== false;
      },
      selectOption(path, value, pluginDefault) {
        if (value === pluginDefault || value === String(pluginDefault)) {
          this.deleteNested(this.overrides || {}, path);
          const parts = path.split(".");
          for (let i = parts.length - 1; i > 0; i--) {
            this.cleanEmpty(this.overrides || {}, parts.slice(0, i).join("."));
          }
        } else {
          this.setVal(path, value);
        }
        this.markDirty();
      },
      setEditorArrayDirect(key, values, defaultVal) {
        if (JSON.stringify(values) === JSON.stringify(defaultVal)) {
          this.deleteNested(this.overrides || {}, "editor." + key);
          this.cleanEmpty(this.overrides || {}, "editor");
        } else {
          this.setVal("editor." + key, values);
        }
        this.markDirty();
      },
      // --- Value getters/setters ---
      getVal(path, defaultVal) {
        const ov = this.nested(this.overrides || {}, path);
        return ov !== void 0 ? ov : defaultVal;
      },
      getOverrideOnly(path) {
        return this.nested(this.overrides || {}, path);
      },
      hasOverride(path) {
        return this.nested(this.overrides || {}, path) !== void 0;
      },
      setVal(path, value) {
        if (!this.overrides || Array.isArray(this.overrides)) {
          this.$emit("update:overrides", {});
        }
        this.setNested(this.overrides, path, value);
        this.markDirty();
      },
      setValOrClear(path, value, placeholder) {
        if (!this.overrides || Array.isArray(this.overrides)) {
          this.$emit("update:overrides", {});
        }
        if (value === "" || value === placeholder) {
          this.deleteNested(this.overrides, path);
        } else {
          this.setNested(this.overrides, path, value);
        }
        this.markDirty();
      },
      getDefault(path) {
        if (!this.config) return null;
        return this.nested(this.config.defaults, path);
      },
      markDirty() {
        this.$emit("update:overrides", this.overrides);
      },
      // --- Label helpers ---
      fieldLabel(key) {
        const tKey = "pw.field." + key;
        const translated = this.$t(tKey);
        return translated && translated !== tKey ? translated : key.charAt(0).toUpperCase() + key.slice(1);
      },
      categoryFieldLabel(key) {
        const prwKey = "prw.field." + key;
        const prwT = this.$t(prwKey);
        if (prwT && prwT !== prwKey) return prwT;
        const pwLabelKey = "pw.field." + key + ".label";
        const pwLabelT = this.$t(pwLabelKey);
        if (pwLabelT && pwLabelT !== pwLabelKey) return pwLabelT;
        const pwKey = "pw.field." + key;
        const pwT = this.$t(pwKey);
        if (pwT && pwT !== pwKey) return pwT;
        const lastDash = key.lastIndexOf("-");
        if (lastDash > 0) {
          const dotKey = "pw.field." + key.substring(0, lastDash) + "." + key.substring(lastDash + 1);
          const dotT = this.$t(dotKey);
          if (dotT && dotT !== dotKey) return dotT;
        }
        return key;
      },
      toggleOptionLabel(val) {
        const prwKey = "prw.option." + val;
        const prwT = this.$t(prwKey);
        if (prwT && prwT !== prwKey) return prwT;
        const pwKey = "pw.option." + val;
        const pwT = this.$t(pwKey);
        if (pwT && pwT !== pwKey) return pwT;
        return val;
      },
      // --- Nested object helpers ---
      nested(obj, path) {
        if (!path) return void 0;
        return path.split(".").reduce((o, k) => o && o[k] !== void 0 ? o[k] : void 0, obj);
      },
      setNested(obj, path, value) {
        const keys = path.split(".");
        let cur = obj;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!cur[keys[i]] || typeof cur[keys[i]] !== "object") {
            this.$set(cur, keys[i], {});
          }
          cur = cur[keys[i]];
        }
        this.$set(cur, keys[keys.length - 1], value);
      },
      cleanEmpty(obj, path) {
        const val = this.nested(obj, path);
        if (val && typeof val === "object" && Object.keys(val).length === 0) {
          this.deleteNested(obj, path);
        }
      },
      deleteNested(obj, path) {
        const keys = path.split(".");
        let cur = obj;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!cur[keys[i]]) return;
          cur = cur[keys[i]];
        }
        this.$delete(cur, keys[keys.length - 1]);
      },
      isObject(val) {
        return val && typeof val === "object" && !Array.isArray(val);
      },
      hasNestedProps(obj) {
        for (const v of Object.values(obj)) {
          if (this.isObject(v) && ("options" in v || "default" in v)) return true;
        }
        return false;
      }
    }
  };
  var _sfc_render$4 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-wizard-block-sections" }, [_c("div", { staticClass: "pw-wizard-tab-content" }, [_c("section", { staticClass: "pw-wizard-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("span", { staticClass: "pw-tab-visibility pw-tab-visibility-static" }, [_c("svg", { attrs: { "xmlns": "http://www.w3.org/2000/svg", "viewBox": "0 0 24 24", "fill": "currentColor" } }, [_c("path", { attrs: { "d": "M1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12ZM12.0003 17C14.7617 17 17.0003 14.7614 17.0003 12C17.0003 9.23858 14.7617 7 12.0003 7C9.23884 7 7.00026 9.23858 7.00026 12C7.00026 14.7614 9.23884 17 12.0003 17ZM12.0003 15C10.3434 15 9.00026 13.6569 9.00026 12C9.00026 10.3431 10.3434 9 12.0003 9C13.6571 9 15.0003 10.3431 15.0003 12C15.0003 13.6569 13.6571 15 12.0003 15Z" } })])]), _c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
      return _vm.toggleSection("content");
    } } }, [_c("span", [_vm._v(_vm._s(_vm.$t("pw.headline.content")))]), _c("k-icon", { attrs: { "type": _vm.isSectionOpen("content") ? "angle-down" : "angle-right" } })], 1)]), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isSectionOpen("content"), expression: "isSectionOpen('content')" }], staticClass: "pw-field-block", attrs: { "data-collapsible": "true" } }, [_vm.getColumnBlocks() ? _c("div", { staticClass: "pw-field-block" }, [_c("div", { staticClass: "k-field k-text-field pw-content-field", attrs: { "data-object": "content-field" } }, [_c("div", { staticClass: "pw-field-rows" }, [_c("pw-field-row", { attrs: { "uid": _vm.blockType + "-column-blocks", "label": _vm.$t("prw.headline.columnBlocks"), "all-options": _vm.getColumnBlocks(), "active-options": _vm.getActiveColumnBlocks(), "current-default": "", "plugin-default": "", "enabled": true, "modified": _vm.hasOverride("settings.fields.content.column-blocks"), "no-default": true, "no-checkbox": true }, on: { "update:options": function($event) {
      _vm.setColumnBlocks($event, _vm.getColumnBlocks());
    } } })], 1)])]) : _vm._e(), _vm.getContentFields().length ? _c("div", { staticClass: "pw-field-block" }, _vm._l(_vm.getContentFields(), function(field) {
      return _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isColumnBlockField(field.key), expression: "isColumnBlockField(field.key)" }], key: field.key, staticClass: "k-field k-text-field pw-content-field", attrs: { "data-object": "content-field" } }, [!_vm.getColumnBlocks() ? _c("div", { staticClass: "pw-column-field-label pw-clickable", on: { "click": function($event) {
        _vm.toggleField(field, !_vm.isFieldEnabled(field));
      } } }, [_c("span", { staticClass: "pw-tab-visibility" }, [_c("k-icon", { attrs: { "type": _vm.isFieldEnabled(field) ? "preview" : "hidden" } })], 1), _c("span", [_vm._v(_vm._s(_vm.fieldLabel(field.key)))])]) : _c("div", { staticClass: "pw-column-field-label" }, [_c("span", [_vm._v(_vm._s(_vm.fieldLabel(field.key)))])]), field.properties.length ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: !_vm.getColumnBlocks() ? _vm.isFieldEnabled(field) : true, expression: "!getColumnBlocks() ? isFieldEnabled(field) : true" }], staticClass: "pw-field-rows" }, _vm._l(field.properties, function(prop) {
        return _c("pw-field-row", { key: field.key + "-" + prop.key, attrs: { "uid": _vm.blockType + "-" + field.key + "-" + prop.key, "label": prop.key, "all-options": prop.allOptions, "active-options": _vm.getActiveOptions(field.key, prop.key, prop), "current-default": _vm.getVal("settings.fields.content." + field.key + "." + prop.key + ".default", prop.pluginDefault), "plugin-default": prop.pluginDefault, "enabled": true, "required": prop.required === true, "modified": _vm.hasOverride("settings.fields.content." + field.key + "." + prop.key) }, on: { "update:options": function($event) {
          return _vm.setActiveOptions(field.key, prop.key, prop, $event);
        }, "update:default": function($event) {
          return _vm.selectOption("settings.fields.content." + field.key + "." + prop.key + ".default", $event, prop.pluginDefault);
        } } });
      }), 1) : _vm._e()]);
    }), 0) : _vm._e(), _vm.getEditorField() || _vm.getEditorConfigRows().length ? _c("div", { staticClass: "k-field k-text-field pw-content-field", attrs: { "data-object": "content-field" } }, [_c("div", { staticClass: "pw-column-field-label pw-clickable", on: { "click": function($event) {
      _vm.toggleField(_vm.getEditorField() || { key: "editor", enabled: true }, !_vm.isFieldEnabled(_vm.getEditorField() || { key: "editor", enabled: true }));
    } } }, [_c("span", { staticClass: "pw-tab-visibility" }, [_c("k-icon", { attrs: { "type": _vm.isFieldEnabled(_vm.getEditorField() || { key: "editor", enabled: true }) ? "preview" : "hidden" } })], 1), _c("span", [_vm._v(_vm._s(_vm.fieldLabel("editor")))])]), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isFieldEnabled(_vm.getEditorField() || { key: "editor", enabled: true }), expression: "isFieldEnabled(getEditorField() || { key: 'editor', enabled: true })" }], staticClass: "pw-field-rows" }, [_vm.getEditorField() ? _vm._l(_vm.getEditorField().properties, function(prop) {
      return _c("pw-field-row", { key: "editor-content-" + prop.key, attrs: { "uid": _vm.blockType + "-editor-" + prop.key, "label": prop.key, "all-options": prop.allOptions, "active-options": _vm.getActiveOptions("editor", prop.key, prop), "current-default": _vm.getVal("settings.fields.content.editor." + prop.key + ".default", prop.pluginDefault), "plugin-default": prop.pluginDefault, "enabled": true, "modified": _vm.hasOverride("settings.fields.content.editor." + prop.key) }, on: { "update:options": function($event) {
        return _vm.setEditorContentOptions(prop.key, prop, $event);
      }, "update:default": function($event) {
        return _vm.selectOption("settings.fields.content.editor." + prop.key + ".default", $event, prop.pluginDefault);
      } } });
    }) : _vm._e(), _vm._l(_vm.getEditorConfigRows(), function(row) {
      return _vm.writerActive !== false ? [row.type === "array" ? _c("pw-field-row", { key: "editor-" + row.key, attrs: { "uid": _vm.blockType + "-editor-" + row.key, "label": row.key, "all-options": row.values, "active-options": _vm.getOverrideOnly("editor." + row.key) || row.values, "current-default": "", "plugin-default": "", "enabled": true, "modified": _vm.hasOverride("editor." + row.key), "no-default": true }, on: { "update:options": function($event) {
        return _vm.setEditorArrayDirect(row.key, $event, row.values);
      } } }) : _vm._e(), row.type === "toggle" ? _c("div", { key: "editor-" + row.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(row.label))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggle-input", { attrs: { "value": _vm.getVal("editor." + row.path, row.value), "text": [_vm.$t("pw.option.disabled"), _vm.$t("pw.option.enabled")] }, on: { "input": function($event) {
        return _vm.setVal("editor." + row.path, $event);
      } } })], 1)])])]) : _vm._e()] : _vm._e();
    })], 2)]) : _vm._e(), _vm.getItemFields().length ? _c("div", { staticClass: "pw-item-section" }, [_c("div", { staticClass: "pw-field-block" }, _vm._l(_vm.getItemFields(), function(field) {
      return _c("div", { key: field.key, staticClass: "k-field k-text-field pw-content-field", attrs: { "data-object": "content-field" } }, [_c("div", { staticClass: "pw-column-field-label pw-clickable", on: { "click": function($event) {
        _vm.toggleField(field, !_vm.isFieldEnabled(field));
      } } }, [_c("span", { staticClass: "pw-tab-visibility" }, [_c("k-icon", { attrs: { "type": _vm.isFieldEnabled(field) ? "preview" : "hidden" } })], 1), _c("span", [_vm._v(_vm._s(_vm.$t("prw.label.item")) + ": " + _vm._s(_vm.fieldLabel(field.displayKey)))])]), field.properties.length ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isFieldEnabled(field), expression: "isFieldEnabled(field)" }], staticClass: "pw-field-rows" }, _vm._l(field.properties, function(prop) {
        return _c("pw-field-row", { key: field.key + "-" + prop.key, attrs: { "uid": _vm.blockType + "-" + field.key + "-" + prop.key, "label": prop.key, "all-options": prop.allOptions, "active-options": _vm.getActiveOptions(field.key, prop.key, prop), "current-default": _vm.getVal("settings.fields.content." + field.key + "." + prop.key + ".default", prop.pluginDefault), "plugin-default": prop.pluginDefault, "enabled": true, "required": prop.required === true, "modified": _vm.hasOverride("settings.fields.content." + field.key + "." + prop.key) }, on: { "update:options": function($event) {
          return _vm.setActiveOptions(field.key, prop.key, prop, $event);
        }, "update:default": function($event) {
          return _vm.selectOption("settings.fields.content." + field.key + "." + prop.key + ".default", $event, prop.pluginDefault);
        } } });
      }), 1) : _vm._e()]);
    }), 0)]) : _vm._e()])])], 1), _vm._l(_vm.getCategories(), function(cat) {
      return _c("section", { key: cat.key, staticClass: "pw-wizard-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-tab-visibility", attrs: { "type": "button" }, on: { "click": function($event) {
        $event.stopPropagation();
        return _vm.toggleVisibility("settings.tabs." + cat.key);
      } } }, [_c("k-icon", { attrs: { "type": _vm.getVal("settings.tabs." + cat.key, true) === false ? "hidden" : "preview" } })], 1), cat.fields.length ? _c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggleSection(cat.key);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.$t("pw.headline." + cat.key)))]), _c("k-icon", { attrs: { "type": _vm.isSectionOpen(cat.key) ? "angle-down" : "angle-right" } })], 1) : _c("span", { staticClass: "pw-section-title" }, [_vm._v(_vm._s(_vm.$t("pw.headline." + cat.key)))])]), cat.fields.length ? _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isSectionOpen(cat.key), expression: "isSectionOpen(cat.key)" }], staticClass: "pw-field-block", attrs: { "data-collapsible": "true" } }, [_vm._l(cat.fields, function(field) {
        return [field.type === "fieldrow" ? _c("pw-field-row", { key: field.key, attrs: { "uid": _vm.blockType + "-" + cat.key + "-" + field.key, "label": field.key, "all-options": field.allOptions, "active-options": _vm.getCategoryActiveOptions(cat.key, field.key, field), "current-default": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.pluginDefault), "plugin-default": field.pluginDefault, "enabled": true, "modified": _vm.hasOverride("settings.fields." + cat.key + "." + field.key), "no-checkbox": true, "required": field.required === true }, on: { "update:options": function($event) {
          return _vm.setCategoryOptions(cat.key, field.key, field, $event);
        }, "update:default": function($event) {
          return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event, field.pluginDefault);
        } } }) : _vm._e(), field.type === "toggles" ? _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key))), field.required ? _c("span", { staticClass: "pw-field-required" }, [_vm._v("*")]) : _vm._e()])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue), "options": field.options, "grow": false, "reset": field.reset !== false, "required": field.required === true }, on: { "input": function($event) {
          return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event, field.defaultValue);
        } } })], 1)])])]) : field.type === "toggle-group" ? _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key)))])]), _c("div", { staticClass: "pw-field-row-options pw-toggle-group" }, _vm._l(field.subFields, function(sub) {
          return _c("k-toggle-input", { key: sub.key, attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + sub.key + ".default", sub.defaultValue), "text": _vm.$t("prw.option." + sub.label) || sub.label }, on: { "input": function($event) {
            return _vm.setVal("settings.fields." + cat.key + "." + sub.key + ".default", $event);
          } } });
        }), 1)])])]) : field.type === "single" ? _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key)))])]), _c("div", { staticClass: "pw-field-row-options" }, [field.defaultValue !== null && typeof field.defaultValue === "boolean" ? _c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue), "text": [_vm.$t("pw.option.disabled"), _vm.$t("pw.option.enabled")] }, on: { "input": function($event) {
          return _vm.setVal("settings.fields." + cat.key + "." + field.key + ".default", $event);
        } } }) : field.options && field.options.length ? _c("select", { staticClass: "pw-category-select", domProps: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue) }, on: { "change": function($event) {
          return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event.target.value, field.defaultValue);
        } } }, _vm._l(field.options, function(opt) {
          return _c("option", { key: opt, domProps: { "value": opt } }, [_vm._v(_vm._s(opt))]);
        }), 0) : field.defaultValue !== null && typeof field.defaultValue === "string" ? _c("input", { staticClass: "pw-category-input", attrs: { "type": "text", "placeholder": field.defaultValue }, domProps: { "value": _vm.getOverrideOnly("settings.fields." + cat.key + "." + field.key + ".default") || "" }, on: { "input": function($event) {
          return _vm.setValOrClear("settings.fields." + cat.key + "." + field.key + ".default", $event.target.value, field.defaultValue);
        } } }) : field.defaultValue !== null && typeof field.defaultValue === "number" ? _c("input", { staticClass: "pw-category-input", attrs: { "type": "number", "placeholder": String(field.defaultValue) }, domProps: { "value": _vm.getOverrideOnly("settings.fields." + cat.key + "." + field.key + ".default") }, on: { "input": function($event) {
          _vm.setValOrClear("settings.fields." + cat.key + "." + field.key + ".default", $event.target.value !== "" ? Number($event.target.value) : "", String(field.defaultValue));
        } } }) : _vm._e()], 1)])])]) : _vm._e()];
      })], 2)]) : _vm._e()], 1);
    })], 2)]);
  };
  var _sfc_staticRenderFns$4 = [];
  _sfc_render$4._withStripped = true;
  var __component__$4 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$4,
    _sfc_render$4,
    _sfc_staticRenderFns$4
  );
  __component__$4.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/BlockSettings.vue";
  const BlockSettings = __component__$4.exports;
  const _sfc_main$3 = {
    props: {
      fontDefaults: {
        type: Object,
        default: () => ({})
      },
      fontOverrides: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        openSections: {}
      };
    },
    computed: {
      groups() {
        const result = {};
        for (const [key, val] of Object.entries(this.fontDefaults)) {
          if (val && typeof val === "object" && val.vars) {
            result[key] = val;
          }
        }
        return result;
      }
    },
    methods: {
      toggle(key) {
        this.$set(this.openSections, key, !this.isOpen(key));
      },
      isOpen(key) {
        return this.openSections[key] !== false;
      },
      groupLabel(key) {
        const tKey = "prw.fontgroup." + key;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        return key.charAt(0).toUpperCase() + key.slice(1);
      },
      sizeLabel(varName) {
        const match = varName.match(/-size-(.+)$/);
        if (!match) return varName;
        const size = match[1];
        const tKey = "pw.option." + size;
        const t = this.$t(tKey);
        const label = t && t !== tKey ? t : size.toUpperCase();
        return label + " (" + size.toUpperCase() + ")";
      },
      stripRem(val) {
        if (!val) return "";
        return val.replace(/rem$/, "");
      },
      setRemValue(bp, varName, value, defaultVal) {
        const remVal = value === "" ? "" : value + "rem";
        this.setValue(bp, varName, remVal, defaultVal);
      },
      remToPx(val) {
        if (!val) return "";
        const match = val.match(/^([\d.]+)rem$/);
        if (!match) return "";
        return Math.round(parseFloat(match[1]) * 16) + "px";
      },
      getOverrideValue(bp, varName) {
        return ((this.fontOverrides.global || {})[bp] || {})[varName] || "";
      },
      setValue(bp, varName, value, defaultVal) {
        const overrides = JSON.parse(JSON.stringify(this.fontOverrides));
        if (value === "" || value === defaultVal) {
          if (overrides.global && overrides.global[bp]) {
            delete overrides.global[bp][varName];
            if (Object.keys(overrides.global[bp]).length === 0) {
              delete overrides.global[bp];
            }
            if (overrides.global && Object.keys(overrides.global).length === 0) {
              delete overrides.global;
            }
          }
        } else {
          if (!overrides.global) overrides.global = {};
          if (!overrides.global[bp]) overrides.global[bp] = {};
          overrides.global[bp][varName] = value;
        }
        this.$emit("update:overrides", overrides);
      }
    }
  };
  var _sfc_render$3 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", [_c("div", { staticClass: "pw-font-help", staticStyle: { "margin-bottom": "var(--spacing-4)" } }, [_vm._v(' These sizes are used when the "sizes" option is enabled in block settings. Otherwise, the font-size from the Elements tab is used as fallback. ')]), _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isOpen(groupKey), expression: "isOpen(groupKey)" }], staticClass: "pw-element-list" }, [_c("div", { staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-responsive" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v("Mobile")])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v("Tablet")])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v("Desktop")])])])]), _vm._l(group.vars, function(value, varName) {
        return _c("div", { key: varName, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.sizeLabel(varName)))])]), _c("div", { staticClass: "pw-field-row-options pw-group-type-responsive" }, _vm._l(["default", "lg", "xl"], function(bp) {
          return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(bp, varName) }, attrs: { "type": "number", "step": group.step || 0.1, "min": "0.1", "max": "20" }, domProps: { "value": _vm.stripRem(_vm.getOverrideValue(bp, varName) || value[bp]) }, on: { "input": function($event) {
            return _vm.setRemValue(bp, varName, $event.target.value, value[bp] || "");
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.remToPx(_vm.getOverrideValue(bp, varName) || value[bp])))])]);
        }), 0)])])]);
      }), _c("div", { staticClass: "pw-group-end" })], 2)])], 1);
    })], 2);
  };
  var _sfc_staticRenderFns$3 = [];
  _sfc_render$3._withStripped = true;
  var __component__$3 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$3,
    _sfc_render$3,
    _sfc_staticRenderFns$3
  );
  __component__$3.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalFonts.vue";
  const GlobalFonts = __component__$3.exports;
  const _sfc_main$2 = {
    props: {
      elementDefaults: {
        type: Object,
        default: () => ({})
      },
      elementOverrides: {
        type: Object,
        default: () => ({})
      },
      fonts: {
        type: Object,
        default: () => ({})
      },
      fontDefaults: {
        type: Object,
        default: () => ({})
      },
      fontOverrides: {
        type: Object,
        default: () => ({})
      },
      bodyDefaultFont: {
        type: String,
        default: "Inter"
      }
    },
    data() {
      return {
        openSections: {}
      };
    },
    computed: {
      groups() {
        const result = {};
        for (const [key, val] of Object.entries(this.elementDefaults)) {
          if (val && typeof val === "object" && (val.vars || val.colors)) {
            result[key] = val;
          }
        }
        return result;
      },
      fontFamilyOptions() {
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        const seen = /* @__PURE__ */ new Set();
        const options = [{ value: "default", text: "Default (" + this.bodyDefaultFont + ")" }];
        for (const font of Object.values(allFonts)) {
          if (!seen.has(font.family) && font.family !== this.bodyDefaultFont) {
            seen.add(font.family);
            options.push({ value: font.family, text: font.family });
          }
        }
        return options;
      }
    },
    methods: {
      toggle(key) {
        this.$set(this.openSections, key, !this.isOpen(key));
      },
      isOpen(key) {
        return this.openSections[key] !== false;
      },
      groupLabel(key) {
        const tKey = "prw.elementgroup." + key;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        return key.charAt(0).toUpperCase() + key.slice(1);
      },
      propLabel(varName) {
        const tKey = "prw.element." + varName;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        const parts = varName.split("-");
        const propParts = parts.slice(1);
        return propParts.join(" ").replace(/\b\w/g, (c) => c.toUpperCase());
      },
      // --- Field signature + grouping ---
      fieldSignature(varName, def, isColor) {
        if (isColor) {
          return { type: "theme-color", labels: ["Default", "Variant", "Variant2"] };
        }
        if (Array.isArray(def.value) && def.labels) {
          return { type: "multi-value", labels: def.labels };
        }
        if (def.default !== void 0 && def.lg !== void 0 && def.variant === void 0) {
          return { type: "responsive", labels: ["Mobile", "Tablet", "Desktop"] };
        }
        return { type: "single", labels: null };
      },
      groupedFields(group) {
        const allFields = [];
        const colorFields = [];
        if (group.colors) {
          const colorKeys = Object.keys(group.colors);
          for (let i = 0; i < colorKeys.length; i++) {
            const varName = colorKeys[i];
            const colorVal = group.colors[varName];
            const sig = this.fieldSignature(varName, {}, true);
            const nextKey = colorKeys[i + 1] || "";
            const isState = varName.endsWith("-hover") || varName.endsWith("-active");
            const isFollowedByState = nextKey.endsWith("-hover") || nextKey.endsWith("-active");
            colorFields.push({
              varName,
              def: {},
              colorVal,
              label: this.colorLabel(varName),
              isState,
              isFollowedByState,
              type: "theme-color",
              sigLabels: sig.labels,
              sigKey: sig.type + ":" + sig.labels.join(",")
            });
          }
        }
        if (group.vars) {
          let colorsInserted = false;
          for (const [varName, def] of Object.entries(group.vars)) {
            const sig = this.fieldSignature(varName, def, false);
            if (!colorsInserted && sig.type !== "single" && colorFields.length > 0) {
              allFields.push(...colorFields);
              colorsInserted = true;
            }
            allFields.push({
              varName,
              def,
              label: this.propLabel(varName),
              type: sig.type,
              sigLabels: sig.labels,
              sigKey: sig.type === "single" ? "single-" + varName : sig.type + ":" + (sig.labels || []).join(",")
            });
          }
          if (!colorsInserted && colorFields.length > 0) {
            allFields.push(...colorFields);
          }
        } else if (colorFields.length > 0) {
          allFields.push(...colorFields);
        }
        const groups = [];
        let currentGroup = null;
        for (const field of allFields) {
          if (field.type === "single") {
            if (currentGroup) {
              groups.push(currentGroup);
              currentGroup = null;
            }
            groups.push({ header: null, fields: [field] });
          } else if (currentGroup && currentGroup.sigKey === field.sigKey) {
            currentGroup.fields.push(field);
          } else {
            if (currentGroup) groups.push(currentGroup);
            currentGroup = {
              sigKey: field.sigKey,
              header: field.sigLabels,
              fieldType: field.type,
              fields: [field]
            };
          }
        }
        if (currentGroup) groups.push(currentGroup);
        return groups;
      },
      filteredOptions(varName, options) {
        if (!varName.endsWith("-font-weight")) {
          return options.map((o) => ({ value: o, text: o }));
        }
        const prefix = varName.replace("-font-weight", "");
        const fontFamilyVar = prefix + "-font-family";
        let selectedFamily = this.getOverrideValue(fontFamilyVar);
        if (!selectedFamily) {
          for (const group of Object.values(this.elementDefaults)) {
            if (group && group.vars && group.vars[fontFamilyVar]) {
              selectedFamily = group.vars[fontFamilyVar].value;
              break;
            }
          }
        }
        if (!selectedFamily || selectedFamily === "default") selectedFamily = this.bodyDefaultFont;
        const font = this.getFontByFamily(selectedFamily);
        if (!font || !font.files || !font.files.length) {
          return options.map((o) => ({ value: o, text: o }));
        }
        const weight = font.files[0].weight || "400";
        const parts = weight.split(" ");
        if (parts.length === 2) {
          const min = parseInt(parts[0]);
          const max = parseInt(parts[1]);
          return options.filter((o) => {
            const n = parseInt(o);
            return n >= min && n <= max;
          }).map((o) => ({ value: o, text: o }));
        }
        return [{ value: parts[0], text: parts[0] }];
      },
      getFontByFamily(family) {
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        return Object.values(allFonts).find((f) => f.family === family) || null;
      },
      // --- Color methods ---
      colorLabel(varName) {
        const tKey = "prw.color." + varName;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        return varName;
      },
      getColorOverrideValue(theme, varName) {
        return ((this.elementOverrides.global || {})[theme] || {})[varName] || "";
      },
      setColorValue(theme, varName, value, defaultVal) {
        const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
        if (value === "" || value === defaultVal) {
          if (overrides.global && overrides.global[theme]) {
            delete overrides.global[theme][varName];
            if (Object.keys(overrides.global[theme]).length === 0) {
              delete overrides.global[theme];
            }
            if (overrides.global && Object.keys(overrides.global).length === 0) {
              delete overrides.global;
            }
          }
        } else {
          if (!overrides.global) overrides.global = {};
          if (!overrides.global[theme]) overrides.global[theme] = {};
          overrides.global[theme][varName] = value;
        }
        this.$emit("update:overrides", overrides);
      },
      // --- Quad methods ---
      getQuadValue(varName, index) {
        const override = (this.elementOverrides.global || {})[varName];
        if (Array.isArray(override)) return override[index] || "";
        return "";
      },
      setQuadValue(varName, index, value, def) {
        const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
        if (!overrides.global) overrides.global = {};
        const current = Array.isArray(overrides.global[varName]) ? [...overrides.global[varName]] : [...def.value];
        current[index] = value === "" ? def.value[index] : value + (def.unit || "");
        const allDefault = current.every((v, i) => v === def.value[i]);
        if (allDefault) {
          delete overrides.global[varName];
          if (Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        } else {
          overrides.global[varName] = current;
        }
        this.$emit("update:overrides", overrides);
      },
      // --- Style methods ---
      stripUnit(val) {
        if (!val) return "";
        return val.replace(/(rem|em|px)$/, "");
      },
      setUnitValue(varName, value, defaultVal, unit) {
        const withUnit = value === "" ? "" : value + (unit || "");
        this.setValue(varName, withUnit, defaultVal);
      },
      toPx(val, unit) {
        if (!val) return "";
        const num = parseFloat(val);
        if (isNaN(num)) return "";
        if (unit === "rem" || val.endsWith("rem")) return Math.round(num * 16) + "px";
        if (unit === "em" || val.endsWith("em")) return Math.round(num * 16) + "px";
        if (unit === "" && num > 0) return Math.round(num * 16) + "px";
        return "";
      },
      helpText(key) {
        const tKey = "prw.help." + key;
        const t = this.$t(tKey);
        return t && t !== tKey ? t : key;
      },
      fontSizesForGroup(groupKey) {
        return this.fontDefaults[groupKey] || null;
      },
      getFontSizeOverride(bp, varName) {
        return ((this.fontOverrides.global || {})[bp] || {})[varName] || "";
      },
      setFontSizeValue(bp, varName, value, defaultVal, unit) {
        const withUnit = value === "" ? "" : value + (unit || "");
        const overrides = JSON.parse(JSON.stringify(this.fontOverrides));
        if (withUnit === "" || withUnit === defaultVal) {
          if (overrides.global && overrides.global[bp]) {
            delete overrides.global[bp][varName];
            if (Object.keys(overrides.global[bp]).length === 0) delete overrides.global[bp];
            if (overrides.global && Object.keys(overrides.global).length === 0) delete overrides.global;
          }
        } else {
          if (!overrides.global) overrides.global = {};
          if (!overrides.global[bp]) overrides.global[bp] = {};
          overrides.global[bp][varName] = withUnit;
        }
        this.$emit("update:font-overrides", overrides);
      },
      getResponsiveOverride(varName, bp) {
        return ((this.elementOverrides.global || {})[bp] || {})[varName] || "";
      },
      setResponsiveValue(varName, bp, value, defaultVal, unit) {
        const withUnit = value === "" ? "" : value + (unit || "");
        const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
        if (withUnit === "" || withUnit === defaultVal) {
          if (overrides.global && overrides.global[bp]) {
            delete overrides.global[bp][varName];
            if (Object.keys(overrides.global[bp]).length === 0) {
              delete overrides.global[bp];
            }
            if (overrides.global && Object.keys(overrides.global).length === 0) {
              delete overrides.global;
            }
          }
        } else {
          if (!overrides.global) overrides.global = {};
          if (!overrides.global[bp]) overrides.global[bp] = {};
          overrides.global[bp][varName] = withUnit;
        }
        this.$emit("update:overrides", overrides);
      },
      getOverrideValue(varName) {
        return (this.elementOverrides.global || {})[varName] || "";
      },
      fontSelectValue(varName, defValue) {
        const ov = this.getOverrideValue(varName);
        if (ov && ov === this.bodyDefaultFont) return "default";
        return ov || defValue;
      },
      setValue(varName, value, defaultVal) {
        const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
        if (value === "" || value === defaultVal) {
          if (overrides.global) {
            delete overrides.global[varName];
            if (Object.keys(overrides.global).length === 0) {
              delete overrides.global;
            }
          }
        } else {
          if (!overrides.global) overrides.global = {};
          overrides.global[varName] = value;
        }
        this.$emit("update:overrides", overrides);
      }
    }
  };
  var _sfc_render$2 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isOpen(groupKey), expression: "isOpen(groupKey)" }], staticClass: "pw-element-list" }, [_vm._l(_vm.groupedFields(group), function(fieldGroup, gIdx) {
        return [fieldGroup.header ? _c("div", { key: "gh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
          return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(label))])]);
        }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
          return [_c("div", { key: "gf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: {
            "pw-dual-first": field.isFollowedByState || field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(groupKey) && _vm.openSections[groupKey + "-sizes"],
            "pw-dual-next": field.isState
          } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(groupKey) ? [_c("button", { staticClass: "pw-sizes-toggle", attrs: { "type": "button" }, on: { "click": function($event) {
            $event.preventDefault();
            return _vm.$set(_vm.openSections, groupKey + "-sizes", !_vm.openSections[groupKey + "-sizes"]);
          } } }, [_c("k-icon", { staticClass: "pw-sizes-chevron", attrs: { "type": _vm.openSections[groupKey + "-sizes"] ? "angle-down" : "angle-right" } }), _c("span", [_vm._v(_vm._s(field.label))])], 1)] : _c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(field.label))])], 2), _c("div", { staticClass: "pw-field-row-options", class: fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "" }, [field.def.type === "font-family" ? _c("select", { staticClass: "pw-element-input pw-font-select", domProps: { "value": _vm.fontSelectValue(field.varName, field.def.value) }, on: { "change": function($event) {
            return _vm.setValue(field.varName, $event.target.value, field.def.value);
          } } }, _vm._l(_vm.fontFamilyOptions, function(opt) {
            return _c("option", { key: opt.value, domProps: { "value": opt.value } }, [_vm._v(_vm._s(opt.text))]);
          }), 0) : field.def.options ? _c("k-toggles-input", { attrs: { "value": _vm.getOverrideValue(field.varName) || field.def.value, "options": _vm.filteredOptions(field.varName, field.def.options), "grow": false, "required": true }, on: { "input": function($event) {
            return _vm.setValue(field.varName, $event, field.def.value);
          } } }) : field.type === "multi-value" ? _vm._l(field.def.value, function(val, idx) {
            return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getQuadValue(field.varName, idx) }, attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || val) }, on: { "input": function($event) {
              return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit)))])]);
          }) : field.type === "responsive" ? _vm._l(["default", "lg", "xl"], function(bp) {
            return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getResponsiveOverride(field.varName, bp) }, attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "input": function($event) {
              return _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit);
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit)))])]);
          }) : field.type === "theme-color" ? _vm._l(["default", "variant", "variant2"], function(theme) {
            return _c("pw-color-field-row", { key: theme, attrs: { "group": theme, "var-name": field.varName, "default-value": field.colorVal[theme] || "", "override-value": _vm.getColorOverrideValue(theme, field.varName) }, on: { "update:value": function($event) {
              return _vm.setColorValue(theme, field.varName, $event, field.colorVal[theme] || "");
            } } });
          }) : field.def.unit !== void 0 ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(field.varName) }, attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(field.varName) || field.def.value) }, on: { "input": function($event) {
            return _vm.setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit);
          } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit)))])]), field.def.help ? _c("span", { staticClass: "pw-element-help" }, [_vm._v(_vm._s(_vm.helpText(field.def.help)))]) : _vm._e()] : [_c("input", { staticClass: "pw-element-input", attrs: { "type": "text", "placeholder": field.def.value }, domProps: { "value": _vm.getOverrideValue(field.varName) }, on: { "input": function($event) {
            return _vm.setValue(field.varName, $event.target.value, field.def.value);
          } } }), field.def.help ? _c("span", { staticClass: "pw-element-help" }, [_vm._v(_vm._s(_vm.helpText(field.def.help)))]) : _vm._e()]], 2)])])]), field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(groupKey) && _vm.openSections[groupKey + "-sizes"] ? _vm._l(_vm.fontSizesForGroup(groupKey).vars, function(sizeVal, sizeName) {
            return _c("div", { key: "size-" + sizeName, staticClass: "pw-field-row pw-dual-first pw-dual-next" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-sizes-label" }, [_vm._v(_vm._s(sizeName.split("-").pop()))])]), _c("div", { staticClass: "pw-field-row-options pw-group-type-responsive" }, _vm._l(["default", "lg", "xl"], function(bp) {
              return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getFontSizeOverride(bp, sizeName) }, attrs: { "type": "number", "step": _vm.fontSizesForGroup(groupKey).step || 0.1, "min": "0.1", "max": "20" }, domProps: { "value": _vm.stripUnit(_vm.getFontSizeOverride(bp, sizeName) || sizeVal[bp]) }, on: { "input": function($event) {
                return _vm.setFontSizeValue(bp, sizeName, $event.target.value, sizeVal[bp], "rem");
              } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getFontSizeOverride(bp, sizeName) || sizeVal[bp], "rem")))])]);
            }), 0)])])]);
          }) : _vm._e()];
        }), fieldGroup.header ? _c("div", { key: "ge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()];
      })], 2)])], 1);
    }), 0);
  };
  var _sfc_staticRenderFns$2 = [];
  _sfc_render$2._withStripped = true;
  var __component__$2 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$2,
    _sfc_render$2,
    _sfc_staticRenderFns$2
  );
  __component__$2.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalElementStyles.vue";
  const GlobalElementStyles = __component__$2.exports;
  const _sfc_main$1 = {
    props: {
      navDefaults: {
        type: Object,
        default: () => ({})
      },
      navOverrides: {
        type: Object,
        default: () => ({})
      },
      fonts: {
        type: Object,
        default: () => ({})
      },
      bodyDefaultFont: {
        type: String,
        default: "Inter"
      }
    },
    data() {
      return {
        openSections: {},
        inlineIcons: {
          "arrow-down": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/></svg>',
          "chevron-down": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
          "caret-down": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>',
          "plus-minus": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>'
        }
      };
    },
    computed: {
      groups() {
        const result = {};
        for (const [key, val] of Object.entries(this.navDefaults)) {
          if (val && typeof val === "object" && (val.vars || val.colors)) {
            result[key] = val;
          }
        }
        return result;
      },
      fontFamilyOptions() {
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        const seen = /* @__PURE__ */ new Set();
        const hasBodyDefault = Object.values(this.navDefaults).some((g) => g && g.vars && g.vars["font-family-default"]);
        const options = hasBodyDefault ? [] : [{ value: "default", text: "Default (" + this.bodyDefaultFont + ")" }];
        for (const font of Object.values(allFonts)) {
          if (!seen.has(font.family) && (hasBodyDefault || font.family !== this.bodyDefaultFont)) {
            seen.add(font.family);
            options.push({ value: font.family, text: font.family });
          }
        }
        return options;
      }
    },
    methods: {
      toggle(key) {
        this.$set(this.openSections, key, !this.isOpen(key));
      },
      isOpen(key) {
        return this.openSections[key] !== false;
      },
      groupLabel(key) {
        const tKey = "prw.navgroup." + key;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ");
      },
      hasColors(group) {
        return group.colors && Object.keys(group.colors).length > 0;
      },
      isFollowedByColorState(colors, index) {
        const keys = Object.keys(colors);
        const next = keys[index + 1];
        return next && (next.endsWith("-hover") || next.endsWith("-active"));
      },
      // --- Field signature + grouping ---
      fieldSignature(varName, def) {
        if (def.type === "color-group" && def.fields && def.labels) {
          return { type: "color-group", labels: def.labels };
        }
        if (Array.isArray(def.value) && def.labels) {
          return { type: "multi-value", labels: def.labels };
        }
        if (def.default !== void 0 && def.lg !== void 0 && def.variant === void 0) {
          return { type: "responsive", labels: ["Mobile", "Tablet", "Desktop"] };
        }
        return { type: "single", labels: null };
      },
      groupedFields(group) {
        const allFields = [];
        if (group.vars) {
          for (const [varName, def] of Object.entries(group.vars)) {
            if (def.type === "label") {
              allFields.push({ isLabel: true, labelText: varName.replace("_label_", "") });
              continue;
            }
            if (def.requires) {
              if (def.requires.includes(":")) {
                const [reqField, reqValue] = def.requires.split(":");
                const currentValue = this.getOverrideValue(reqField) || this.getDefaultValue(group, reqField);
                if (currentValue !== reqValue) continue;
              } else {
                if (!this.getOverrideValue(def.requires)) continue;
                if (varName.endsWith("-display-height")) continue;
              }
            }
            const sig = this.fieldSignature(varName, def);
            const isState = varName.includes("-active-") || varName.endsWith("-active");
            allFields.push({
              varName,
              def,
              label: def.label || this.propLabel(varName),
              type: sig.type,
              sigLabels: sig.labels,
              sigKey: sig.type === "single" ? "single-" + varName : sig.type + ":" + (sig.labels || []).join(","),
              isDependent: !!def.requires,
              isState
            });
          }
        }
        for (let i = 0; i < allFields.length; i++) {
          const f = allFields[i];
          f.isTightNext = f.isDependent || f.isState;
          if (i < allFields.length - 1) {
            const next = allFields[i + 1];
            f.isTight = next.isDependent || next.isState;
          }
        }
        const groups = [];
        let currentGroup = null;
        for (const field of allFields) {
          if (field.isLabel) {
            if (currentGroup) {
              groups.push(currentGroup);
              currentGroup = null;
            }
            groups.push({ isLabel: true, labelText: field.labelText });
            continue;
          }
          if (field.type === "single") {
            if (currentGroup) {
              groups.push(currentGroup);
              currentGroup = null;
            }
            groups.push({ header: null, fields: [field] });
          } else if (currentGroup && currentGroup.sigKey === field.sigKey) {
            currentGroup.fields.push(field);
          } else {
            if (currentGroup) groups.push(currentGroup);
            currentGroup = {
              sigKey: field.sigKey,
              header: field.sigLabels,
              fieldType: field.type,
              fields: [field]
            };
          }
        }
        if (currentGroup) groups.push(currentGroup);
        return groups;
      },
      getDefaultValue(group, varName) {
        const def = group.vars ? group.vars[varName] : null;
        if (!def) return "";
        return def.value || "";
      },
      dependentField(svgVarName) {
        for (const [, group] of Object.entries(this.navDefaults)) {
          if (!group.vars) continue;
          for (const [varName, def] of Object.entries(group.vars)) {
            if (def.requires === svgVarName) {
              return { varName, def };
            }
          }
        }
        return null;
      },
      toggleIcon(varName, icon, defaultVal) {
        const current = this.getOverrideValue(varName) || defaultVal;
        if (current === icon) {
          this.setValue(varName, "none", defaultVal);
        } else {
          this.setValue(varName, icon, defaultVal);
        }
      },
      sanitizeSvg(raw) {
        if (!raw) return "";
        let svg = raw.replace(/<\?xml[^?]*\?>\s*/gi, "").replace(/<!DOCTYPE[^>]*>\s*/gi, "").replace(/<!--[\s\S]*?-->\s*/g, "");
        const match = svg.match(/<svg[\s\S]*<\/svg>/i);
        if (!match) return "";
        svg = match[0];
        const vbMatch = svg.match(/viewBox=["'][\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)["']/);
        if (vbMatch) {
          const w = Math.round(parseFloat(vbMatch[1]));
          const h = Math.round(parseFloat(vbMatch[2]));
          svg = svg.replace(/(<svg[^>]*?)\s+width="[^"]*"/i, "$1");
          svg = svg.replace(/(<svg[^>]*?)\s+height="[^"]*"/i, "$1");
          svg = svg.replace(/<svg/, '<svg width="' + w + '" height="' + h + '"');
        }
        return svg.trim();
      },
      onSvgFileUpload(varName, event, defaultVal) {
        const file = event.target.files[0];
        event.target.value = "";
        if (!file || !file.name.endsWith(".svg")) return;
        const reader = new FileReader();
        reader.onload = () => {
          const cleaned = this.sanitizeSvg(reader.result);
          if (!cleaned) {
            this.$panel.notification.error("No valid SVG found");
            return;
          }
          const dims = this.parseSvgDimensions(cleaned);
          if (!dims) {
            this.$panel.notification.error("SVG must have a viewBox or width/height attributes");
            return;
          }
          this.onSvgInput(varName, cleaned, defaultVal);
        };
        reader.readAsText(file);
      },
      removeSvg(varName) {
        const overrides = JSON.parse(JSON.stringify(this.navOverrides));
        if (overrides.global) {
          delete overrides.global[varName];
          delete overrides.global[varName + "-width"];
          delete overrides.global[varName + "-height"];
          if (Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        }
        this.$emit("update:overrides", overrides);
      },
      onSvgInput(varName, value, defaultVal) {
        if (!value) {
          this.setValue(varName, "", defaultVal);
          return;
        }
        const overrides = JSON.parse(JSON.stringify(this.navOverrides));
        if (!overrides.global) overrides.global = {};
        overrides.global[varName] = value;
        const dims = this.parseSvgDimensions(value);
        if (dims) {
          overrides.global[varName + "-width"] = String(dims.width);
          overrides.global[varName + "-height"] = String(dims.height);
        }
        this.$emit("update:overrides", overrides);
      },
      parseSvgDimensions(svgCode) {
        if (!svgCode || !svgCode.includes("<svg")) return null;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgCode, "image/svg+xml");
          const svg = doc.querySelector("svg");
          if (!svg) return null;
          const vb = svg.getAttribute("viewBox");
          if (vb) {
            const parts = vb.trim().split(/\s+/);
            if (parts.length === 4) {
              return { width: Math.round(parseFloat(parts[2])), height: Math.round(parseFloat(parts[3])) };
            }
          }
          const w = parseFloat(svg.getAttribute("width"));
          const h = parseFloat(svg.getAttribute("height"));
          if (w && h) return { width: Math.round(w), height: Math.round(h) };
          return null;
        } catch (e) {
          return null;
        }
      },
      filteredOptions(varName, options) {
        if (!varName.endsWith("font-weight")) {
          return options.map((o) => ({ value: String(o), text: this.optionLabel(o) }));
        }
        const prefix = varName.replace("font-weight", "");
        const fontFamilyVar = prefix + "font-family";
        const selectedFamily = this.getOverrideValue(fontFamilyVar);
        const font = this.getFontByFamily(selectedFamily);
        if (!font || !font.files || !font.files.length) {
          return options.map((o) => ({ value: String(o), text: this.optionLabel(o) }));
        }
        const weight = font.files[0].weight || "400";
        const parts = weight.split(" ");
        if (parts.length === 2) {
          const min = parseInt(parts[0]);
          const max = parseInt(parts[1]);
          return options.filter((o) => {
            const n = parseInt(o);
            return n >= min && n <= max;
          }).map((o) => ({ value: String(o), text: this.optionLabel(o) }));
        }
        return [{ value: parts[0], text: this.optionLabel(parts[0]) }];
      },
      getFontByFamily(family) {
        if (!family) {
          for (const group of Object.values(this.navDefaults)) {
            if (group.vars && group.vars["font-family"]) {
              family = group.vars["font-family"].value;
              break;
            }
          }
        }
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        return Object.values(allFonts).find((f) => f.family === family) || null;
      },
      optionLabel(val) {
        const tKey = "prw.option." + val;
        const t = this.$t(tKey);
        return t && t !== tKey ? t : String(val);
      },
      propLabel(varName) {
        const tKey = "prw.nav." + varName;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        return varName;
      },
      getQuadValue(varName, index) {
        const override = (this.navOverrides.global || {})[varName];
        if (Array.isArray(override)) return override[index] || "";
        return "";
      },
      setQuadValue(varName, index, value, def) {
        const overrides = JSON.parse(JSON.stringify(this.navOverrides));
        if (!overrides.global) overrides.global = {};
        const current = Array.isArray(overrides.global[varName]) ? [...overrides.global[varName]] : [...def.value];
        current[index] = value === "" ? def.value[index] : value + (def.unit || "");
        const allDefault = current.every((v, i) => v === def.value[i]);
        if (allDefault) {
          delete overrides.global[varName];
          if (Object.keys(overrides.global).length === 0) {
            delete overrides.global;
          }
        } else {
          overrides.global[varName] = current;
        }
        this.$emit("update:overrides", overrides);
      },
      stripUnit(val) {
        if (!val) return "";
        return val.replace(/(rem|em|px)$/, "");
      },
      setUnitValue(varName, value, defaultVal, unit) {
        const withUnit = value === "" ? "" : value + (unit || "");
        this.setValue(varName, withUnit, defaultVal);
      },
      toPx(val, unit) {
        if (!val) return "";
        const num = parseFloat(val);
        if (isNaN(num)) return "";
        if (unit === "rem" || val.endsWith("rem")) return Math.round(num * 16) + "px";
        if (unit === "em" || val.endsWith("em")) return Math.round(num * 16) + "px";
        if (unit === "" && num > 0) return Math.round(num * 16) + "px";
        return "";
      },
      getColorOverrideValue(theme, varName) {
        return ((this.navOverrides.global || {})[theme] || {})[varName] || "";
      },
      setColorValue(theme, varName, value, defaultVal) {
        const overrides = JSON.parse(JSON.stringify(this.navOverrides));
        if (value === "" || value === defaultVal) {
          if (overrides.global && overrides.global[theme]) {
            delete overrides.global[theme][varName];
            if (Object.keys(overrides.global[theme]).length === 0) {
              delete overrides.global[theme];
            }
            if (overrides.global && Object.keys(overrides.global).length === 0) {
              delete overrides.global;
            }
          }
        } else {
          if (!overrides.global) overrides.global = {};
          if (!overrides.global[theme]) overrides.global[theme] = {};
          overrides.global[theme][varName] = value;
        }
        this.$emit("update:overrides", overrides);
      },
      getResponsiveOverride(varName, bp) {
        return ((this.navOverrides.global || {})[bp] || {})[varName] || "";
      },
      setResponsiveValue(varName, bp, value, defaultVal, unit) {
        const withUnit = value === "" ? "" : value + (unit || "");
        const overrides = JSON.parse(JSON.stringify(this.navOverrides));
        if (withUnit === "" || withUnit === defaultVal) {
          if (overrides.global && overrides.global[bp]) {
            delete overrides.global[bp][varName];
            if (Object.keys(overrides.global[bp]).length === 0) {
              delete overrides.global[bp];
            }
            if (overrides.global && Object.keys(overrides.global).length === 0) {
              delete overrides.global;
            }
          }
        } else {
          if (!overrides.global) overrides.global = {};
          if (!overrides.global[bp]) overrides.global[bp] = {};
          overrides.global[bp][varName] = withUnit;
        }
        this.$emit("update:overrides", overrides);
      },
      getOverrideValue(varName) {
        return (this.navOverrides.global || {})[varName] || "";
      },
      fontSelectValue(varName, defValue) {
        const ov = this.getOverrideValue(varName);
        if (ov && ov === this.bodyDefaultFont) return "default";
        return ov || defValue;
      },
      setValue(varName, value, defaultVal) {
        const overrides = JSON.parse(JSON.stringify(this.navOverrides));
        if (value === "" || value === defaultVal || value === String(defaultVal)) {
          if (overrides.global) {
            delete overrides.global[varName];
            if (Object.keys(overrides.global).length === 0) {
              delete overrides.global;
            }
          }
        } else {
          if (!overrides.global) overrides.global = {};
          overrides.global[varName] = value;
        }
        this.$emit("update:overrides", overrides);
      }
    }
  };
  var _sfc_render$1 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isOpen(groupKey), expression: "isOpen(groupKey)" }], staticClass: "pw-element-list" }, [_vm._l(_vm.groupedFields(group), function(fieldGroup, gIdx) {
        return [fieldGroup.isLabel ? _c("div", { key: "gl-" + gIdx, staticClass: "pw-nav-label" }, [_vm._v(" " + _vm._s(fieldGroup.labelText) + " ")]) : [fieldGroup.header ? _c("div", { key: "gh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
          return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(label))])]);
        }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
          return [_c("div", { key: "gf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: { "pw-dual-first": field.isTight, "pw-dual-next": field.isTightNext } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(field.label))])]), _c("div", { staticClass: "pw-field-row-options", class: fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "" }, [field.def.type === "visibility" ? _c("button", { staticClass: "pw-tab-visibility", attrs: { "type": "button" }, on: { "click": function($event) {
            _vm.setValue(field.varName, (_vm.getOverrideValue(field.varName) || field.def.value) === "true" ? "false" : "true", field.def.value);
          } } }, [_c("k-icon", { attrs: { "type": (_vm.getOverrideValue(field.varName) || field.def.value) === "true" ? "preview" : "hidden" } })], 1) : field.def.type === "icon-select" ? _c("div", { staticClass: "pw-icon-select" }, _vm._l(field.def.options, function(icon) {
            return _c("button", { key: icon, staticClass: "pw-icon-option", class: { "is-active": (_vm.getOverrideValue(field.varName) || field.def.value) === icon && (_vm.getOverrideValue(field.varName) || field.def.value) !== "none" }, attrs: { "type": "button" }, domProps: { "innerHTML": _vm._s(_vm.inlineIcons[icon]) }, on: { "click": function($event) {
              return _vm.toggleIcon(field.varName, icon, field.def.value);
            } } });
          }), 0) : field.def.type === "font-family" ? _c("select", { staticClass: "pw-element-input pw-font-select", domProps: { "value": _vm.fontSelectValue(field.varName, field.def.value) }, on: { "change": function($event) {
            return _vm.setValue(field.varName, $event.target.value, field.def.value);
          } } }, _vm._l(_vm.fontFamilyOptions, function(opt) {
            return _c("option", { key: opt.value, domProps: { "value": opt.value } }, [_vm._v(_vm._s(opt.text))]);
          }), 0) : field.def.options ? _c("k-toggles-input", { attrs: { "value": _vm.getOverrideValue(field.varName) || field.def.value, "options": _vm.filteredOptions(field.varName, field.def.options), "grow": false, "required": true }, on: { "input": function($event) {
            return _vm.setValue(field.varName, $event, field.def.value);
          } } }) : field.type === "color-group" ? _vm._l(field.def.fields, function(cgField, cgName) {
            return _c("pw-color-field-row", { key: cgName, attrs: { "group": "nav", "var-name": cgName, "default-value": cgField.value, "override-value": _vm.getOverrideValue(cgName) }, on: { "update:value": function($event) {
              return _vm.setValue(cgName, $event || "", cgField.value);
            } } });
          }) : field.def.type === "color" ? [_c("pw-color-field-row", { attrs: { "group": "nav", "var-name": field.varName, "default-value": field.def.value, "override-value": _vm.getOverrideValue(field.varName) }, on: { "update:value": function($event) {
            return _vm.setValue(field.varName, $event || "", field.def.value);
          } } })] : field.type === "multi-value" ? _vm._l(field.def.value, function(val, idx) {
            return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getQuadValue(field.varName, idx) }, attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || val) }, on: { "input": function($event) {
              return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit)))])]);
          }) : field.type === "responsive" ? _vm._l(["default", "lg", "xl"], function(bp) {
            return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getResponsiveOverride(field.varName, bp) }, attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "input": function($event) {
              return _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit);
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit)))])]);
          }) : field.def.unit !== void 0 ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(field.varName) }, attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(field.varName) || field.def.value) }, on: { "input": function($event) {
            return _vm.setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit);
          } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit)))])])] : field.def.type === "svg" ? [_vm.getOverrideValue(field.varName) ? [_c("label", { staticClass: "pw-svg-preview" }, [_c("div", { staticClass: "pw-svg-preview-checker", domProps: { "innerHTML": _vm._s(_vm.getOverrideValue(field.varName)) } }), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".svg" }, on: { "change": function($event) {
            return _vm.onSvgFileUpload(field.varName, $event, field.def.value);
          } } })]), _vm.dependentField(field.varName) ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-group-column-label", staticStyle: { "margin-right": "var(--spacing-2)" } }, [_vm._v("Height")]), _c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(_vm.dependentField(field.varName).varName) }, attrs: { "type": "number", "step": _vm.dependentField(field.varName).def.step || 0.1, "min": _vm.dependentField(field.varName).def.min, "max": _vm.dependentField(field.varName).def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(_vm.dependentField(field.varName).varName) || _vm.dependentField(field.varName).def.value) }, on: { "input": function($event) {
            _vm.setUnitValue(_vm.dependentField(field.varName).varName, $event.target.value, _vm.dependentField(field.varName).def.value, _vm.dependentField(field.varName).def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(_vm.dependentField(field.varName).def.unit))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(_vm.dependentField(field.varName).varName) || _vm.dependentField(field.varName).def.value, _vm.dependentField(field.varName).def.unit)))])])] : _vm._e(), _c("k-button", { attrs: { "text": "Remove", "icon": "remove", "size": "xs" }, on: { "click": function($event) {
            return _vm.removeSvg(field.varName);
          } } })] : _c("label", { staticClass: "pw-svg-upload-btn" }, [_c("k-icon", { attrs: { "type": "upload" } }), _vm._v(" Upload SVG "), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".svg" }, on: { "change": function($event) {
            return _vm.onSvgFileUpload(field.varName, $event, field.def.value);
          } } })], 1)] : _c("input", { staticClass: "pw-element-input", attrs: { "type": "text", "placeholder": field.def.value }, domProps: { "value": _vm.getOverrideValue(field.varName) }, on: { "input": function($event) {
            return _vm.setValue(field.varName, $event.target.value, field.def.value);
          } } })], 2)])])])];
        }), fieldGroup.header ? _c("div", { key: "ge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()]];
      }), group.colors ? [_vm.hasColors(group) ? _c("div", { staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-theme-color" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v("Default")])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v("Variant")])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v("Variant2")])])])]) : _vm._e(), _vm._l(group.colors, function(colorVal, varName, index) {
        return _c("div", { key: "color-" + varName, staticClass: "pw-field-row", class: {
          "pw-dual-first": _vm.isFollowedByColorState(group.colors, index),
          "pw-dual-next": varName.endsWith("-hover") || varName.endsWith("-active")
        } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.propLabel(varName)))])]), _c("div", { staticClass: "pw-field-row-options pw-group-type-theme-color" }, _vm._l(["default", "variant", "variant2"], function(theme) {
          return _c("pw-color-field-row", { key: theme, attrs: { "group": theme, "var-name": varName, "default-value": colorVal[theme] || "", "override-value": _vm.getColorOverrideValue(theme, varName) }, on: { "update:value": function($event) {
            return _vm.setColorValue(theme, varName, $event, colorVal[theme] || "");
          } } });
        }), 1)])])]);
      }), _c("div", { staticClass: "pw-group-end" })] : _vm._e()], 2)])], 1);
    }), 0);
  };
  var _sfc_staticRenderFns$1 = [];
  _sfc_render$1._withStripped = true;
  var __component__$1 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$1,
    _sfc_render$1,
    _sfc_staticRenderFns$1
  );
  __component__$1.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalNavigation.vue";
  const GlobalNavigation = __component__$1.exports;
  const _sfc_main = {
    props: {
      fonts: { type: Object, default: () => ({}) }
    },
    data() {
      return {
        showAddForm: false,
        newFont: {
          family: "",
          category: "",
          italic: null,
          style: "normal",
          weights: [],
          files: []
        },
        pendingFiles: []
      };
    },
    computed: {
      allFonts() {
        return { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
      },
      defaultFont() {
        return this.fonts.default || "Inter";
      },
      categoryOptions() {
        return ["sans-serif", "serif", "monospace", "display", "cursive"].map((c) => ({
          value: c,
          text: this.categoryLabel(c)
        }));
      },
      fontFamilyOptions() {
        return Object.values(this.allFonts).map((f) => ({
          value: f.family,
          text: f.family
        }));
      },
      canAddFont() {
        return this.newFont.family.trim() && this.newFont.category && this.newFont.italic !== null && this.newFont.weights.length > 0 && this.newFont.files.length > 0;
      },
      computedWeight() {
        if (this.newFont.weights.length === 0) return "";
        const sorted = [...this.newFont.weights].sort((a, b) => Number(a) - Number(b));
        if (sorted.length === 1) return sorted[0];
        return sorted[0] + " " + sorted[sorted.length - 1];
      }
    },
    methods: {
      resetAddForm() {
        this.newFont = { family: "", category: "", italic: null, style: "normal", weights: [], files: [] };
      },
      categoryLabel(cat) {
        const tKey = "prw.fontcategory." + cat;
        const t = this.$t(tKey);
        return t && t !== tKey ? t : cat;
      },
      formatWeight(w) {
        if (!w) return "";
        const parts = w.split(" ");
        return parts.length === 2 ? parts[0] + "–" + parts[1] : w;
      },
      isInWeightRange(w) {
        if (this.newFont.weights.length < 2) return false;
        const nums = this.newFont.weights.map(Number);
        const n = Number(w);
        return n > Math.min(...nums) && n < Math.max(...nums) && !this.newFont.weights.includes(w);
      },
      toggleWeight(w) {
        if (this.newFont.weights.length === 1 && this.newFont.weights[0] === w) {
          this.newFont.weights = [];
        } else if (this.newFont.weights.length >= 2) {
          this.newFont.weights = [w];
        } else {
          this.newFont.weights.push(w);
        }
      },
      onFileSelect(e) {
        const files = Array.from(e.target.files);
        for (const file of files) {
          if (!file.name.endsWith(".woff2")) continue;
          this.newFont.files.push({
            name: file.name,
            file,
            style: "normal"
          });
          this.pendingFiles.push(file);
        }
        e.target.value = "";
      },
      async addFont() {
        if (!this.canAddFont) return;
        for (const staged of this.newFont.files) {
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.readAsDataURL(staged.file);
          });
          await this.$api.post("projectwizard/fonts/upload", {
            name: staged.name,
            data: base64
          });
        }
        await this.$api.post("projectwizard/fonts", {
          family: this.newFont.family.trim(),
          category: this.newFont.category,
          italic: this.newFont.italic,
          files: this.newFont.files.map((f) => ({
            src: f.name,
            weight: this.computedWeight,
            style: this.newFont.italic ? "normal" : this.newFont.style
          }))
        });
        this.resetAddForm();
        this.pendingFiles = [];
        this.showAddForm = false;
        this.$emit("update");
      },
      async deleteFont(key) {
        const font = this.allFonts[key];
        const name = font ? font.family : key;
        if (!window.confirm('Delete font "' + name + '"?')) return;
        await this.$api.delete("projectwizard/fonts/" + key);
        this.$emit("update");
      },
      async setDefaultFont(family) {
        await this.$api.post("projectwizard/fonts/default", { family });
        this.$emit("update");
      }
    }
  };
  var _sfc_render = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-font-manager" }, [_c("section", { staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-section-header pw-font-header" }, [_c("span", { staticClass: "pw-section-title" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.installed") || "Installed Fonts"))]), _c("k-button", { attrs: { "text": _vm.showAddForm ? "Cancel" : _vm.$t("prw.fonts.add") || "Add Font", "icon": _vm.showAddForm ? "cancel" : "add", "size": "xs" }, on: { "click": function($event) {
      _vm.showAddForm = !_vm.showAddForm;
      if (!_vm.showAddForm) _vm.resetAddForm();
    } } })], 1), _c("div", { staticClass: "pw-element-list" }, [_vm._l(_vm.allFonts, function(font, key) {
      return _vm._l(font.files, function(file, fIdx) {
        return _c("div", { key: key + "-" + fIdx, staticClass: "pw-field-row", class: { "pw-dual-first": fIdx === 0 && font.files.length > 1, "pw-dual-next": fIdx > 0 } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-font-label-bold" }, [_vm._v(_vm._s(font.family))]), _c("span", { staticClass: "pw-quad-label" }, [_vm._v(_vm._s(_vm.categoryLabel(font.category)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-font-file-name" }, [_vm._v(_vm._s(file.src) + " "), _c("span", { staticClass: "pw-font-weight-label" }, [_vm._v(_vm._s(font.italic && font.files.length === 1 ? "normal, italic" : file.style) + ", " + _vm._s(_vm.formatWeight(file.weight)))])]), !font.builtin ? _c("button", { staticClass: "pw-font-delete", attrs: { "type": "button" }, on: { "click": function($event) {
          return _vm.deleteFont(key);
        } } }, [_vm._v("×")]) : _vm._e()])])])]);
      });
    })], 2)]), _vm.showAddForm ? _c("section", { staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("span", { staticClass: "pw-section-toggle" }, [_c("span", [_vm._v(_vm._s(_vm.$t("prw.fonts.add") || "Add Font"))])])]), _c("div", { staticClass: "pw-element-list" }, [_c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_vm._m(0), _c("div", { staticClass: "pw-field-row-options" }, [_c("label", { staticClass: "pw-font-upload-btn" }, [_c("k-icon", { attrs: { "type": "upload" } }), _vm._v(" Upload .woff2 "), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".woff2" }, on: { "change": _vm.onFileSelect } })], 1), _vm.newFont.files.length ? _c("span", { staticClass: "pw-font-file-selected" }, [_vm._v(_vm._s(_vm.newFont.files[0].name))]) : _vm._e()])])])]), _vm._m(1), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_vm._m(2), _c("div", { staticClass: "pw-field-row-options" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.newFont.family, expression: "newFont.family" }], staticClass: "pw-element-input pw-font-name-input", attrs: { "type": "text", "placeholder": "e.g. Acme, Roboto" }, domProps: { "value": _vm.newFont.family }, on: { "input": function($event) {
      if ($event.target.composing) return;
      _vm.$set(_vm.newFont, "family", $event.target.value);
    } } })])])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.nameHelp") || 'Enter the exact font family name as specified by the font provider (e.g. "Roboto", "Open Sans", "Playfair Display").') + " ")]), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_vm._m(3), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.newFont.category, "options": _vm.categoryOptions, "grow": false, "required": true }, on: { "input": function($event) {
      _vm.newFont.category = $event;
    } } })], 1)])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.categoryHelp") || "Select the font category. This is used as CSS fallback (e.g. sans-serif, serif) when the font is not yet loaded.") + " ")]), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_vm._m(4), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.newFont.italic === null ? "" : _vm.newFont.italic ? "yes" : "no", "options": [{ value: "yes", text: "Yes" }, { value: "no", text: "No" }], "grow": false, "required": true }, on: { "input": function($event) {
      _vm.newFont.italic = $event === "yes";
    } } }), _vm.newFont.italic === false ? [_c("span", { staticClass: "pw-font-inline-label" }, [_vm._v("Choose Style")]), _c("k-toggles-input", { attrs: { "value": _vm.newFont.style, "options": [{ value: "normal", text: "Normal" }, { value: "italic", text: "Italic" }], "grow": false, "required": true }, on: { "input": function($event) {
      _vm.newFont.style = $event;
    } } })] : _vm._e()], 2)])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.italicHelp") || "Enable if the font includes italic styles. Some variable fonts include italic in a separate file, others have it built-in.") + " ")]), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_vm._m(5), _c("div", { staticClass: "pw-field-row-options" }, [_c("div", { staticClass: "pw-weight-toggles" }, _vm._l(["100", "200", "300", "400", "500", "600", "700", "800", "900"], function(w) {
      return _c("button", { key: w, staticClass: "pw-weight-toggle", class: { "is-active": _vm.newFont.weights.includes(w), "is-in-range": _vm.isInWeightRange(w) }, attrs: { "type": "button" }, on: { "click": function($event) {
        return _vm.toggleWeight(w);
      } } }, [_vm._v(_vm._s(w))]);
    }), 0)])])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.weightHelp") || "Select one weight for static fonts, or multiple for variable fonts (e.g. 100–900).") + " ")]), _c("div", { staticClass: "pw-font-actions" }, [_c("k-button", { attrs: { "disabled": !_vm.canAddFont, "text": "Add Font", "icon": "check", "theme": "positive", "variant": "filled", "size": "sm" }, on: { "click": _vm.addFont } })], 1)])]) : _vm._e()]);
  };
  var _sfc_staticRenderFns = [function() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v("Font File *")])]);
  }, function() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-font-help" }, [_vm._v(" Upload a .woff2 font file. You can use "), _c("a", { attrs: { "href": "https://gwfh.mranftl.com/", "target": "_blank", "rel": "noopener" } }, [_vm._v("Google Webfonts Helper")]), _vm._v(" to download Google Fonts as .woff2. ")]);
  }, function() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v("Font Family Name *")])]);
  }, function() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v("Category *")])]);
  }, function() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v("Supports Italic Automatically *")])]);
  }, function() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v("Weight *")])]);
  }];
  _sfc_render._withStripped = true;
  var __component__ = /* @__PURE__ */ normalizeComponent(
    _sfc_main,
    _sfc_render,
    _sfc_staticRenderFns
  );
  __component__.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalFontManager.vue";
  const GlobalFontManager = __component__.exports;
  panel.plugin("kirbydesk/kirby-projectwizard", {
    components: {
      "pw-wizard-overview": Overview,
      "pw-field-row": FieldRow,
      "pw-color-field-row": ColorFieldRow,
      "pw-global-elements": GlobalElements,
      "pw-global-fonts": GlobalFonts,
      "pw-block-settings": BlockSettings,
      "pw-global-elements-styles": GlobalElementStyles,
      "pw-global-navigation": GlobalNavigation,
      "pw-global-font-manager": GlobalFontManager
    }
  });
})();
