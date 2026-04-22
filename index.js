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
  const _sfc_main$9 = {
    props: {
      blockType: {
        type: String,
        default: null
      }
    },
    data() {
      return {
        loading: true,
        blockPreviewOpen: true,
        blocksSubtab: "layout",
        discardKey: 0,
        fontsSubtab: "default",
        headerPill: "general",
        headerSubtab: "layout",
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
      blockPreviewBodyStyle() {
        var _a;
        const globalOv = this.globalOverrides.global || {};
        const globalDef = ((_a = this.globalDefaults.layout) == null ? void 0 : _a.vars) || {};
        const get = (v) => {
          var _a2;
          return globalOv[v] || ((_a2 = globalDef[v]) == null ? void 0 : _a2.value) || "";
        };
        return {
          backgroundColor: this.bodyBackgroundColor,
          paddingTop: get("global-margin-top") || "3rem",
          paddingBottom: get("global-margin-bottom") || "3rem"
        };
      },
      headerSubtabs() {
        const pill = this.headerPill || "general";
        const tabs = {
          desktop: [
            { key: "logo", label: this.$t("prw.subtab.logo"), vars: ["desktop-logo-src", "desktop-logo-display-height", "desktop-logo-align", "desktop-logo-padding"] },
            { key: "navigation", label: this.$t("prw.subtab.navigation"), vars: ["home-desktop", "desktop-height", "desktop-items-align", "desktop-items-padding", "desktop-font-size", "desktop-line-height", "desktop-letter-spacing"] },
            { key: "navigation-colors", label: this.$t("prw.subtab.navigation-colors"), vars: ["desktop-background", "desktop-textcolor", "desktop-textcolor-hover", "desktop-textcolor-active"] },
            { key: "flyout", label: this.$t("prw.subtab.flyout"), vars: ["desktop-flyout-icon", "desktop-flyout-flip-from", "desktop-flyout-min-width"] },
            { key: "flyout-colors", label: this.$t("prw.subtab.flyout-colors"), vars: ["flyout-bordercolor", "flyout-bgcolor", "flyout-bgcolor-hover", "flyout-bgcolor-active", "flyout-textcolor", "flyout-textcolor-hover", "flyout-textcolor-active"] }
          ],
          tablet: [
            { key: "logo", label: this.$t("prw.subtab.logo"), vars: ["tablet-logo-src", "tablet-logo-display-height", "tablet-logo-align", "tablet-logo-padding"] },
            { key: "navigation", label: this.$t("prw.subtab.navigation"), vars: ["home-tablet", "tablet-height", "tablet-items-align", "tablet-items-padding", "tablet-font-size", "tablet-line-height", "tablet-letter-spacing"] }
          ],
          mobile: [
            { key: "layout", label: this.$t("prw.subtab.layout"), vars: ["home-mobile", "mobile-height", "mobile-logo-src", "mobile-logo-display-height", "mobile-font-size", "mobile-line-height", "mobile-letter-spacing"] },
            { key: "colors", label: this.$t("prw.subtab.colors"), vars: ["mobile-title-color", "mobile-language-color", "mobile-l1-color", "mobile-l1-active-color", "mobile-l2-color", "mobile-l2-active-color", "mobile-l1-bordercolor", "mobile-l2-bordercolor"] }
          ]
        };
        return tabs[pill] || [];
      },
      headerNavShowOnly() {
        const subtabs = this.headerSubtabs;
        if (!subtabs.length) return null;
        const active = subtabs.find((t) => t.key === this.headerSubtab) || subtabs[0];
        return active.vars;
      },
      bodyBackgroundColor() {
        var _a, _b;
        const ov = (this.globalOverrides.global || {})["body-background"];
        if (ov) return ov;
        const def = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.vars) == null ? void 0 : _b["body-background"];
        if (def) return def.value || "#E8E8E8";
        return "#E8E8E8";
      },
      blockPreviewFontInfo() {
        const family = this.bodyDefaultFont;
        const allFonts = { ...this.fontsData.builtin || {}, ...this.fontsData.project || {} };
        let category = "sans-serif";
        for (const f of Object.values(allFonts)) {
          if (f.family === family) {
            category = f.category || "sans-serif";
            break;
          }
        }
        return { family, category };
      },
      defaultFontPreviewStyle() {
        const family = this.bodyDefaultFont;
        const allFonts = { ...this.fontsData.builtin || {}, ...this.fontsData.project || {} };
        let category = "sans-serif";
        for (const f of Object.values(allFonts)) {
          if (f.family === family) {
            category = f.category || "sans-serif";
            break;
          }
        }
        return { fontFamily: "'" + family + "', " + category };
      },
      isDirty() {
        if (this.activeTab === "global") {
          const tab = this.globalActiveTab;
          if (tab === "settings") return !!this.dirtyTabs["global"];
          if (tab === "blocks" || tab === "fonts") return !!this.dirtyTabs["global-settings"];
          return !!this.dirtyTabs[tab];
        }
        return !!this.dirtyTabs[this.activeTab];
      }
    },
    watch: {
      blockType: {
        immediate: true,
        handler(val) {
          this.activeTab = val || "global";
        }
      },
      globalOverrides: { deep: true, handler() {
        this.injectPreviewStyles();
      } },
      elementOverrides: { deep: true, handler() {
        this.injectPreviewStyles();
      } },
      navOverrides: { deep: true, handler() {
        this.injectPreviewStyles();
      } }
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
          this.injectFontFaces();
          this.injectPreviewStyles();
        } catch (e) {
          console.error("Failed to load fonts", e);
        }
      },
      blockPreviewStyle(theme) {
        var _a, _b, _c, _d;
        const bg = ((this.globalOverrides.global || {})[theme] || {})["block-background"] || ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b["block-background"]) == null ? void 0 : _c[theme]) || "#ffffff";
        const globalOv = this.globalOverrides.global || {};
        const globalDef = ((_d = this.globalDefaults.layout) == null ? void 0 : _d.vars) || {};
        const getGlobal = (v) => {
          var _a2;
          return globalOv[v] || ((_a2 = globalDef[v]) == null ? void 0 : _a2.value) || "";
        };
        const getGlobalQuad = (v) => {
          var _a2;
          const ov = globalOv[v];
          if (Array.isArray(ov)) return ov;
          return ((_a2 = globalDef[v]) == null ? void 0 : _a2.value) || [];
        };
        const radius = getGlobalQuad("global-");
        let borderRadius = "0 0 0 0";
        if (Array.isArray(radius) && radius.length === 4) {
          if (theme === "default") {
            borderRadius = radius[0] + " " + radius[1] + " 0 0";
          } else if (theme === "variant2") {
            borderRadius = "0 0 " + radius[3] + " " + radius[2];
          } else {
            borderRadius = "0";
          }
        }
        return {
          backgroundColor: bg,
          paddingTop: getGlobal("global-padding-top") || "1.5rem",
          paddingBottom: getGlobal("global-padding-bottom") || "1.5rem",
          paddingLeft: getGlobal("global-padding-left") || "3rem",
          paddingRight: getGlobal("global-padding-right") || "3rem",
          borderRadius
        };
      },
      blockPreviewLabelColor(theme) {
        var _a, _b, _c;
        const bg = ((this.globalOverrides.global || {})[theme] || {})["block-background"] || ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b["block-background"]) == null ? void 0 : _c[theme]) || "#ffffff";
        if (bg.length < 7) return "";
        const r = parseInt(bg.slice(1, 3), 16);
        const g = parseInt(bg.slice(3, 5), 16);
        const b = parseInt(bg.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1e3 > 160 ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)";
      },
      blockPreviewElementStyle(element, theme) {
        var _a, _b;
        const elDef = this.elementDefaults[element] || {};
        const elOv = this.elementOverrides.global || {};
        const get = (v) => elOv[v] || "";
        const def = (v) => {
          var _a2;
          const d = (_a2 = elDef.vars) == null ? void 0 : _a2[v];
          if (!d) return "";
          if (d.default !== void 0) return d.default;
          return d.value || "";
        };
        let fontFamily = get(element + "-font-family") || def(element + "-font-family");
        if (!fontFamily || fontFamily === "default") fontFamily = this.bodyDefaultFont;
        const allFonts = { ...this.fontsData.builtin || {}, ...this.fontsData.project || {} };
        let fontCategory = "sans-serif";
        for (const f of Object.values(allFonts)) {
          if (f.family === fontFamily) {
            fontCategory = f.category || "sans-serif";
            break;
          }
        }
        const colorVar = "element-" + element + "-text";
        const colorOv = (elOv[theme] || {})[colorVar];
        const colorDef = ((_b = (_a = elDef.colors) == null ? void 0 : _a[colorVar]) == null ? void 0 : _b[theme]) || "";
        return {
          fontFamily: "'" + fontFamily + "', " + fontCategory,
          fontWeight: get(element + "-font-weight") || def(element + "-font-weight"),
          fontStyle: get(element + "-font-style") || def(element + "-font-style"),
          fontSize: def(element + "-font-size"),
          lineHeight: def(element + "-line-height"),
          letterSpacing: def(element + "-letter-spacing"),
          textTransform: get(element + "-text-transform") || def(element + "-text-transform"),
          color: colorOv || colorDef,
          margin: 0
        };
      },
      blockPreviewLinkStyle(theme, state) {
        var _a, _b, _c;
        const key = "block-link" + (state || "");
        const colorOv = ((this.globalOverrides.global || {})[theme] || {})[key];
        const colorDef = ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b[key]) == null ? void 0 : _c[theme]) || "#1D548B";
        return {
          color: colorOv || colorDef,
          textDecoration: "underline",
          cursor: "default"
        };
      },
      blockPreviewButtonStyle(theme, state) {
        var _a, _b, _c, _d;
        const elDef = this.elementDefaults.button || {};
        const elOv = this.elementOverrides.global || {};
        const get = (v) => elOv[v] || "";
        const def = (v) => {
          var _a2;
          const d = (_a2 = elDef.vars) == null ? void 0 : _a2[v];
          if (!d) return "";
          return d.value || "";
        };
        let fontFamily = get("button-font-family") || def("button-font-family");
        if (!fontFamily || fontFamily === "default") fontFamily = this.bodyDefaultFont;
        const allFonts = { ...this.fontsData.builtin || {}, ...this.fontsData.project || {} };
        let fontCategory = "sans-serif";
        for (const f of Object.values(allFonts)) {
          if (f.family === fontFamily) {
            fontCategory = f.category || "sans-serif";
            break;
          }
        }
        const colorVal = (name) => {
          var _a2, _b2;
          return (elOv[theme] || {})[name] || ((_b2 = (_a2 = elDef.colors) == null ? void 0 : _a2[name]) == null ? void 0 : _b2[theme]) || "";
        };
        const paddingOv = elOv["button-padding"];
        const padding = Array.isArray(paddingOv) ? paddingOv : ((_b = (_a = elDef.vars) == null ? void 0 : _a["button-padding"]) == null ? void 0 : _b.value) || [];
        const radiusOv = elOv["button-border-radius"];
        const radius = Array.isArray(radiusOv) ? radiusOv : ((_d = (_c = elDef.vars) == null ? void 0 : _c["button-border-radius"]) == null ? void 0 : _d.value) || [];
        return {
          fontFamily: "'" + fontFamily + "', " + fontCategory,
          fontWeight: get("button-font-weight") || def("button-font-weight"),
          fontStyle: get("button-font-style") || def("button-font-style"),
          fontSize: def("button-font-size"),
          lineHeight: def("button-line-height"),
          letterSpacing: def("button-letter-spacing"),
          textTransform: get("button-text-transform") || def("button-text-transform"),
          color: colorVal("element-button-text" + (state || "")),
          backgroundColor: colorVal("element-button-background" + (state || "")),
          borderColor: colorVal("element-button-border" + (state || "")),
          borderWidth: "1px",
          borderStyle: "solid",
          padding: Array.isArray(padding) ? padding.join(" ") : padding,
          borderRadius: Array.isArray(radius) ? radius.join(" ") : radius,
          display: "inline-block",
          marginTop: "0.5rem",
          cursor: "default"
        };
      },
      injectPreviewStyles() {
        var _a;
        const id = "pw-panel-preview-states";
        let style = document.getElementById(id);
        if (!style) {
          style = document.createElement("style");
          style.id = id;
          document.head.appendChild(style);
        }
        const rules = [];
        for (const theme of ["default", "variant", "variant2"]) {
          const linkHover = this.blockPreviewLinkColor(theme, "-hover");
          const linkActive = this.blockPreviewLinkColor(theme, "-active");
          rules.push(".pw-preview-link-" + theme + ":hover { color: " + linkHover + " !important; }");
          rules.push(".pw-preview-link-" + theme + ":active { color: " + linkActive + " !important; }");
          const btnHover = this.blockPreviewBtnColors(theme, "-hover");
          const btnActive = this.blockPreviewBtnColors(theme, "-active");
          rules.push(".pw-preview-btn-" + theme + ":hover { color: " + btnHover.color + " !important; background-color: " + btnHover.bg + " !important; border-color: " + btnHover.border + " !important; }");
          rules.push(".pw-preview-btn-" + theme + ":active { color: " + btnActive.color + " !important; background-color: " + btnActive.bg + " !important; border-color: " + btnActive.border + " !important; }");
        }
        const navOv = this.navOverrides.global || {};
        const navDef = ((_a = this.navDefaults.desktop) == null ? void 0 : _a.vars) || {};
        const navColor = (name, fallback) => {
          var _a2;
          return navOv[name] || ((_a2 = navDef[name]) == null ? void 0 : _a2.value) || fallback;
        };
        rules.push(".pw-nav-preview-item span:hover { color: " + navColor("desktop-textcolor-hover", "#101828") + " !important; }");
        rules.push(".pw-nav-preview-item span:active { color: " + navColor("desktop-textcolor-active", "#101828") + " !important; }");
        rules.push(".pw-nav-preview-flyout-item:hover { color: " + navColor("flyout-textcolor-hover", "#ffffff") + " !important; background-color: " + navColor("flyout-bgcolor-hover", "#1D548B") + " !important; }");
        rules.push(".pw-nav-preview-flyout-item:active { color: " + navColor("flyout-textcolor-active", "#ffffff") + " !important; background-color: " + navColor("flyout-bgcolor-active", "#164073") + " !important; }");
        style.textContent = rules.join("\n");
      },
      blockPreviewLinkColor(theme, state) {
        var _a, _b, _c;
        const key = "block-link" + (state || "");
        const colorOv = ((this.globalOverrides.global || {})[theme] || {})[key];
        return colorOv || ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b[key]) == null ? void 0 : _c[theme]) || "#1D548B";
      },
      blockPreviewBtnColors(theme, state) {
        const elDef = this.elementDefaults.button || {};
        const elOv = this.elementOverrides.global || {};
        const colorVal = (name) => {
          var _a, _b;
          return (elOv[theme] || {})[name] || ((_b = (_a = elDef.colors) == null ? void 0 : _a[name]) == null ? void 0 : _b[theme]) || "";
        };
        return {
          color: colorVal("element-button-text" + (state || "")),
          bg: colorVal("element-button-background" + (state || "")),
          border: colorVal("element-button-border" + (state || ""))
        };
      },
      injectFontFaces() {
        const id = "pw-panel-fontfaces";
        let style = document.getElementById(id);
        if (!style) {
          style = document.createElement("style");
          style.id = id;
          document.head.appendChild(style);
        }
        const allFonts = { ...this.fontsData.builtin || {}, ...this.fontsData.project || {} };
        const rules = [];
        for (const font of Object.values(allFonts)) {
          for (const file of font.files || []) {
            rules.push(
              "@font-face { font-family: '" + font.family + "'; src: url('/assets/fonts/" + file.src + "') format('woff2'); font-weight: " + (file.weight || "400") + "; font-style: " + (file.style || "normal") + "; font-display: swap; }"
            );
          }
        }
        style.textContent = rules.join("\n");
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
      async saveCurrentView() {
        if (this.activeTab === "global") {
          const tab = this.globalActiveTab;
          if (tab === "settings") {
            await this.saveGlobal();
          } else if (tab === "blocks" || tab === "fonts") {
            await this.saveGlobalSettings();
          } else if (tab === "elements") {
            await this.saveElements();
          } else if (tab === "header") {
            await this.saveNavigation();
          } else if (tab === "footer") {
            await this.saveFooter();
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
          const tab = this.globalActiveTab;
          if (tab === "settings") {
            this.activeBlocks = [...this.originalActiveBlocks];
            for (const block of this.blocks) {
              block.active = this.activeBlocks.includes(block.blockType);
            }
            this.$set(this.dirtyTabs, "global", false);
          } else if (tab === "blocks" || tab === "fonts") {
            this.globalOverrides = JSON.parse(JSON.stringify(this.originalGlobalOverrides));
            this.$set(this.dirtyTabs, "global-settings", false);
          } else if (tab === "elements") {
            this.elementOverrides = JSON.parse(JSON.stringify(this.originalElementOverrides));
            this.fontOverrides = JSON.parse(JSON.stringify(this.originalFontOverrides));
            this.$set(this.dirtyTabs, "elements", false);
          } else if (tab === "header") {
            this.navOverrides = JSON.parse(JSON.stringify(this.originalNavOverrides));
            this.$set(this.dirtyTabs, "header", false);
          } else if (tab === "footer") {
            this.footerOverrides = JSON.parse(JSON.stringify(this.originalFooterOverrides));
            this.$set(this.dirtyTabs, "footer", false);
          }
        } else {
          const bt = this.activeTab;
          this.$set(this.blockOverrides, bt, JSON.parse(JSON.stringify(this.originalOverrides[bt] || {})));
          this.$set(this.dirtyTabs, this.activeTab, false);
        }
        this.discardKey++;
      },
      async saveGlobal() {
        try {
          await this.$api.post("projectwizard/blocks/active", { blocks: this.activeBlocks });
          this.originalActiveBlocks = [...this.activeBlocks];
          this.$set(this.snapshots, "global", JSON.stringify(this.activeBlocks));
          this.$set(this.dirtyTabs, "global", false);
          this.$panel.notification.success("Blocks settings saved");
          setTimeout(() => window.location.reload(), 100);
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
      safeOverrides(ov) {
        return ov && !Array.isArray(ov) ? ov : {};
      }
    }
  };
  var _sfc_render$9 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-panel-inside", { staticClass: "pw-wizard" }, [_c("k-header", { scopedSlots: _vm._u([_vm.isDirty ? { key: "buttons", fn: function() {
      return [_c("div", { staticClass: "k-form-controls" }, [_c("div", { staticClass: "k-button-group", attrs: { "data-layout": "collapsed" } }, [_c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": "Discard", "icon": "undo", "theme": "notice", "variant": "filled", "size": "sm", "responsive": "true" }, on: { "click": _vm.discardChanges } }), _c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": "Save", "icon": "check", "theme": "notice", "variant": "filled", "size": "sm" }, on: { "click": _vm.saveCurrentView } })], 1)])];
    }, proxy: true } : null], null, true) }, [_vm._v(" " + _vm._s(_vm.blockType ? _vm.blockLabel(_vm.blockType) : "Project Wizard") + " ")]), !_vm.loading && _vm.activeTab === "global" ? _c("nav", { staticClass: "k-tabs k-model-tabs" }, _vm._l([
      { key: "blocks", icon: "prw-blocks" },
      { key: "elements", icon: "layers" },
      { key: "fonts", icon: "title" },
      { key: "header", icon: "prw-header" },
      { key: "footer", icon: "prw-footer" },
      { key: "settings", icon: "settings" }
    ], function(tab) {
      return _c("button", { key: tab.key, staticClass: "k-tabs-button k-button", attrs: { "type": "button", "aria-current": _vm.globalActiveTab === tab.key ? "true" : null, "data-has-icon": "true", "data-has-text": "true", "data-variant": "dimmed" }, on: { "click": function($event) {
        _vm.globalActiveTab = tab.key;
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": tab.icon } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab." + tab.key)))])]);
    }), 0) : _vm._e(), _vm.loading ? _c("div", { staticClass: "pw-wizard-loading" }, [_vm._v("Loading...")]) : _c("div", { staticClass: "pw-wizard-content" }, [_vm.activeTab === "global" ? _c("div", { staticClass: "pw-wizard-panel" }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "settings", expression: "globalActiveTab === 'settings'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-elements", { attrs: { "blocks": _vm.blocks }, on: { "toggle": function($event) {
      return _vm.toggleBlock($event.blockType, $event.checked);
    } } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "blocks", expression: "globalActiveTab === 'blocks'" }], staticClass: "pw-wizard-global-content" }, [_c("div", { staticClass: "pw-block-preview-body", style: _vm.blockPreviewBodyStyle }, [_c("div", { staticClass: "pw-block-preview-row" }, _vm._l(["default", "variant", "variant2"], function(theme) {
      return _c("div", { key: theme, staticClass: "pw-block-preview", style: _vm.blockPreviewStyle(theme) }, [_c("p", { style: _vm.blockPreviewElementStyle("tagline", theme) }, [_vm._v("Tagline goes here")]), _c("h2", { style: _vm.blockPreviewElementStyle("heading", theme) }, [_vm._v("The quick brown fox")]), _c("p", { style: _vm.blockPreviewElementStyle("editor", theme) }, [_vm._v("Pack my box with "), _c("a", { class: "pw-preview-link-" + theme, style: _vm.blockPreviewLinkStyle(theme, "") }, [_vm._v("five dozen liquor jugs")]), _vm._v(". How vexingly quick daft zebras jump. The five boxing wizards jump quickly at dawn.")]), _c("a", { class: "pw-preview-btn-" + theme, style: _vm.blockPreviewButtonStyle(theme, "") }, [_vm._v("Click here")])]);
    }), 0)]), _c("div", { staticClass: "pw-element-subtabs" }, [_c("button", { staticClass: "pw-element-subtab", class: { "is-active": (_vm.blocksSubtab || "layout") === "layout" }, attrs: { "type": "button" }, on: { "click": function($event) {
      _vm.blocksSubtab = "layout";
    } } }, [_vm._v(_vm._s(_vm.$t("prw.subtab.layout")))]), _c("button", { staticClass: "pw-element-subtab", class: { "is-active": _vm.blocksSubtab === "colors" }, attrs: { "type": "button" }, on: { "click": function($event) {
      _vm.blocksSubtab = "colors";
    } } }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))])]), _c("pw-global-navigation", { directives: [{ name: "show", rawName: "v-show", value: (_vm.blocksSubtab || "layout") === "layout", expression: "(blocksSubtab || 'layout') === 'layout'" }], attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-only": ["global-margin-top", "global-margin-bottom", "global-padding-left", "global-padding-right", "global-padding-top", "global-padding-bottom", "global-"], "hide-section-headers": true }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } }), _c("pw-global-navigation", { directives: [{ name: "show", rawName: "v-show", value: _vm.blocksSubtab === "colors", expression: "blocksSubtab === 'colors'" }], attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-only": ["body-background"], "show-colors": true, "hide-section-headers": true }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "fonts", expression: "globalActiveTab === 'fonts'" }], staticClass: "pw-wizard-global-content" }, [_c("div", { staticClass: "pw-default-font-preview", style: _vm.defaultFontPreviewStyle }, [_vm._v("The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.")]), _c("div", { staticClass: "pw-element-subtabs" }, [_c("button", { staticClass: "pw-element-subtab", class: { "is-active": (_vm.fontsSubtab || "default") === "default" }, attrs: { "type": "button" }, on: { "click": function($event) {
      _vm.fontsSubtab = "default";
    } } }, [_vm._v(_vm._s(_vm.$t("prw.subtab.default-font")))]), _c("button", { staticClass: "pw-element-subtab", class: { "is-active": _vm.fontsSubtab === "installed" }, attrs: { "type": "button" }, on: { "click": function($event) {
      _vm.fontsSubtab = "installed";
    } } }, [_vm._v(_vm._s(_vm.$t("prw.subtab.installed-fonts")))]), _c("button", { staticClass: "pw-element-subtab", class: { "is-active": _vm.fontsSubtab === "add" }, attrs: { "type": "button" }, on: { "click": function($event) {
      _vm.fontsSubtab = "add";
    } } }, [_vm._v(_vm._s(_vm.$t("prw.subtab.add-font")))])]), _c("pw-global-navigation", { directives: [{ name: "show", rawName: "v-show", value: (_vm.fontsSubtab || "default") === "default", expression: "(fontsSubtab || 'default') === 'default'" }], attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-only": ["font-family-default"], "hide-section-headers": true }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } }), _c("pw-global-font-manager", { directives: [{ name: "show", rawName: "v-show", value: _vm.fontsSubtab === "installed", expression: "fontsSubtab === 'installed'" }], attrs: { "fonts": _vm.fontsData, "mode": "installed" }, on: { "update": _vm.loadFontsData } }), _c("pw-global-font-manager", { directives: [{ name: "show", rawName: "v-show", value: _vm.fontsSubtab === "add", expression: "fontsSubtab === 'add'" }], attrs: { "fonts": _vm.fontsData, "mode": "add" }, on: { "update": _vm.loadFontsData } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "elements", expression: "globalActiveTab === 'elements'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-elements-styles", { attrs: { "element-defaults": _vm.elementDefaults, "element-overrides": _vm.elementOverrides, "saved-overrides": _vm.originalElementOverrides, "discard-key": _vm.discardKey, "global-defaults": _vm.globalDefaults, "global-overrides": _vm.globalOverrides, "fonts": _vm.fontsData, "font-defaults": _vm.fontDefaults, "font-overrides": _vm.fontOverrides, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onElementOverridesUpdate, "update:font-overrides": _vm.onFontOverridesUpdate } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "header", expression: "globalActiveTab === 'header'" }], staticClass: "pw-wizard-global-content" }, [_c("div", { staticClass: "pw-element-pills" }, _vm._l(["general", "desktop", "tablet", "mobile"], function(pill) {
      return _c("button", { key: pill, staticClass: "pw-element-pill", class: { "is-active": (_vm.headerPill || "general") === pill }, attrs: { "type": "button" }, on: { "click": function($event) {
        _vm.headerPill = pill;
        _vm.headerSubtab = null;
      } } }, [_vm._v(_vm._s(_vm.$t("prw.prop." + pill) || pill))]);
    }), 0), _c("pw-global-navigation", { directives: [{ name: "show", rawName: "v-show", value: (_vm.headerPill || "general") === "general", expression: "(headerPill || 'general') === 'general'" }], attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "saved-overrides": _vm.originalNavOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-group": "general", "hide-section-headers": true }, on: { "update:overrides": _vm.onNavOverridesUpdate } }), _vm.headerPill && _vm.headerPill !== "general" ? [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-group": _vm.headerPill, "show-preview": true, "show-flyout": _vm.headerSubtab === "flyout" || _vm.headerSubtab === "flyout-colors", "hide-section-headers": true }, on: { "update:overrides": _vm.onNavOverridesUpdate } }), _c("div", { staticClass: "pw-element-subtabs" }, _vm._l(_vm.headerSubtabs, function(st) {
      return _c("button", { key: st.key, staticClass: "pw-element-subtab", class: { "is-active": (_vm.headerSubtab || _vm.headerSubtabs[0].key) === st.key }, attrs: { "type": "button" }, on: { "click": function($event) {
        _vm.headerSubtab = st.key;
      } } }, [_vm._v(_vm._s(st.label))]);
    }), 0), _c("pw-global-navigation", { attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "saved-overrides": _vm.originalNavOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-group": _vm.headerPill, "show-only": _vm.headerNavShowOnly, "show-colors": true, "hide-section-headers": true, "hide-preview": true }, on: { "update:overrides": _vm.onNavOverridesUpdate } })] : _vm._e()], 2), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "footer", expression: "globalActiveTab === 'footer'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.footerDefaults, "nav-overrides": _vm.footerOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onFooterOverridesUpdate } })], 1)]) : _vm._e(), _vm._l(_vm.blocks, function(block) {
      return _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === block.blockType, expression: "activeTab === block.blockType" }], key: block.blockType, staticClass: "pw-wizard-panel" }, [_vm.blockConfigs[block.blockType] ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.blockViewTab === "settings", expression: "blockViewTab === 'settings'" }] }, [_c("pw-block-settings", { attrs: { "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1) : _vm._e()]);
    })], 2)], 1);
  };
  var _sfc_staticRenderFns$9 = [];
  _sfc_render$9._withStripped = true;
  var __component__$9 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$9,
    _sfc_render$9,
    _sfc_staticRenderFns$9
  );
  __component__$9.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/Overview.vue";
  const Overview = __component__$9.exports;
  const _sfc_main$8 = {
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
  var _sfc_render$8 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row", class: { "is-disabled": !_vm.enabled, "is-modified": _vm.modified || _vm.touched } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [!_vm.noCheckbox ? _c("input", { staticClass: "pw-field-row-check", attrs: { "id": "pw-prop-" + _vm.uid, "type": "checkbox" }, domProps: { "checked": _vm.active }, on: { "change": function($event) {
      return _vm.toggleActive($event.target.checked);
    } } }) : _vm._e(), _c("label", { staticClass: "pw-field-row-label", attrs: { "for": _vm.noCheckbox ? null : "pw-prop-" + _vm.uid } }, [_vm._v(_vm._s(_vm.propertyLabel(_vm.label))), _vm.required ? _c("span", { staticClass: "pw-field-required" }, [_vm._v("*")]) : _vm._e()])]), _vm.active ? _c("div", { staticClass: "pw-field-row-options" }, _vm._l(_vm.allOptions.filter((o) => o !== "|"), function(opt) {
      return _c("button", { key: opt, staticClass: "pw-field-row-option", class: {
        "is-active": _vm.localActive.includes(opt),
        "is-default": !_vm.noDefault && opt === _vm.localDefault,
        "is-plugin-default": !_vm.noDefault && opt === _vm.pluginDefault && !_vm.touched && !_vm.modified
      }, attrs: { "type": "button" }, on: { "click": function($event) {
        return _vm.handleClick(opt);
      } } }, [_vm._v(" " + _vm._s(_vm.optionLabel(opt)) + " ")]);
    }), 0) : _vm._e()])])]);
  };
  var _sfc_staticRenderFns$8 = [];
  _sfc_render$8._withStripped = true;
  var __component__$8 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$8,
    _sfc_render$8,
    _sfc_staticRenderFns$8
  );
  __component__$8.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/FieldRow.vue";
  const FieldRow = __component__$8.exports;
  const _sfc_main$7 = {
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
  var _sfc_render$7 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-color-field" }, [_c("k-color-field", { attrs: { "value": _vm.displayValue, "alpha": true, "mode": "picker" }, on: { "input": _vm.onInput } })], 1);
  };
  var _sfc_staticRenderFns$7 = [];
  _sfc_render$7._withStripped = true;
  var __component__$7 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$7,
    _sfc_render$7,
    _sfc_staticRenderFns$7
  );
  __component__$7.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/ColorFieldRow.vue";
  const ColorFieldRow = __component__$7.exports;
  const _sfc_main$6 = {
    props: {
      blocks: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return { open: true };
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
  var _sfc_render$6 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", [_c("section", { staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
      _vm.open = !_vm.open;
    } } }, [_c("span", [_vm._v(_vm._s(_vm.$t("prw.headline.activeBlocks") || "Active Blocks"))]), _c("k-icon", { attrs: { "type": _vm.open ? "angle-down" : "angle-right" } })], 1)]), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.open, expression: "open" }], staticClass: "pw-element-list" }, _vm._l(_vm.blocks, function(block) {
      return _c("div", { key: block.blockType, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.blockLabel(block.blockType)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": block.active ? "true" : "false", "options": [{ value: "true", text: _vm.$t("pw.option.enabled") || "Enabled" }, { value: "false", text: _vm.$t("pw.option.disabled") || "Disabled" }], "grow": false, "required": true }, on: { "input": function($event) {
        return _vm.$emit("toggle", { blockType: block.blockType, checked: $event === "true" });
      } } })], 1)])])]);
    }), 0)])], 1)]);
  };
  var _sfc_staticRenderFns$6 = [];
  _sfc_render$6._withStripped = true;
  var __component__$6 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$6,
    _sfc_render$6,
    _sfc_staticRenderFns$6
  );
  __component__$6.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalElements.vue";
  const GlobalElements = __component__$6.exports;
  const _sfc_main$5 = {
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
          const headlineKey = "pw.headline." + key.substring(0, lastDash) + "." + key.substring(lastDash + 1);
          const headlineT = this.$t(headlineKey);
          if (headlineT && headlineT !== headlineKey) return headlineT;
        }
        return key;
      },
      toggleOptionLabel(val) {
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
  var _sfc_render$5 = function render() {
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
          return _c("k-toggle-input", { key: sub.key, attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + sub.key + ".default", sub.defaultValue), "text": _vm.toggleOptionLabel(sub.label) }, on: { "input": function($event) {
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
  var _sfc_staticRenderFns$5 = [];
  _sfc_render$5._withStripped = true;
  var __component__$5 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$5,
    _sfc_render$5,
    _sfc_staticRenderFns$5
  );
  __component__$5.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/BlockSettings.vue";
  const BlockSettings = __component__$5.exports;
  const _sfc_main$4 = {
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
  var _sfc_render$4 = function render() {
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
  var _sfc_staticRenderFns$4 = [];
  _sfc_render$4._withStripped = true;
  var __component__$4 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$4,
    _sfc_render$4,
    _sfc_staticRenderFns$4
  );
  __component__$4.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalFonts.vue";
  const GlobalFonts = __component__$4.exports;
  const _sfc_main$3 = {
    props: {
      elementDefaults: {
        type: Object,
        default: () => ({})
      },
      elementOverrides: {
        type: Object,
        default: () => ({})
      },
      globalDefaults: {
        type: Object,
        default: () => ({})
      },
      globalOverrides: {
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
      },
      savedOverrides: {
        type: Object,
        default: () => ({})
      },
      discardKey: {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        activeElement: null,
        openSections: {},
        resetFields: /* @__PURE__ */ new Set()
      };
    },
    watch: {
      savedOverrides: {
        handler() {
          this.resetFields = /* @__PURE__ */ new Set();
        }
      },
      discardKey() {
        this.resetFields = /* @__PURE__ */ new Set();
      },
      pillGroups: {
        immediate: true,
        handler(g) {
          if (!this.activeElement && g) {
            const keys = Object.keys(g);
            if (keys.length) this.activeElement = keys[0];
          }
        }
      }
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
      elementGrouping() {
        return { cite: "quote", caption: "media" };
      },
      pillGroups() {
        const result = {};
        for (const [key, val] of Object.entries(this.groups)) {
          if (!this.elementGrouping[key]) {
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
      isElementVisible(groupKey) {
        if (this.activeElement === groupKey) return true;
        const parent = this.elementGrouping[groupKey];
        return parent && this.activeElement === parent;
      },
      isChildElement(groupKey) {
        return !!this.elementGrouping[groupKey];
      },
      toggle(key) {
        this.$set(this.openSections, key, !this.isOpen(key));
      },
      isOpen(key) {
        return this.openSections[key] !== false;
      },
      groupLabel(key) {
        const tKey = "prw.elementgroup." + key;
        const t = this.$t(tKey);
        return t && t !== tKey ? t : key;
      },
      propLabel(varName) {
        const tKey = "prw.element." + varName;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        const firstDash = varName.indexOf("-");
        if (firstDash > 0) {
          const propKey = "prw.prop." + varName.substring(firstDash + 1);
          const propT = this.$t(propKey);
          if (propT && propT !== propKey) return propT;
        }
        return varName;
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
      groupedVarFields(group, category) {
        return this.groupedFields(group, "vars", category);
      },
      groupedColorFields(group) {
        return this.groupedFields(group, "colors");
      },
      groupedFields(group, only, category) {
        const allFields = [];
        const colorFields = [];
        if (group.colors && only !== "vars") {
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
        if (group.vars && only !== "colors") {
          for (const [varName, def] of Object.entries(group.vars)) {
            if (category && this.varCategory(varName) !== category) continue;
            const sig = this.fieldSignature(varName, def, false);
            allFields.push({
              varName,
              def,
              label: this.propLabel(varName),
              type: sig.type,
              sigLabels: sig.labels,
              sigKey: sig.type === "single" ? "single-" + varName : sig.type + ":" + (sig.labels || []).join(",")
            });
          }
        }
        if (colorFields.length > 0) {
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
        const weights = /* @__PURE__ */ new Set();
        for (const file of font.files) {
          const parts = (file.weight || "400").split(" ");
          if (parts.length === 2) {
            const min = parseInt(parts[0]);
            const max = parseInt(parts[1]);
            return options.filter((o) => {
              const n = parseInt(o);
              return n >= min && n <= max;
            }).map((o) => ({ value: o, text: o }));
          }
          weights.add(parts[0]);
        }
        return options.filter((o) => weights.has(o)).map((o) => ({ value: o, text: o }));
      },
      getFontByFamily(family) {
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        return Object.values(allFonts).find((f) => f.family === family) || null;
      },
      translateLabel(label) {
        const direct = this.$t(label);
        if (direct && direct !== label) return direct;
        const slug = label.toLowerCase().replace(/\s+/g, "-");
        const pwKey = "pw.option." + slug;
        const pwT = this.$t(pwKey);
        if (pwT && pwT !== pwKey) return pwT;
        const prwKey = "prw.label." + slug;
        const prwT = this.$t(prwKey);
        return prwT && prwT !== prwKey ? prwT : label;
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
      hasFieldOverride(field) {
        const varName = field.varName;
        if (this.resetFields.has(varName)) return false;
        const saved = this.savedOverrides.global || {};
        if (field.type === "theme-color") {
          for (const theme of ["default", "variant", "variant2"]) {
            if ((saved[theme] || {})[varName]) return true;
          }
          return false;
        }
        if (field.type === "responsive") {
          for (const bp of ["default", "lg", "xl"]) {
            if ((saved[bp] || {})[varName]) return true;
          }
          return false;
        }
        if (field.type === "multi-value") {
          return Array.isArray(saved[varName]);
        }
        return !!saved[varName];
      },
      async resetField(field) {
        const label = field.label.replace(/<[^>]*>/g, "");
        try {
          await new Promise((resolve, reject) => {
            this.$panel.dialog.open({
              component: "k-text-dialog",
              props: {
                text: (this.$t("prw.label.reset-confirm") || 'Reset "{field}" to default?').replace("{field}", label),
                submitBtn: {
                  text: this.$t("prw.label.reset"),
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
        this.resetFields.add(field.varName);
        const varName = field.varName;
        const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
        if (!overrides.global) return;
        if (field.type === "theme-color") {
          for (const theme of ["default", "variant", "variant2"]) {
            if (overrides.global[theme]) {
              delete overrides.global[theme][varName];
              if (Object.keys(overrides.global[theme]).length === 0) delete overrides.global[theme];
            }
          }
        } else if (field.type === "responsive") {
          for (const bp of ["default", "lg", "xl"]) {
            if (overrides.global[bp]) {
              delete overrides.global[bp][varName];
              if (Object.keys(overrides.global[bp]).length === 0) delete overrides.global[bp];
            }
          }
        } else {
          delete overrides.global[varName];
        }
        if (overrides.global && Object.keys(overrides.global).length === 0) delete overrides.global;
        this.$emit("update:overrides", overrides);
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
      },
      // --- Preview ---
      previewText(groupKey) {
        const texts = {
          heading: "The quick __marked__brown fox__/marked__ jumps over the lazy dog and keeps on running",
          tagline: "The quick brown fox jumps over the lazy dog and keeps on running through the field",
          editor: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
          quote: "„The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.“",
          button: "Click here",
          caption: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
          breadcrumb: "Home / Products / Category / Subcategory / Detail",
          cite: "— The quick brown fox jumps over the lazy dog"
        };
        return texts[groupKey] || (groupKey === "media" ? "__media__" : null);
      },
      elementSubtabs(groupKey) {
        const tabs = {
          heading: ["text", "sizes", "colors"],
          tagline: ["text", "sizes", "colors"],
          editor: ["text", "sizes", "colors"],
          quote: ["text", "sizes", "colors"],
          button: ["text", "sizes", "colors"],
          caption: ["text", "sizes", "colors"],
          breadcrumb: ["text", "sizes", "colors"],
          media: ["colors"],
          cite: ["text", "sizes", "colors"]
        };
        return tabs[groupKey] || ["text", "sizes", "colors"];
      },
      varCategory(varName) {
        if (varName.endsWith("-font-family") || varName.endsWith("-font-weight") || varName.endsWith("-text-transform") || varName.endsWith("-font-style") || varName.endsWith("-paragraph-spacing") || varName.endsWith("-marks") || varName.endsWith("-gap")) return "text";
        if (varName.endsWith("-font-size") || varName.endsWith("-line-height") || varName.endsWith("-letter-spacing") || varName.endsWith("-padding") || varName.endsWith("-border-radius") || varName.endsWith("-radius")) return "sizes";
        return "text";
      },
      combinedSubtabs(groupKey) {
        const tabLabels = { text: this.$t("prw.subtab.text"), sizes: this.$t("prw.subtab.sizes"), colors: this.$t("prw.subtab.colors") };
        const result = [];
        const childKey = this.previewChildKey(groupKey);
        const hasChild = childKey && this.groups[childKey];
        for (const st of this.elementSubtabs(groupKey)) {
          const prefix = hasChild ? "<strong>" + this.groupLabel(groupKey) + ":</strong> " : "";
          result.push({ key: groupKey + ":" + st, label: prefix + tabLabels[st], elementKey: groupKey, category: st });
        }
        if (hasChild) {
          for (const st of this.elementSubtabs(childKey)) {
            result.push({ key: childKey + ":" + st, label: "<strong>" + this.groupLabel(childKey) + ":</strong> " + tabLabels[st], elementKey: childKey, category: st });
          }
        }
        return result;
      },
      activeSubtabInfo(groupKey) {
        const tabs = this.combinedSubtabs(groupKey);
        const activeKey = this.openSections[groupKey + "-subtab"] || tabs[0].key;
        const tab = tabs.find((t) => t.key === activeKey) || tabs[0];
        return { group: this.groups[tab.elementKey], category: tab.category, elementKey: tab.elementKey };
      },
      previewChildKey(groupKey) {
        const children = {};
        for (const [child, parent] of Object.entries(this.elementGrouping)) {
          children[parent] = child;
        }
        return children[groupKey] || null;
      },
      previewChildText(groupKey) {
        const childKey = this.previewChildKey(groupKey);
        return childKey ? this.previewText(childKey) : null;
      },
      previewHtml(groupKey, theme) {
        let text = this.previewText(groupKey);
        if (!text) return "";
        const elDef = this.elementDefaults[groupKey] || {};
        const elOv = this.elementOverrides.global || {};
        text = text.replace(/__marked__(.+?)__\/marked__/g, (match, content) => {
          var _a, _b, _c, _d;
          const markedTextColor = (elOv[theme] || {})["element-" + groupKey + "-marked-text"] || ((_b = (_a = elDef.colors) == null ? void 0 : _a["element-" + groupKey + "-marked-text"]) == null ? void 0 : _b[theme]) || "";
          const markedBgColor = (elOv[theme] || {})["element-" + groupKey + "-marked-background"] || ((_d = (_c = elDef.colors) == null ? void 0 : _c["element-" + groupKey + "-marked-background"]) == null ? void 0 : _d[theme]) || "";
          let style = "";
          if (markedTextColor) style += "color:" + markedTextColor + ";";
          if (markedBgColor) style += "background:" + markedBgColor + ";";
          return style ? '<mark style="' + style + '">' + content + "</mark>" : content;
        });
        return text;
      },
      previewThemed(groupKey) {
        return groupKey === "button";
      },
      blockBackground(theme) {
        var _a, _b;
        const override = ((this.globalOverrides.global || {})[theme] || {})["block-background"];
        if (override) return override;
        const blocks = this.globalDefaults.colors || this.globalDefaults.layout || this.globalDefaults.blocks || {};
        return ((_b = (_a = blocks.colors) == null ? void 0 : _a["block-background"]) == null ? void 0 : _b[theme]) || "#ffffff";
      },
      previewButtonStyle(groupKey, theme, bp) {
        var _a, _b, _c, _d;
        const prefix = groupKey;
        const get = (prop) => this.getOverrideValue(prefix + "-" + prop);
        const defVal = (prop, breakpoint) => {
          const group = this.elementDefaults[groupKey];
          if (!group || !group.vars) return "";
          const d = group.vars[prefix + "-" + prop];
          if (!d) return "";
          if (breakpoint && d[breakpoint] !== void 0) return d[breakpoint];
          if (d.default !== void 0) return d.default;
          return d.value || "";
        };
        const responsiveVal = (prop) => {
          const override = this.getResponsiveOverride(prefix + "-" + prop, bp);
          if (override) return override;
          return defVal(prop, bp);
        };
        let fontFamily = get("font-family") || defVal("font-family");
        if (!fontFamily || fontFamily === "default") fontFamily = this.bodyDefaultFont;
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        let fontCategory = "sans-serif";
        for (const f of Object.values(allFonts)) {
          if (f.family === fontFamily) {
            fontCategory = f.category || "sans-serif";
            break;
          }
        }
        const colorVal = (colorName) => {
          var _a2, _b2, _c2;
          const override = ((this.elementOverrides.global || {})[theme] || {})[colorName];
          if (override) return override;
          return ((_c2 = (_b2 = (_a2 = this.elementDefaults[groupKey]) == null ? void 0 : _a2.colors) == null ? void 0 : _b2[colorName]) == null ? void 0 : _c2[theme]) || "";
        };
        const paddingDef = (_b = (_a = this.elementDefaults[groupKey]) == null ? void 0 : _a.vars) == null ? void 0 : _b[prefix + "-padding"];
        const paddingOverride = (this.elementOverrides.global || {})[prefix + "-padding"];
        const padding = Array.isArray(paddingOverride) ? paddingOverride : (paddingDef == null ? void 0 : paddingDef.value) || [];
        const radiusDef = (_d = (_c = this.elementDefaults[groupKey]) == null ? void 0 : _c.vars) == null ? void 0 : _d[prefix + "-border-radius"];
        const radiusOverride = (this.elementOverrides.global || {})[prefix + "-border-radius"];
        const radius = Array.isArray(radiusOverride) ? radiusOverride : (radiusDef == null ? void 0 : radiusDef.value) || [];
        return {
          fontFamily: "'" + fontFamily + "', " + fontCategory,
          fontWeight: get("font-weight") || defVal("font-weight", "value"),
          fontStyle: get("font-style") || defVal("font-style", "value"),
          fontSize: responsiveVal("font-size"),
          lineHeight: responsiveVal("line-height"),
          letterSpacing: responsiveVal("letter-spacing"),
          textTransform: get("text-transform") || defVal("text-transform", "value"),
          color: colorVal("element-button-text"),
          backgroundColor: colorVal("element-button-background"),
          borderColor: colorVal("element-button-border"),
          borderWidth: "1px",
          borderStyle: "solid",
          padding: Array.isArray(padding) ? padding.join(" ") : padding,
          borderRadius: Array.isArray(radius) ? radius.join(" ") : radius
        };
      },
      mediaPreviewStyle(theme) {
        var _a, _b, _c, _d;
        const elDef = this.elementDefaults.media || {};
        const elOv = this.elementOverrides.global || {};
        const bg = (elOv[theme] || {})["element-media-background"] || ((_b = (_a = elDef.colors) == null ? void 0 : _a["element-media-background"]) == null ? void 0 : _b[theme]) || "#262626";
        const radiusOv = elOv["media-radius"];
        const radiusDef = ((_d = (_c = elDef.vars) == null ? void 0 : _c["media-radius"]) == null ? void 0 : _d.value) || [];
        const r = Array.isArray(radiusOv) ? radiusOv : radiusDef;
        return {
          backgroundColor: bg,
          borderRadius: r.length === 4 ? r[0] + " " + r[1] + " " + r[3] + " " + r[2] : "0"
        };
      },
      mediaColor(theme, colorName) {
        var _a, _b;
        const elDef = this.elementDefaults.media || {};
        const elOv = this.elementOverrides.global || {};
        return (elOv[theme] || {})[colorName] || ((_b = (_a = elDef.colors) == null ? void 0 : _a[colorName]) == null ? void 0 : _b[theme]) || "#262626";
      },
      isLightColor(hex) {
        if (!hex || hex.length < 7) return true;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1e3 > 160;
      },
      previewParagraphs(groupKey) {
        if (groupKey !== "editor") return null;
        return [
          "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
          "How vexingly quick daft zebras jump. The five boxing wizards jump quickly at dawn."
        ];
      },
      previewParagraphGap(groupKey) {
        const override = this.getOverrideValue(groupKey + "-paragraph-spacing");
        if (override) return override;
        const group = this.elementDefaults[groupKey];
        if (group && group.vars && group.vars[groupKey + "-paragraph-spacing"]) {
          return group.vars[groupKey + "-paragraph-spacing"].value || "";
        }
        return "";
      },
      previewStyle(groupKey, bp, theme) {
        var _a, _b, _c;
        const prefix = groupKey;
        const get = (prop) => {
          return this.getOverrideValue(prefix + "-" + prop);
        };
        const defVal = (prop, breakpoint) => {
          const group = this.elementDefaults[groupKey];
          if (!group || !group.vars) return "";
          const d = group.vars[prefix + "-" + prop];
          if (!d) return "";
          if (d[breakpoint] !== void 0) return d[breakpoint];
          if (d.default !== void 0) return d.default;
          return d.value || "";
        };
        const responsiveVal = (prop) => {
          const override = this.getResponsiveOverride(prefix + "-" + prop, bp);
          if (override) return override;
          return defVal(prop, bp);
        };
        let fontFamily = get("font-family") || defVal("font-family", "value");
        if (!fontFamily || fontFamily === "default") fontFamily = this.bodyDefaultFont;
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        let fontCategory = "sans-serif";
        for (const f of Object.values(allFonts)) {
          if (f.family === fontFamily) {
            fontCategory = f.category || "sans-serif";
            break;
          }
        }
        const t = theme || "default";
        const colorVar = "element-" + prefix + "-text";
        const colorOverride = ((this.elementOverrides.global || {})[t] || {})[colorVar];
        const colorDefault = ((_c = (_b = (_a = this.elementDefaults[groupKey]) == null ? void 0 : _a.colors) == null ? void 0 : _b[colorVar]) == null ? void 0 : _c[t]) || "";
        return {
          fontFamily: "'" + fontFamily + "', " + fontCategory,
          fontWeight: get("font-weight") || defVal("font-weight", "value"),
          fontStyle: get("font-style") || defVal("font-style", "value"),
          fontSize: responsiveVal("font-size"),
          lineHeight: responsiveVal("line-height"),
          letterSpacing: responsiveVal("letter-spacing"),
          textTransform: get("text-transform") || defVal("text-transform", "value"),
          color: colorOverride || colorDefault
        };
      }
    }
  };
  var _sfc_render$3 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", [_c("div", { staticClass: "pw-element-pills" }, _vm._l(_vm.pillGroups, function(group, groupKey) {
      return _c("button", { key: "pill-" + groupKey, staticClass: "pw-element-pill", class: { "is-active": _vm.activeElement === groupKey }, attrs: { "type": "button" }, on: { "click": function($event) {
        _vm.activeElement = groupKey;
      } } }, [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]);
    }), 0), _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { directives: [{ name: "show", rawName: "v-show", value: _vm.isElementVisible(groupKey) && !_vm.isChildElement(groupKey), expression: "isElementVisible(groupKey) && !isChildElement(groupKey)" }], key: groupKey, staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-element-list" }, [_vm.previewText(groupKey) && !_vm.isChildElement(groupKey) ? [_c("div", { staticClass: "pw-element-preview-header" }, _vm._l(["default", "lg", "xl"], function(bp) {
        return _c("span", { key: "h-" + bp, staticClass: "pw-element-preview-header-label" }, [_vm._v(_vm._s({ default: "Mobile", lg: "Tablet", xl: "Desktop" }[bp]))]);
      }), 0), _c("div", { staticClass: "pw-element-preview", class: { "pw-element-preview-themed": _vm.previewThemed(groupKey) } }, [_vm._l(["default", "variant", "variant2"], function(theme) {
        return _vm._l(["default", "lg", "xl"], function(bp) {
          return _c("div", { key: theme + "-" + bp, staticClass: "pw-element-preview-col", style: { backgroundColor: _vm.blockBackground(theme) } }, [groupKey === "media" ? [_c("div", { staticClass: "pw-media-preview-img", style: _vm.mediaPreviewStyle(theme) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "stroke-width": "1", "opacity": "0.3" } }, [_c("rect", { attrs: { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" } }), _c("circle", { attrs: { "cx": "8.5", "cy": "8.5", "r": "1.5" } }), _c("path", { attrs: { "d": "M21 15l-5-5L5 21" } })])]), _c("div", { staticClass: "pw-media-preview-bullets" }, [_c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet") } }), _c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet-active") } }), _c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet") } })]), _vm.previewChildText(groupKey) ? [_c("span", { staticClass: "pw-element-preview-text", style: _vm.previewStyle(_vm.previewChildKey(groupKey), bp, theme) }, [_vm._v(_vm._s(_vm.previewChildText(groupKey)))])] : _vm._e()] : _vm.previewThemed(groupKey) ? [_c("span", { staticClass: "pw-element-preview-button", style: _vm.previewButtonStyle(groupKey, theme, bp) }, [_vm._v(_vm._s(_vm.previewText(groupKey)))])] : _vm.previewParagraphs(groupKey) ? [_c("div", { staticClass: "pw-element-preview-text", style: _vm.previewStyle(groupKey, bp, theme) }, _vm._l(_vm.previewParagraphs(groupKey), function(para, pIdx) {
            return _c("p", { key: pIdx, style: pIdx > 0 ? { marginTop: _vm.previewParagraphGap(groupKey) } : {} }, [_vm._v(_vm._s(para))]);
          }), 0)] : [_c("span", { staticClass: "pw-element-preview-text", style: _vm.previewStyle(groupKey, bp, theme), domProps: { "innerHTML": _vm._s(_vm.previewHtml(groupKey, theme)) } })], _vm.previewChildText(groupKey) && groupKey !== "media" ? [_c("span", { staticClass: "pw-element-preview-text", style: _vm.previewStyle(_vm.previewChildKey(groupKey), bp, theme) }, [_vm._v(_vm._s(_vm.previewChildText(groupKey)))])] : _vm._e()], 2);
        });
      })], 2)] : _vm._e(), _c("div", { staticClass: "pw-element-subtabs" }, _vm._l(_vm.combinedSubtabs(groupKey), function(st) {
        return _c("button", { key: "st-" + st.key, staticClass: "pw-element-subtab", class: { "is-active": (_vm.openSections[groupKey + "-subtab"] || _vm.combinedSubtabs(groupKey)[0].key) === st.key }, attrs: { "type": "button" }, domProps: { "innerHTML": _vm._s(st.label) }, on: { "click": function($event) {
          return _vm.$set(_vm.openSections, groupKey + "-subtab", st.key);
        } } });
      }), 0), _vm.activeSubtabInfo(groupKey).category !== "colors" ? [_vm._l(_vm.groupedVarFields(_vm.activeSubtabInfo(groupKey).group, _vm.activeSubtabInfo(groupKey).category), function(fieldGroup, gIdx) {
        return [fieldGroup.header ? _c("div", { key: "vgh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
          return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.translateLabel(label)))])]);
        }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
          return [_c("div", { key: "vf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: {
            "pw-dual-first": field.isFollowedByState || field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey) && _vm.openSections[groupKey + "-sizes"],
            "pw-dual-next": field.isState
          } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey) ? [_c("button", { staticClass: "pw-sizes-toggle", attrs: { "type": "button" }, on: { "click": function($event) {
            $event.preventDefault();
            return _vm.$set(_vm.openSections, groupKey + "-sizes", !_vm.openSections[groupKey + "-sizes"]);
          } } }, [_c("k-icon", { staticClass: "pw-sizes-chevron", attrs: { "type": _vm.openSections[groupKey + "-sizes"] ? "angle-down" : "angle-right" } }), _c("span", [_vm._v(_vm._s(field.label))])], 1)] : _c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(field.label) } })], 2), _c("div", { staticClass: "pw-field-row-options", class: fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "" }, [field.def.type === "font-family" ? _c("select", { staticClass: "pw-element-input pw-font-select", domProps: { "value": _vm.fontSelectValue(field.varName, field.def.value) }, on: { "change": function($event) {
            return _vm.setValue(field.varName, $event.target.value, field.def.value);
          } } }, _vm._l(_vm.fontFamilyOptions, function(opt) {
            return _c("option", { key: opt.value, domProps: { "value": opt.value } }, [_vm._v(_vm._s(opt.text))]);
          }), 0) : field.def.options ? _c("k-toggles-input", { attrs: { "value": _vm.getOverrideValue(field.varName) || field.def.value, "options": _vm.filteredOptions(field.varName, field.def.options), "grow": false, "required": true }, on: { "input": function($event) {
            return _vm.setValue(field.varName, $event, field.def.value);
          } } }) : field.type === "multi-value" ? _vm._l(field.def.value, function(val, idx) {
            return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || val) }, on: { "input": function($event) {
              return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
            } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit)))])]);
          }) : field.type === "responsive" ? _vm._l(["default", "lg", "xl"], function(bp, bpIdx) {
            return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "input": function($event) {
              return _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit);
            } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit)))])]);
          }) : field.def.unit !== void 0 ? [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "number", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(field.varName) || field.def.value) }, on: { "input": function($event) {
            return _vm.setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit)))])] : _vm._e()], 2)])]), _vm.hasFieldOverride(field) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
            return _vm.resetField(field);
          } } }) : _vm._e()], 1), field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey) && _vm.openSections[groupKey + "-sizes"] ? _vm._l(_vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey).vars || _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey), function(sizeEntry, sizeName) {
            return _c("div", { key: "sz-" + sizeName, staticClass: "pw-field-row pw-dual-next" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-sizes-label" }, [_vm._v(_vm._s(_vm.$t("pw.option." + sizeName.split("-").pop())))])]), _c("div", { staticClass: "pw-field-row-options", class: fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "" }, _vm._l(["default", "lg", "xl"], function(bp) {
              return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "number", "step": sizeEntry.step || 0.1, "min": sizeEntry.min, "max": sizeEntry.max }, domProps: { "value": _vm.stripUnit(_vm.getFontSizeOverride(bp, sizeName) || sizeEntry[bp]) }, on: { "input": function($event) {
                return _vm.setFontSizeValue(bp, sizeName, $event.target.value, sizeEntry[bp], sizeEntry.unit);
              } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(sizeEntry.unit))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getFontSizeOverride(bp, sizeName) || sizeEntry[bp], sizeEntry.unit || "rem")))])]);
            }), 0)])])]);
          }) : _vm._e()];
        }), fieldGroup.header ? _c("div", { key: "vge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()];
      })] : _vm._e(), _vm.activeSubtabInfo(groupKey).category === "colors" ? [_vm._l(_vm.groupedColorFields(_vm.activeSubtabInfo(groupKey).group), function(fieldGroup, gIdx) {
        return [fieldGroup.header ? _c("div", { key: "gh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
          return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.translateLabel(label)))])]);
        }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
          return [_c("div", { key: "gf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: {
            "pw-dual-first": field.isFollowedByState || field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey) && _vm.openSections[groupKey + "-sizes"],
            "pw-dual-next": field.isState
          } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey) ? [_c("button", { staticClass: "pw-sizes-toggle", attrs: { "type": "button" }, on: { "click": function($event) {
            $event.preventDefault();
            return _vm.$set(_vm.openSections, groupKey + "-sizes", !_vm.openSections[groupKey + "-sizes"]);
          } } }, [_c("k-icon", { staticClass: "pw-sizes-chevron", attrs: { "type": _vm.openSections[groupKey + "-sizes"] ? "angle-down" : "angle-right" } }), _c("span", [_vm._v(_vm._s(field.label))])], 1)] : _c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(field.label) } })], 2), _c("div", { staticClass: "pw-field-row-options", class: fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "" }, [field.def.type === "font-family" ? _c("select", { staticClass: "pw-element-input pw-font-select", domProps: { "value": _vm.fontSelectValue(field.varName, field.def.value) }, on: { "change": function($event) {
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
          } } }), field.def.help ? _c("span", { staticClass: "pw-element-help" }, [_vm._v(_vm._s(_vm.helpText(field.def.help)))]) : _vm._e()]], 2)])]), _vm.hasFieldOverride(field) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
            return _vm.resetField(field);
          } } }) : _vm._e()], 1), field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey) && _vm.openSections[groupKey + "-sizes"] ? _vm._l(_vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey).vars, function(sizeVal, sizeName) {
            return _c("div", { key: "size-" + sizeName, staticClass: "pw-field-row pw-dual-first pw-dual-next" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-sizes-label" }, [_vm._v(_vm._s(_vm.$t("pw.option." + sizeName.split("-").pop())))])]), _c("div", { staticClass: "pw-field-row-options pw-group-type-responsive" }, _vm._l(["default", "lg", "xl"], function(bp) {
              return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getFontSizeOverride(bp, sizeName) }, attrs: { "type": "number", "step": _vm.fontSizesForGroup(_vm.activeSubtabInfo(groupKey).elementKey).step || 0.1, "min": "0.1", "max": "20" }, domProps: { "value": _vm.stripUnit(_vm.getFontSizeOverride(bp, sizeName) || sizeVal[bp]) }, on: { "input": function($event) {
                return _vm.setFontSizeValue(bp, sizeName, $event.target.value, sizeVal[bp], "rem");
              } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getFontSizeOverride(bp, sizeName) || sizeVal[bp], "rem")))])]);
            }), 0)])])]);
          }) : _vm._e()];
        }), fieldGroup.header ? _c("div", { key: "ge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()];
      })] : _vm._e()], 2)]);
    })], 2);
  };
  var _sfc_staticRenderFns$3 = [];
  _sfc_render$3._withStripped = true;
  var __component__$3 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$3,
    _sfc_render$3,
    _sfc_staticRenderFns$3
  );
  __component__$3.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalElementStyles.vue";
  const GlobalElementStyles = __component__$3.exports;
  const _sfc_main$2 = {
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
      },
      showOnly: {
        type: Array,
        default: null
      },
      hideVars: {
        type: Array,
        default: null
      },
      groupLabels: {
        type: Object,
        default: null
      },
      hideSectionHeaders: {
        type: Boolean,
        default: false
      },
      savedOverrides: {
        type: Object,
        default: null
      },
      discardKey: {
        type: Number,
        default: 0
      },
      showColors: {
        type: Boolean,
        default: false
      },
      showGroup: {
        type: String,
        default: null
      },
      showPreview: {
        type: Boolean,
        default: false
      },
      hidePreview: {
        type: Boolean,
        default: false
      },
      showFlyout: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        openSections: {},
        openFlyout: null,
        resetFields: /* @__PURE__ */ new Set(),
        inlineIcons: {
          "arrow-down": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/></svg>',
          "chevron-down": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
          "caret-down": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>',
          "plus-minus": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>'
        }
      };
    },
    watch: {
      savedOverrides() {
        this.resetFields = /* @__PURE__ */ new Set();
      },
      discardKey() {
        this.resetFields = /* @__PURE__ */ new Set();
      }
    },
    computed: {
      groups() {
        const result = {};
        for (const [key, val] of Object.entries(this.navDefaults)) {
          if (this.showGroup && key !== this.showGroup) continue;
          if (val && typeof val === "object" && (val.vars || val.colors)) {
            if (this.showOnly || this.hideVars) {
              const filtered = { ...val };
              if (val.vars) {
                const vars = {};
                for (const [vk, vv] of Object.entries(val.vars)) {
                  if (this.showOnly && !this.showOnly.includes(vk)) continue;
                  if (this.hideVars && this.hideVars.includes(vk)) continue;
                  vars[vk] = vv;
                }
                if (Object.keys(vars).length === 0 && (!val.colors || !this.showColors)) continue;
                filtered.vars = vars;
              }
              if (val.colors && this.showOnly && !this.showColors) continue;
              result[key] = filtered;
            } else {
              result[key] = val;
            }
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
        if (this.groupLabels && this.groupLabels[key]) return this.groupLabels[key];
        const prwKey = "prw.prop." + key;
        const prwT = this.$t(prwKey);
        if (prwT && prwT !== prwKey) return prwT;
        return key;
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
              }
            }
            const sig = this.fieldSignature(varName, def);
            const isState = varName.endsWith("-hover") || varName.includes("-hover-") || varName.endsWith("-active") || varName.includes("-active-");
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
      dependentField() {
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
        const pwKey = "pw.option." + val;
        const pwT = this.$t(pwKey);
        if (pwT && pwT !== pwKey) return pwT;
        return String(val);
      },
      propLabel(varName) {
        const tKey = "prw.prop." + varName;
        const t = this.$t(tKey);
        if (t && t !== tKey) return t;
        const firstDash = varName.indexOf("-");
        if (firstDash > 0) {
          const propKey = "prw.prop." + varName.substring(firstDash + 1);
          const propT = this.$t(propKey);
          if (propT && propT !== propKey) return propT;
        }
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
      hasFieldOverride(varName, isColor) {
        if (!this.savedOverrides) return false;
        if (this.resetFields.has(varName)) return false;
        const saved = this.savedOverrides.global || {};
        if (isColor) {
          for (const theme of ["default", "variant", "variant2"]) {
            if ((saved[theme] || {})[varName]) return true;
          }
          return false;
        }
        for (const bp of ["default", "lg", "xl"]) {
          if ((saved[bp] || {})[varName]) return true;
        }
        return !!saved[varName];
      },
      async resetNavField(varName, isColor, label) {
        const name = label ? label.replace(/<[^>]*>/g, "") : varName;
        try {
          await new Promise((resolve, reject) => {
            this.$panel.dialog.open({
              component: "k-text-dialog",
              props: {
                text: (this.$t("prw.label.reset-confirm") || 'Reset "{field}" to default?').replace("{field}", name),
                submitBtn: { text: this.$t("prw.label.reset"), icon: "undo", theme: "negative" }
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
        this.resetFields.add(varName);
        const overrides = JSON.parse(JSON.stringify(this.navOverrides));
        if (!overrides.global) return;
        if (isColor) {
          for (const theme of ["default", "variant", "variant2"]) {
            if (overrides.global[theme]) {
              delete overrides.global[theme][varName];
              if (Object.keys(overrides.global[theme]).length === 0) delete overrides.global[theme];
            }
          }
        } else {
          delete overrides.global[varName];
          for (const bp of ["default", "lg", "xl"]) {
            if (overrides.global[bp]) {
              delete overrides.global[bp][varName];
              if (Object.keys(overrides.global[bp]).length === 0) delete overrides.global[bp];
            }
          }
        }
        if (overrides.global && Object.keys(overrides.global).length === 0) delete overrides.global;
        this.$emit("update:overrides", overrides);
      },
      navGet(v) {
        return this.getOverrideValue(v);
      },
      navDef(groupKey, varName) {
        const group = this.navDefaults[groupKey];
        if (!group || !group.vars) return "";
        const d = group.vars[varName];
        if (!d) return "";
        if (d.default !== void 0) return d.default;
        return d.value || "";
      },
      navColorField(groupKey, colorGroupVar, fieldName) {
        var _a, _b, _c, _d, _e;
        return this.navGet(fieldName) || ((_e = (_d = (_c = (_b = (_a = this.navDefaults[groupKey]) == null ? void 0 : _a.vars) == null ? void 0 : _b[colorGroupVar]) == null ? void 0 : _c.fields) == null ? void 0 : _d[fieldName]) == null ? void 0 : _e.value) || "";
      },
      navQuadValue(varName) {
        var _a, _b;
        const override = (this.navOverrides.global || {})[varName];
        if (Array.isArray(override)) return override.join(" ");
        const group = this.navDefaults.desktop;
        if ((_b = (_a = group == null ? void 0 : group.vars) == null ? void 0 : _a[varName]) == null ? void 0 : _b.value) return group.vars[varName].value.join(" ");
        return "0";
      },
      navPreviewBarStyle(device) {
        const d = device || "desktop";
        const bgColor = this.navGet(d + "-background") || this.navDef(d, d + "-background") || this.navColorField(d, d + "-color", d + "-bgcolor") || (d === "tablet" ? this.navGet("desktop-background") || this.navDef("desktop", "desktop-background") : "") || "#FFFFFF";
        const height = this.navGet(d + "-height") || this.navDef(d, d + "-height");
        return { backgroundColor: bgColor, height };
      },
      navPreviewLogo(device) {
        const d = device || "desktop";
        return this.navGet(d + "-logo-src") || "";
      },
      navPreviewLogoStyle(device) {
        const d = device || "desktop";
        const align = this.navGet(d + "-logo-align") || this.navDef(d, d + "-logo-align");
        const padding = this.navQuadValue(d + "-logo-padding");
        return { alignSelf: align, padding };
      },
      navPreviewLogoSvgHeight(device) {
        var _a, _b, _c;
        const d = device || "desktop";
        return this.navGet(d + "-logo-display-height") || ((_c = (_b = (_a = this.navDefaults[d]) == null ? void 0 : _a.vars) == null ? void 0 : _b[d + "-logo-display-height"]) == null ? void 0 : _c.value) || "2rem";
      },
      navPreviewItemsWrapStyle(device) {
        const d = device || "desktop";
        const align = this.navGet(d + "-items-align") || this.navDef(d, d + "-items-align");
        const padding = this.navQuadValue(d + "-items-padding");
        return { alignItems: align, padding };
      },
      navPreviewTextColor(device) {
        const d = device || "desktop";
        return this.navGet(d + "-textcolor") || this.navDef(d, d + "-textcolor") || this.navColorField(d, d + "-color", d + "-textcolor") || (d === "tablet" ? this.navGet("desktop-textcolor") || this.navDef("desktop", "desktop-textcolor") : "") || "#101828";
      },
      navPreviewItemStyle(device) {
        const bp = device === "tablet" ? "lg" : "xl";
        const getResponsive = (varName) => {
          const override = ((this.navOverrides.global || {})[bp] || {})[varName];
          if (override) return override;
          return this.navDef("general", varName);
        };
        let fontFamily = this.navGet("font-family") || this.navDef("general", "font-family");
        if (!fontFamily || fontFamily === "default") fontFamily = this.bodyDefaultFont;
        const allFonts = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        let fontCategory = "sans-serif";
        for (const f of Object.values(allFonts)) {
          if (f.family === fontFamily) {
            fontCategory = f.category || "sans-serif";
            break;
          }
        }
        return {
          fontFamily: "'" + fontFamily + "', " + fontCategory,
          fontWeight: this.navGet("font-weight") || this.navDef("general", "font-weight"),
          fontSize: getResponsive("font-size"),
          lineHeight: getResponsive("line-height"),
          letterSpacing: getResponsive("letter-spacing"),
          textTransform: this.navGet("text-transform") || this.navDef("general", "text-transform"),
          color: this.navPreviewTextColor(device)
        };
      },
      mobileColorField(colorGroup, field) {
        return this.navColorField("mobile", colorGroup, field) || "#101828";
      },
      mobileBarStyle() {
        const bg = this.mobileColorField("mobile-title-color", "mobile-title-bgcolor");
        const height = this.navGet("mobile-height") || this.navDef("mobile", "mobile-height");
        return { backgroundColor: bg, height };
      },
      mobileL1Style(active) {
        var _a, _b, _c;
        const group = active ? "mobile-l1-active-color" : "mobile-l1-color";
        const textField = active ? "mobile-l1-active-textcolor" : "mobile-l1-textcolor";
        const bgField = active ? "mobile-l1-active-bgcolor" : "mobile-l1-bgcolor";
        return {
          color: this.mobileColorField(group, textField),
          backgroundColor: this.mobileColorField(group, bgField),
          borderColor: this.navGet("mobile-l1-bordercolor") || ((_c = (_b = (_a = this.navDefaults.mobile) == null ? void 0 : _a.vars) == null ? void 0 : _b["mobile-l1-bordercolor"]) == null ? void 0 : _c.value) || "#00000025"
        };
      },
      mobileL2Style(active) {
        var _a, _b, _c;
        const group = active ? "mobile-l2-active-color" : "mobile-l2-color";
        const textField = active ? "mobile-l2-active-textcolor" : "mobile-l2-textcolor";
        const bgField = active ? "mobile-l2-active-bgcolor" : "mobile-l2-bgcolor";
        return {
          color: this.mobileColorField(group, textField),
          backgroundColor: this.mobileColorField(group, bgField),
          borderColor: this.navGet("mobile-l2-bordercolor") || ((_c = (_b = (_a = this.navDefaults.mobile) == null ? void 0 : _a.vars) == null ? void 0 : _b["mobile-l2-bordercolor"]) == null ? void 0 : _c.value) || "#00000015"
        };
      },
      navPreviewFlyoutColor(name) {
        return this.navGet(name) || this.navDef("desktop", name) || "";
      },
      navPreviewFlyoutStyle() {
        return {
          backgroundColor: this.navPreviewFlyoutColor("flyout-bgcolor") || "#ffffff",
          borderColor: "transparent",
          minWidth: this.navGet("desktop-flyout-min-width") || this.navDef("desktop", "desktop-flyout-min-width") || "10rem"
        };
      },
      navPreviewFlyoutItemStyle() {
        return {
          color: this.navPreviewFlyoutColor("flyout-textcolor") || "#101828",
          backgroundColor: this.navPreviewFlyoutColor("flyout-bgcolor") || "#ffffff",
          borderBottomColor: this.navPreviewFlyoutColor("flyout-bordercolor") || "#00000025"
        };
      },
      navPreviewFlyoutItemHoverStyle() {
        return {
          color: this.navPreviewFlyoutColor("flyout-textcolor-hover") || "#ffffff",
          backgroundColor: this.navPreviewFlyoutColor("flyout-bgcolor-hover") || "#1D548B"
        };
      },
      navFlyoutIconPath() {
        const icon = this.navGet("desktop-flyout-icon") || this.navDef("desktop", "desktop-flyout-icon") || "arrow-down";
        const paths = {
          "arrow-down": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6h12z"/></svg>',
          "chevron-down": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
          "caret-down": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 10l4 4 4-4z"/></svg>',
          "plus-minus": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>'
        };
        return paths[icon] || paths["arrow-down"];
      },
      getOverrideValue(varName) {
        return (this.navOverrides.global || {})[varName] || "";
      },
      fontSelectValue(varName, defValue) {
        const ov = this.getOverrideValue(varName);
        if (ov && ov === this.bodyDefaultFont && this.fontFamilyOptions.some((o) => o.value === "default")) return "default";
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
  var _sfc_render$2 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [!_vm.hideSectionHeaders ? _c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]) : _vm._e(), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.hideSectionHeaders || _vm.isOpen(groupKey), expression: "hideSectionHeaders || isOpen(groupKey)" }], staticClass: "pw-element-list" }, [groupKey === "desktop" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview-header" }, [_c("span", { staticClass: "pw-element-preview-header-label" }, [_vm._v("Desktop")])]) : _vm._e(), groupKey === "desktop" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview pw-nav-preview", style: _vm.navPreviewBarStyle() }, [_vm.navPreviewLogo() ? _c("div", { staticClass: "pw-nav-preview-logo", style: _vm.navPreviewLogoStyle() }, [_c("div", { style: { height: _vm.navPreviewLogoSvgHeight() }, domProps: { "innerHTML": _vm._s(_vm.navPreviewLogo()) } })]) : _vm._e(), _c("div", { staticClass: "pw-nav-preview-items", style: _vm.navPreviewItemsWrapStyle() }, _vm._l([{ t: "Home", fly: false, home: true }, { t: "About", fly: false }, { t: "Services", fly: true, flyout: "services" }, { t: "Portfolio", fly: true, flyout: "portfolio" }, { t: "Contact", fly: false }], function(item, idx) {
        return !item.home || (_vm.navGet("home-desktop") || _vm.navDef("desktop", "home-desktop")) === "true" ? _c("span", { key: idx, staticClass: "pw-nav-preview-item", style: _vm.navPreviewItemStyle() }, [_c("span", { staticStyle: { "display": "flex", "align-items": "center", "gap": "var(--spacing-1)" } }, [_vm._v(_vm._s(item.t)), item.fly ? _c("span", { staticClass: "pw-nav-preview-flyout-icon", style: { color: _vm.navPreviewTextColor() }, domProps: { "innerHTML": _vm._s(_vm.navFlyoutIconPath()) } }) : _vm._e()]), item.flyout && _vm.showFlyout && item.flyout === "services" ? _c("div", { staticClass: "pw-nav-preview-flyout", style: _vm.navPreviewFlyoutStyle() }, [_c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v("Submenu A")]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v("Submenu B")]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v("Submenu C")])]) : _vm._e()]) : _vm._e();
      }), 0)]) : _vm._e(), groupKey === "tablet" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview-header" }, [_c("span", { staticClass: "pw-element-preview-header-label" }, [_vm._v("Tablet")])]) : _vm._e(), groupKey === "tablet" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview pw-nav-preview", style: _vm.navPreviewBarStyle("tablet") }, [_vm.navPreviewLogo("tablet") ? _c("div", { staticClass: "pw-nav-preview-logo", style: _vm.navPreviewLogoStyle("tablet") }, [_c("div", { style: { height: _vm.navPreviewLogoSvgHeight("tablet") }, domProps: { "innerHTML": _vm._s(_vm.navPreviewLogo("tablet")) } })]) : _vm._e(), _c("div", { staticClass: "pw-nav-preview-items", style: _vm.navPreviewItemsWrapStyle("tablet") }, _vm._l([{ t: "Home", fly: false, home: true }, { t: "About", fly: false }, { t: "Services", fly: true, flyout: "t-services" }, { t: "Portfolio", fly: true, flyout: "t-portfolio" }, { t: "Contact", fly: false }], function(item, idx) {
        return !item.home || (_vm.navGet("home-tablet") || _vm.navDef("tablet", "home-tablet")) === "true" ? _c("span", { key: idx, staticClass: "pw-nav-preview-item", style: _vm.navPreviewItemStyle("tablet") }, [_c("span", { staticStyle: { "cursor": "pointer", "display": "flex", "align-items": "center", "gap": "var(--spacing-1)" }, on: { "click": function($event) {
          $event.stopPropagation();
          _vm.openFlyout = _vm.openFlyout === item.flyout ? null : item.flyout;
        } } }, [_vm._v(_vm._s(item.t)), item.fly ? _c("span", { staticClass: "pw-nav-preview-flyout-icon", style: { color: _vm.navPreviewTextColor("tablet") }, domProps: { "innerHTML": _vm._s(_vm.navFlyoutIconPath()) } }) : _vm._e()]), item.flyout && _vm.openFlyout === item.flyout ? _c("div", { staticClass: "pw-nav-preview-flyout", style: _vm.navPreviewFlyoutStyle() }, [_c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v("Submenu A")]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemHoverStyle() }, [_vm._v("Submenu B")]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v("Submenu C")])]) : _vm._e()]) : _vm._e();
      }), 0)]) : _vm._e(), groupKey === "mobile" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview-header" }, [_c("span", { staticClass: "pw-element-preview-header-label" }, [_vm._v("Mobile")])]) : _vm._e(), groupKey === "mobile" && !_vm.hidePreview ? _c("div", { staticClass: "pw-nav-preview-mobile" }, [_c("div", { staticClass: "pw-nav-preview-mobile-bar", style: _vm.mobileBarStyle() }, [_vm.navPreviewLogo("mobile") ? _c("div", { style: { height: _vm.navPreviewLogoSvgHeight("mobile") }, domProps: { "innerHTML": _vm._s(_vm.navPreviewLogo("mobile")) } }) : _vm._e(), _c("svg", { style: { fill: _vm.mobileColorField("mobile-title-color", "mobile-title-textcolor") }, attrs: { "viewBox": "0 0 24 24", "width": "20", "height": "20" } }, [_c("path", { attrs: { "d": "M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" } })])]), _c("div", { staticClass: "pw-nav-preview-mobile-menu" }, _vm._l([{ t: "Home", l2: false, active: false, home: true }, { t: "About", l2: false, active: false }, { t: "Services", l2: true, active: true }, { t: "Portfolio", l2: false, active: false }, { t: "Contact", l2: false, active: false }], function(item, idx) {
        return !item.home || (_vm.navGet("home-mobile") || _vm.navDef("mobile", "home-mobile")) === "true" ? _c("div", { key: idx }, [_c("div", { staticClass: "pw-nav-preview-mobile-l1", class: { "pw-mobile-border": idx > 0 }, style: _vm.mobileL1Style(item.active) }, [_vm._v(" " + _vm._s(item.t) + " ")]), item.l2 ? _vm._l([{ t: "Submenu A", active: false }, { t: "Submenu B", active: true }, { t: "Submenu C", active: false }], function(sub, sIdx) {
          return _c("div", { key: "s" + sIdx, staticClass: "pw-nav-preview-mobile-l2", class: { "pw-mobile-border-l2": true }, style: _vm.mobileL2Style(sub.active) }, [_vm._v(" " + _vm._s(sub.t) + " ")]);
        }) : _vm._e()], 2) : _vm._e();
      }), 0)]) : _vm._e(), _vm._l(_vm.groupedFields(group), function(fieldGroup, gIdx) {
        return !_vm.showPreview ? [fieldGroup.isLabel ? _c("div", { key: "gl-" + gIdx, staticClass: "pw-nav-label" }, [_vm._v(" " + _vm._s(fieldGroup.labelText) + " ")]) : [fieldGroup.header ? _c("div", { key: "gh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
          return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t(label) || label))])]);
        }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
          return [_c("div", { key: "gf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: { "pw-dual-first": field.isTight, "pw-dual-next": field.isTightNext } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(field.label) } })]), _c("div", { staticClass: "pw-field-row-options", class: fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "" }, [field.def.type === "visibility" ? _c("button", { staticClass: "pw-tab-visibility", attrs: { "type": "button" }, on: { "click": function($event) {
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
          } } })]), _vm.dependentField(field.varName) ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-group-column-label", staticStyle: { "margin-right": "var(--spacing-2)" } }, [_vm._v(_vm._s(_vm.$t("pw.field.height.label")))]), _c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(_vm.dependentField(field.varName).varName) }, attrs: { "type": "number", "step": _vm.dependentField(field.varName).def.step || 0.1, "min": _vm.dependentField(field.varName).def.min, "max": _vm.dependentField(field.varName).def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(_vm.dependentField(field.varName).varName) || _vm.dependentField(field.varName).def.value) }, on: { "input": function($event) {
            _vm.setUnitValue(_vm.dependentField(field.varName).varName, $event.target.value, _vm.dependentField(field.varName).def.value, _vm.dependentField(field.varName).def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(_vm.dependentField(field.varName).def.unit))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(_vm.dependentField(field.varName).varName) || _vm.dependentField(field.varName).def.value, _vm.dependentField(field.varName).def.unit)))])])] : _vm._e()] : _c("label", { staticClass: "pw-svg-upload-btn" }, [_c("k-icon", { attrs: { "type": "upload" } }), _vm._v(" " + _vm._s(_vm.$t("prw.label.upload-svg")) + " "), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".svg" }, on: { "change": function($event) {
            return _vm.onSvgFileUpload(field.varName, $event, field.def.value);
          } } })], 1)] : _c("input", { staticClass: "pw-element-input", attrs: { "type": "text", "placeholder": field.def.value }, domProps: { "value": _vm.getOverrideValue(field.varName) }, on: { "input": function($event) {
            return _vm.setValue(field.varName, $event.target.value, field.def.value);
          } } })], 2)])]), field.def.type === "svg" && _vm.getOverrideValue(field.varName) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.remove"), "icon": "remove", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
            return _vm.removeSvg(field.varName);
          } } }) : field.def.type !== "svg" && _vm.hasFieldOverride(field.varName, false) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
            return _vm.resetNavField(field.varName, false, field.label);
          } } }) : _vm._e()], 1)];
        }), fieldGroup.header ? _c("div", { key: "ge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()]] : _vm._e();
      }), group.colors && !_vm.showPreview ? [_vm.hasColors(group) ? _c("div", { staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-theme-color" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.default")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant2")))])])])]) : _vm._e(), _vm._l(group.colors, function(colorVal, varName, index) {
        return _c("div", { key: "color-" + varName, staticClass: "pw-field-row", class: {
          "pw-dual-first": _vm.isFollowedByColorState(group.colors, index),
          "pw-dual-next": varName.endsWith("-hover") || varName.endsWith("-active")
        } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(_vm.propLabel(varName)) } })]), _c("div", { staticClass: "pw-field-row-options pw-group-type-theme-color" }, _vm._l(["default", "variant", "variant2"], function(theme) {
          return _c("pw-color-field-row", { key: theme, attrs: { "group": theme, "var-name": varName, "default-value": colorVal[theme] || "", "override-value": _vm.getColorOverrideValue(theme, varName) }, on: { "update:value": function($event) {
            return _vm.setColorValue(theme, varName, $event, colorVal[theme] || "");
          } } });
        }), 1)])]), _vm.hasFieldOverride(varName, true) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
          _vm.resetNavField(varName, true, _vm.propLabel(varName));
        } } }) : _vm._e()], 1);
      }), _c("div", { staticClass: "pw-group-end" })] : _vm._e()], 2)])], 1);
    }), 0);
  };
  var _sfc_staticRenderFns$2 = [];
  _sfc_render$2._withStripped = true;
  var __component__$2 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$2,
    _sfc_render$2,
    _sfc_staticRenderFns$2
  );
  __component__$2.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalNavigation.vue";
  const GlobalNavigation = __component__$2.exports;
  const _sfc_main$1 = {
    props: {
      fonts: { type: Object, default: () => ({}) },
      mode: { type: String, default: "all" }
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
      async deleteFontFile(key, fileIndex, file) {
        const font = this.allFonts[key];
        const isLast = font && font.files && font.files.length <= 1;
        const label = isLast ? 'Delete font "' + font.family + '"?' : 'Delete "' + file.src + '"?';
        if (!window.confirm(label)) return;
        if (isLast) {
          await this.$api.delete("projectwizard/fonts/" + key);
        } else {
          await this.$api.delete("projectwizard/fonts/" + key + "/file/" + fileIndex);
        }
        this.$emit("update");
      },
      async setDefaultFont(family) {
        await this.$api.post("projectwizard/fonts/default", { family });
        this.$emit("update");
      }
    }
  };
  var _sfc_render$1 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-font-manager" }, [_vm.mode === "all" || _vm.mode === "installed" ? _c("section", { staticClass: "pw-element-section" }, [_vm.mode === "all" ? _c("div", { staticClass: "pw-section-header pw-font-header" }, [_c("span", { staticClass: "pw-section-title" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.installed") || "Installed Fonts"))]), _c("k-button", { attrs: { "text": _vm.showAddForm ? "Cancel" : _vm.$t("prw.fonts.add") || "Add Font", "icon": _vm.showAddForm ? "cancel" : "add", "size": "xs" }, on: { "click": function($event) {
      _vm.showAddForm = !_vm.showAddForm;
      if (!_vm.showAddForm) _vm.resetAddForm();
    } } })], 1) : _vm._e(), _c("div", { staticClass: "pw-element-list" }, [_vm._l(_vm.allFonts, function(font, key) {
      return _vm._l(font.files, function(file, fIdx) {
        return _c("div", { key: key + "-" + fIdx, staticClass: "pw-field-row", class: { "pw-dual-first": fIdx === 0 && font.files.length > 1, "pw-dual-next": fIdx > 0 } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-font-label-bold" }, [_vm._v(_vm._s(font.family))]), _c("span", { staticClass: "pw-quad-label" }, [_vm._v(_vm._s(_vm.categoryLabel(font.category)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-font-file-name" }, [_vm._v(_vm._s(file.src) + " "), _c("span", { staticClass: "pw-font-weight-label" }, [_vm._v(_vm._s(font.italic && font.files.length === 1 ? "normal, italic" : file.style) + ", " + _vm._s(_vm.formatWeight(file.weight)))])]), !font.builtin ? _c("button", { staticClass: "pw-font-delete", attrs: { "type": "button" }, on: { "click": function($event) {
          return _vm.deleteFontFile(key, fIdx, file);
        } } }, [_vm._v("×")]) : _vm._e()])])])]);
      });
    })], 2)]) : _vm._e(), _vm.mode === "add" || _vm.mode === "all" && _vm.showAddForm ? _c("section", { staticClass: "pw-element-section" }, [_vm.mode === "all" ? _c("div", { staticClass: "pw-section-header" }, [_c("span", { staticClass: "pw-section-toggle" }, [_c("span", [_vm._v(_vm._s(_vm.$t("prw.fonts.add") || "Add Font"))])])]) : _vm._e(), _c("div", { staticClass: "pw-element-list" }, [_c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_vm._m(0), _c("div", { staticClass: "pw-field-row-options" }, [_c("label", { staticClass: "pw-font-upload-btn" }, [_c("k-icon", { attrs: { "type": "upload" } }), _vm._v(" Upload .woff2 "), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".woff2" }, on: { "change": _vm.onFileSelect } })], 1), _vm.newFont.files.length ? _c("span", { staticClass: "pw-font-file-selected" }, [_vm._v(_vm._s(_vm.newFont.files[0].name))]) : _vm._e()])])])]), _vm._m(1), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_vm._m(2), _c("div", { staticClass: "pw-field-row-options" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.newFont.family, expression: "newFont.family" }], staticClass: "pw-element-input pw-font-name-input", attrs: { "type": "text", "placeholder": "e.g. Acme, Roboto" }, domProps: { "value": _vm.newFont.family }, on: { "input": function($event) {
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
  var _sfc_staticRenderFns$1 = [function() {
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
  _sfc_render$1._withStripped = true;
  var __component__$1 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$1,
    _sfc_render$1,
    _sfc_staticRenderFns$1
  );
  __component__$1.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/components/GlobalFontManager.vue";
  const GlobalFontManager = __component__$1.exports;
  const _sfc_main = {
    data() {
      return {
        projectName: "",
        valetHost: "",
        isPublic: false,
        running: false,
        completed: false
      };
    },
    async created() {
      try {
        const res = await this.$api.get("projectwizard/setup/status");
        if (res.defaults) {
          this.projectName = res.defaults.projectName || "";
          this.valetHost = res.defaults.valetHost || "";
          this.isPublic = res.defaults.isPublic || false;
        }
        this.$nextTick(() => {
          if (this.isPublic) {
            this.openSetupDialog();
          } else {
            this.openPublicWarning();
          }
        });
      } catch (e) {
        console.error("Failed to load setup status", e);
      }
    },
    methods: {
      openPublicWarning() {
        this.$panel.dialog.open({
          component: "k-form-dialog",
          props: {
            fields: {
              info: {
                type: "info",
                label: this.$t("prw.setup.title"),
                text: this.$t("prw.setup.publicRequired"),
                theme: "negative"
              }
            },
            value: {},
            submitButton: false
          },
          on: {
            cancel: () => {
              this.$panel.dialog.close();
              window.location.href = "/panel";
            }
          }
        });
      },
      openSetupDialog() {
        this.$panel.dialog.open({
          component: "k-form-dialog",
          props: {
            fields: {
              info: {
                type: "info",
                label: this.$t("prw.setup.title"),
                text: this.$t("prw.setup.warning"),
                theme: "passive"
              }
            },
            value: {},
            submitButton: {
              text: this.$t("prw.setup.run"),
              theme: "negative"
            }
          },
          on: {
            submit: () => {
              this.$panel.dialog.close();
              this.runSetup();
            },
            cancel: () => {
              this.$panel.dialog.close();
              window.location.href = "/panel";
            }
          }
        });
      },
      async runSetup() {
        this.running = true;
        this.$panel.dialog.open({
          component: "k-text-dialog",
          props: {
            text: '<div style="text-align:center;padding:var(--spacing-6)"><div class="pw-setup-spinner" style="width:32px;height:32px;border:3px solid var(--color-gray-300);border-top-color:var(--color-blue-600);border-radius:50%;animation:pw-spin 0.6s linear infinite;margin:0 auto var(--spacing-4)"></div><p>' + this.$t("prw.setup.step.running") + "</p></div><style>@keyframes pw-spin{to{transform:rotate(360deg)}}</style>",
            cancelButton: false,
            submitButton: false
          }
        });
        try {
          const res = await this.$api.post("projectwizard/setup/run", {}, { timeout: 3e5 });
          if (res.success) {
            this.$panel.dialog.open({
              component: "k-text-dialog",
              props: {
                text: '<div style="text-align:center;padding:var(--spacing-6)"><div style="font-size:3rem;margin-bottom:var(--spacing-4)">&#10003;</div><h2>' + this.$t("prw.setup.complete") + '</h2><p style="color:var(--color-text-dimmed);margin-top:var(--spacing-2)">' + this.$t("prw.setup.completeHint") + "</p></div>",
                submitButton: {
                  text: this.$t("prw.setup.reload"),
                  icon: "refresh",
                  theme: "positive"
                },
                cancelButton: false
              },
              on: {
                submit: () => {
                  this.$panel.dialog.close();
                  window.location.reload();
                }
              }
            });
          } else {
            this.$panel.dialog.open({
              component: "k-text-dialog",
              props: {
                text: '<div style="text-align:center;padding:var(--spacing-6)"><div style="font-size:3rem;margin-bottom:var(--spacing-4);color:var(--color-negative-600)">&#10007;</div><h2>Setup Failed</h2><p style="color:var(--color-text-dimmed);margin-top:var(--spacing-2)">Step: ' + (res.failedStep || "unknown") + '</p><p style="font-family:var(--font-mono);font-size:var(--text-xs);margin-top:var(--spacing-2);color:var(--color-negative-600)">' + (res.error || "Unknown error") + "</p></div>"
              }
            });
          }
        } catch (e) {
          this.$panel.dialog.open({
            component: "k-text-dialog",
            props: {
              text: '<div style="text-align:center;padding:var(--spacing-6)"><div style="font-size:3rem;margin-bottom:var(--spacing-4);color:var(--color-negative-600)">&#10007;</div><h2>Setup Failed</h2><p style="font-family:var(--font-mono);font-size:var(--text-xs);margin-top:var(--spacing-2);color:var(--color-negative-600)">' + (e.message || "Request failed") + "</p></div>"
            }
          });
        }
      }
    }
  };
  var _sfc_render = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-panel-inside", { staticClass: "pw-wizard pw-setup" });
  };
  var _sfc_staticRenderFns = [];
  _sfc_render._withStripped = true;
  var __component__ = /* @__PURE__ */ normalizeComponent(
    _sfc_main,
    _sfc_render,
    _sfc_staticRenderFns
  );
  __component__.options.__file = "/Users/christian/Projects/kirbydesk/site/plugins/kirby-projectwizard/src/views/SetupWizard.vue";
  const SetupWizard = __component__.exports;
  panel.plugin("kirbydesk/kirby-projectwizard", {
    icons: {
      "prw-blocks": '<path d="M3 4C3 3.44772 3.44772 3 4 3H10C10.5523 3 11 3.44772 11 4V10C11 10.5523 10.5523 11 10 11H4C3.44772 11 3 10.5523 3 10V4ZM3 14C3 13.4477 3.44772 13 4 13H10C10.5523 13 11 13.4477 11 14V20C11 20.5523 10.5523 21 10 21H4C3.44772 21 3 20.5523 3 20V14ZM13 4C13 3.44772 13.4477 3 14 3H20C20.5523 3 21 3.44772 21 4V10C21 10.5523 20.5523 11 20 11H14C13.4477 11 13 10.5523 13 10V4ZM13 14C13 13.4477 13.4477 13 14 13H20C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H14C13.4477 21 13 20.5523 13 20V14ZM15 5V9H19V5H15ZM15 15V19H19V15H15ZM5 5V9H9V5H5ZM5 15V19H9V15H5Z"></path>',
      "prw-header": '<path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM18 7V9H6V7H18Z"></path>',
      "prw-footer": '<path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM4 16V19H20V16H4ZM4 14H20V5H4V14Z"></path>'
    },
    components: {
      "pw-wizard-overview": Overview,
      "pw-field-row": FieldRow,
      "pw-color-field-row": ColorFieldRow,
      "pw-global-elements": GlobalElements,
      "pw-global-fonts": GlobalFonts,
      "pw-block-settings": BlockSettings,
      "pw-global-elements-styles": GlobalElementStyles,
      "pw-global-navigation": GlobalNavigation,
      "pw-global-font-manager": GlobalFontManager,
      "pw-wizard-setup": SetupWizard
    }
  });
})();
