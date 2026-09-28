(function() {
  "use strict";
  const size = (el) => {
    if (!el.closest(".pw-field-table")) {
      el.style.width = "";
      return;
    }
    el.style.width = Math.max(String(el.value).length, 1) + 0.5 + "ch";
  };
  const format = (el) => {
    if (/^-?\d+$/.test(String(el.value).trim())) el.value = String(el.value).trim() + ".0";
    size(el);
  };
  const decimals = (number) => (String(number).split(".")[1] || "").length;
  const stepBy = (el, direction, big) => {
    const current = parseFloat(String(el.value).replace(",", "."));
    if (Number.isNaN(current)) return;
    const step = (parseFloat(el.getAttribute("step")) || 0.1) * (big ? 10 : 1);
    const places = Math.max(decimals(step), decimals(current));
    let next = Number((current + direction * step).toFixed(places));
    const min = parseFloat(el.getAttribute("min"));
    const max = parseFloat(el.getAttribute("max"));
    if (!Number.isNaN(min)) next = Math.max(min, next);
    if (!Number.isNaN(max)) next = Math.min(max, next);
    el.value = String(next);
    el.dispatchEvent(new Event("change"));
    format(el);
  };
  const autosize = {
    inserted(el) {
      format(el);
      el.addEventListener("input", () => {
        el.pwTyping = true;
        size(el);
      });
      el.addEventListener("blur", () => {
        el.pwTyping = false;
        format(el);
      });
      el.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        el.pwTyping = false;
        stepBy(el, event.key === "ArrowUp" ? 1 : -1, event.shiftKey);
      });
      const wrap = el.parentNode;
      if (wrap) {
        wrap.addEventListener("mousedown", (event) => {
          if (event.target === el) return;
          event.preventDefault();
          el.focus();
        });
      }
    },
    componentUpdated(el) {
      if (el.pwTyping) size(el);
      else format(el);
    }
  };
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
  const _sfc_main$d = {
    directives: { "pw-autosize": autosize },
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
        // element chosen in the header dropdown (tab "Elements")
        selectedElement: (() => {
          try {
            const e = sessionStorage.getItem("pw-wizard-element");
            sessionStorage.removeItem("pw-wizard-element");
            return e;
          } catch (e) {
            return null;
          }
        })(),
        // font shown in the fonts preview (null = the default font)
        previewFont: null,
        // block type → number of uses in the project (loaded when the blocks dropdown opens)
        blockUsage: {},
        showPreview: (() => {
          try {
            return localStorage.getItem("pw-wizard-preview") !== "off";
          } catch (e) {
            return true;
          }
        })(),
        // theme shown in the blocks' colour card and preview
        blocksColorTheme: "default",
        // device of the blocks preview
        blocksPreviewBp: "default",
        // radii kept while the corners are square (for switching back)
        customRadius: null,
        // padding step shown in the blocks' padding card
        paddingStep: "large",
        discardKey: 0,
        headerPill: "general",
        headerSubtab: "layout",
        blocks: [],
        activeBlocks: [],
        // theme variants switched on (besides "default"); variant3 off by default
        activeVariants: ["variant", "variant2"],
        originalActiveVariants: ["variant", "variant2"],
        activeTab: "global",
        globalActiveTab: (() => {
          try {
            const t = sessionStorage.getItem("pw-wizard-tab");
            sessionStorage.removeItem("pw-wizard-tab");
            return t || "general";
          } catch (e) {
            return "general";
          }
        })(),
        blockConfigs: {},
        blockOverrides: {},
        originalOverrides: {},
        blockValueDefaults: {},
        blockValueOverrides: {},
        originalBlockValueOverrides: {},
        originalActiveBlocks: [],
        dirtyTabs: {},
        snapshots: {},
        writerActive: {},
        // chosen tab of a block view (design, defaults, presets); null: the first
        blockViewTab: null,
        // steplist: item style shown in the design tab and the preview (per block)
        stepPreviewStyle: {},
        // theme shown in the items' colour card
        itemColorTheme: "default",
        // guides in the block preview (and the matching stripes in the rows)
        previewGuides: (() => {
          try {
            return localStorage.getItem("pw-wizard-guides") === "on";
          } catch (e) {
            return false;
          }
        })(),
        // breakpoint shown in the items' responsive rows
        itemBp: "default",
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
        originalFooterOverrides: {},
        aiForm: null,
        aiValues: {},
        originalAiValues: {},
        aiSecrets: null,
        aiSecretsWritable: true,
        aiSecretInputs: {}
      };
    },
    computed: {
      // tabs of the current view (global or block) for the header
      // top-level elements for the header dropdown (child elements like cite/caption
      // are edited together with their parent) — available on every view
      elementOptions() {
        const children = ["cite", "caption"];
        return Object.entries(this.elementDefaults || {}).filter(([key, val]) => val && typeof val === "object" && (val.vars || val.colors) && !children.includes(key)).map(([key]) => {
          const tKey = "prw.elementgroup." + key;
          const text = this.$t(tKey);
          const icons = { heading: "title", tagline: "tag", editor: "text", quote: "quote", button: "url", breadcrumb: "angle-right", media: "images" };
          return { value: key, text: text && text !== tKey ? text : key, icon: icons[key] || "layers" };
        });
      },
      // themes shown in the wizard: "default" plus the switched-on variants
      themes() {
        return ["default", ...this.activeVariants];
      },
      // outer spacing of the blocks (block layout): top and bottom
      marginSides() {
        return [
          { key: "top", name: "global-margin-top" },
          { key: "bottom", name: "global-margin-bottom" }
        ];
      },
      // the four paddings, one row each
      paddingSides() {
        return [
          { key: "top", name: "global-padding-top", pair: true },
          { key: "bottom", name: "global-padding-bottom", pair: true },
          { key: "left", name: "global-padding-left" },
          { key: "right", name: "global-padding-right" }
        ];
      },
      // global corners: square when all four radii are 0, else custom
      radiusShape() {
        const radii = this.globalLayoutValues["global-"] || [];
        return Array.isArray(radii) && radii.length && radii.every((r) => parseFloat(r) === 0) ? "square" : "custom";
      },
      // outer spacing of a block (global margins) around the preview tile
      blockPreviewMarginStyle() {
        return {
          paddingTop: this.globalLayoutValues["global-margin-top"] || 0,
          paddingBottom: this.globalLayoutValues["global-margin-bottom"] || 0
        };
      },
      currentBlocksColorTheme() {
        return this.themes.includes(this.blocksColorTheme) ? this.blocksColorTheme : "default";
      },
      // the chosen theme, back to "default" when its variant was switched off
      currentItemColorTheme() {
        return this.themes.includes(this.itemColorTheme) ? this.itemColorTheme : "default";
      },
      // global tabs collected in the cog dropdown (above the block settings), AI only with contentwizard
      // heading of a global view: the tab's name, for an element its name
      globalPageTitle() {
        if (this.globalActiveTab === "elements") {
          const element = this.elementOptions.find((o) => o.value === this.selectedElement);
          if (element) return element.text;
        }
        return this.$t("prw.tab." + this.globalActiveTab);
      },
      projectMenuTabs() {
        return ["general", "header", "footer", "blocks", "fonts", ...this.hasAiTab ? ["ai"] : []];
      },
      // activated blocks with their own settings view (pw* blocks), for the blocks dropdown
      // tabs of a block view: design (only with values), start values, restrictions
      blockViewTabs() {
        const views = this.hasDesign(this.activeTab) ? ["design", "defaults", "presets"] : ["defaults", "presets"];
        const icons = { design: "layout-columns", defaults: "edit-line", presets: "hidden" };
        return views.map((name) => ({
          name,
          icon: icons[name],
          label: this.$t("prw.view." + name),
          click: () => {
            this.blockViewTab = name;
          }
        }));
      },
      currentBlockView() {
        const names = this.blockViewTabs.map((t) => t.name);
        return names.includes(this.blockViewTab) ? this.blockViewTab : names[0];
      },
      activeBlockEntries() {
        return this.blocks.filter((b) => b.active && b.blockType.startsWith("pw"));
      },
      hasAiTab() {
        return !!this.aiForm || !!(this.aiSecrets && this.aiSecrets.length);
      },
      globalTabs() {
        const tabs = [
          { key: "general", icon: "globe" },
          { key: "blocks", icon: "box" },
          { key: "elements", icon: "layers" },
          { key: "fonts", icon: "title" },
          { key: "header", icon: "prw-header" },
          { key: "footer", icon: "prw-footer" }
        ];
        if (this.hasAiTab) tabs.push({ key: "ai", icon: "ai" });
        tabs.push({ key: "settings", icon: "cog" });
        return tabs;
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
      // global layout values (defaults + overrides), e.g. global-padding-left
      globalLayoutValues() {
        var _a;
        const vars = ((_a = this.globalDefaults.layout) == null ? void 0 : _a.vars) || {};
        const ov = this.globalOverrides.global || {};
        const out = {};
        for (const [name, def] of Object.entries(vars)) {
          out[name] = ov[name] !== void 0 && ov[name] !== "" ? ov[name] : def.value;
        }
        return out;
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
      // installed fonts (built-in and uploaded), each family once, sorted
      installedFonts() {
        const all = { ...this.fontsData.builtin || {}, ...this.fontsData.project || {} };
        const seen = /* @__PURE__ */ new Map();
        for (const f of Object.values(all)) {
          if (f && f.family && !seen.has(f.family)) seen.set(f.family, f);
        }
        return [...seen.values()].sort((a, b) => a.family.localeCompare(b.family));
      },
      previewFontFamily() {
        return this.previewFont || this.bodyDefaultFont;
      },
      previewFontStyle() {
        const font = this.installedFonts.find((f) => f.family === this.previewFontFamily);
        return {
          fontFamily: "'" + this.previewFontFamily + "', " + ((font == null ? void 0 : font.category) || "sans-serif"),
          // readable on the page background (the preview sits on it)
          color: this.contrastColor(this.bodyBackgroundColor)
        };
      },
      isDirty() {
        if (this.activeTab === "global") {
          const tab = this.globalActiveTab;
          if (tab === "settings") return !!this.dirtyTabs["global"];
          if (tab === "general") return !!this.dirtyTabs["global-settings"] || !!this.dirtyTabs["global"];
          if (["blocks", "fonts"].includes(tab)) return !!this.dirtyTabs["global-settings"];
          return !!this.dirtyTabs[tab];
        }
        return !!this.dirtyTabs[this.activeTab];
      }
    },
    watch: {
      // another block: start on its first tab
      activeTab() {
        this.blockViewTab = null;
      },
      blockType: {
        immediate: true,
        handler(val) {
          this.activeTab = val || "global";
        }
      },
      globalOverrides: { deep: true, handler() {
        this.injectPreviewStyles();
      } },
      previewGuides(on) {
        try {
          localStorage.setItem("pw-wizard-guides", on ? "on" : "off");
        } catch (e) {
        }
      },
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
          this.activeVariants = res.activeVariants || ["variant", "variant2"];
          this.originalActiveVariants = [...this.activeVariants];
          this.originalActiveBlocks = [...this.activeBlocks];
          this.$set(this.snapshots, "global", this.globalSnapshot());
          for (const block of this.blocks) {
            const config = await this.$api.get("projectwizard/block/" + block.blockType);
            this.$set(this.blockConfigs, block.blockType, config);
            const overrides = config.overrides && !Array.isArray(config.overrides) ? config.overrides : {};
            this.$set(this.blockOverrides, block.blockType, JSON.parse(JSON.stringify(overrides)));
            this.$set(this.originalOverrides, block.blockType, JSON.parse(JSON.stringify(overrides)));
            this.$set(this.snapshots, block.blockType, JSON.stringify(overrides));
            if (this.hasItemFields(block.blockType)) {
              try {
                const valuesRes = await this.$api.get("projectwizard/values/" + block.blockType);
                this.$set(this.blockValueDefaults, block.blockType, valuesRes.defaults || {});
                const vov = valuesRes.overrides && !Array.isArray(valuesRes.overrides) ? valuesRes.overrides : {};
                this.$set(this.blockValueOverrides, block.blockType, JSON.parse(JSON.stringify(vov)));
                this.$set(this.originalBlockValueOverrides, block.blockType, JSON.parse(JSON.stringify(vov)));
                this.$set(this.snapshots, block.blockType + ":values", JSON.stringify(vov));
              } catch (e) {
              }
            }
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
          try {
            const ai = await this.$api.get("contentwizard/settings");
            this.setAiForm(ai);
          } catch (e) {
            this.aiForm = null;
          }
          try {
            this.setAiSecrets(await this.$api.get("pagewizard/secrets"));
          } catch (e) {
            this.aiSecrets = null;
          }
          this.loading = false;
        } catch (e) {
          console.error("Failed to load", e);
        }
      },
      blockLabel(blockType) {
        const block = this.blocks.find((b) => b.blockType === blockType);
        if (block && block.name) return block.name;
        if (block) {
          const translated = this.$t(block.plugin + ".name");
          if (translated && translated !== block.plugin + ".name") return translated;
        }
        const name = blockType.replace(/^pw/, "").replace(/([A-Z])/g, " $1").trim() || blockType;
        return name.charAt(0).toUpperCase() + name.slice(1);
      },
      isItemBorderEnabled(blockType) {
        return this.itemLayoutDefault(blockType, "item-border") === true;
      },
      isItemLinkStyleButton(blockType) {
        return this.itemLayoutDefault(blockType, "item-link-style") === "button";
      },
      isItemShapeVisible(blockType) {
        const iconStyle = this.itemLayoutDefault(blockType, "item-icon-style");
        return iconStyle === void 0 || iconStyle === null || iconStyle === "tile";
      },
      isItemRadiusVisible(blockType) {
        if (!this.isItemShapeVisible(blockType)) return false;
        const shape = this.itemLayoutDefault(blockType, "item-shape");
        return shape === void 0 || shape === null || shape === "custom";
      },
      itemColorsShowOnly(blockType) {
        const list = ["item-background", "item-tagline-text", "item-heading-text", "item-editor-text"];
        if (!this.isItemLinkStyleButton(blockType)) {
          list.push("item-link", "item-link-hover", "item-link-active");
        }
        if (this.isItemBorderEnabled(blockType)) {
          list.push("item-border-color");
        }
        list.push("item-icon-fill");
        if (this.itemLayoutDefault(blockType, "item-icon-style") === "tile") {
          list.push("item-icon-tile-background");
        }
        if (blockType === "pwsteplist") {
          list.push(this.stepNumberColor(blockType));
          if (this.currentStepStyle(blockType) !== "minimal") list.push("item-number-background");
          if (this.currentStepStyle(blockType) === "connected") list.push("item-connector");
        } else {
          list.push("item-connector");
        }
        return list;
      },
      // square: all radii 0 (the custom ones kept for switching back);
      // custom: the kept radii, else the defaults
      setRadiusShape(shape) {
        const overrides = JSON.parse(JSON.stringify(this.globalOverrides || {}));
        if (!overrides.global) overrides.global = {};
        if (shape === "square") {
          if (this.radiusShape === "custom") this.customRadius = this.globalLayoutValues["global-"];
          overrides.global["global-"] = ["0rem", "0rem", "0rem", "0rem"];
        } else if (this.customRadius) {
          overrides.global["global-"] = [...this.customRadius];
        } else {
          delete overrides.global["global-"];
        }
        if (Object.keys(overrides.global).length === 0) delete overrides.global;
        this.onGlobalOverridesUpdate(overrides);
      },
      paddingStepValue(value) {
        return Array.isArray(value) ? value[this.paddingStep === "large" ? 1 : 0] : value;
      },
      // global padding of a side; top/bottom at the chosen step (small/large)
      paddingDefault(side) {
        var _a, _b, _c;
        const def = (_c = (_b = (_a = this.globalDefaults.layout) == null ? void 0 : _a.vars) == null ? void 0 : _b[side.name]) == null ? void 0 : _c.value;
        return side.pair ? Array.isArray(def) ? def[this.paddingStep === "large" ? 1 : 0] : "" : def || "";
      },
      paddingValue(side) {
        const ov = (this.globalOverrides.global || {})[side.name];
        if (side.pair) return Array.isArray(ov) && ov[this.paddingStep === "large" ? 1 : 0] || this.paddingDefault(side);
        return ov || this.paddingDefault(side);
      },
      setPadding(side, input) {
        var _a, _b, _c;
        const num = parseFloat(String(input).replace(",", "."));
        const value = isNaN(num) ? this.paddingDefault(side) : num + "rem";
        const overrides = JSON.parse(JSON.stringify(this.globalOverrides || {}));
        if (!overrides.global) overrides.global = {};
        const def = (_c = (_b = (_a = this.globalDefaults.layout) == null ? void 0 : _a.vars) == null ? void 0 : _b[side.name]) == null ? void 0 : _c.value;
        if (side.pair) {
          const current = Array.isArray(overrides.global[side.name]) ? [...overrides.global[side.name]] : [...def || []];
          current[this.paddingStep === "large" ? 1 : 0] = value;
          if (Array.isArray(def) && current.every((v, i) => v === def[i])) delete overrides.global[side.name];
          else overrides.global[side.name] = current;
        } else if (value === def) {
          delete overrides.global[side.name];
        } else {
          overrides.global[side.name] = value;
        }
        if (Object.keys(overrides.global).length === 0) delete overrides.global;
        this.onGlobalOverridesUpdate(overrides);
      },
      // a size step (heading-size-lg …) at a breakpoint: override, else default
      fontStep(element, step, bp = "default") {
        var _a, _b;
        const name = element + "-size-" + step;
        const entry = (_b = (_a = this.fontDefaults[element]) == null ? void 0 : _a.vars) == null ? void 0 : _b[name];
        if (!entry) return "";
        return ((this.fontOverrides.global || {})[bp] || {})[name] || entry[bp] || entry.default || "";
      },
      // near-black on a light colour, near-white on a dark one (#rgb/#rrggbb)
      contrastColor(color) {
        let hex = String(color || "").trim().replace("#", "");
        if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
        if (!/^[0-9a-f]{6}/i.test(hex)) return "";
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
        return (r * 299 + g * 587 + b * 114) / 1e3 > 140 ? "#111111" : "#f5f5f5";
      },
      // the items' four corner radii: override, else the plugin's value
      itemRadiusValues(blockType) {
        const ov = (this.blockValueOverrides[blockType] || {})["item-radius"];
        if (Array.isArray(ov)) {
          const def = this.itemRadiusDefaults(blockType);
          return def.map((v, i) => ov[i] || v);
        }
        return this.itemRadiusDefaults(blockType);
      },
      itemRadiusDefaults(blockType) {
        for (const group of Object.values(this.blockValueDefaults[blockType] || {})) {
          const def = group && group.vars && group.vars["item-radius"];
          if (def && Array.isArray(def.value)) return def.value;
        }
        return [];
      },
      // steplist: the item styles to choose from, and the one shown (the pill
      // chosen, else the block's preset)
      stepStyleOptions(blockType) {
        var _a, _b, _c, _d, _e;
        const def = (_e = (_d = (_c = (_b = (_a = this.blockConfigs[blockType]) == null ? void 0 : _a.defaults) == null ? void 0 : _b.settings) == null ? void 0 : _c.fields) == null ? void 0 : _d.style) == null ? void 0 : _e["item-style"];
        return def && def.options || ["default"];
      },
      // a value of the shown style: "default" uses the plain name, the other
      // styles their own (item-number-size-centered …)
      stepValueKey(blockType, name) {
        const style = this.currentStepStyle(blockType);
        return style === "default" ? name : name + "-" + style;
      },
      // colour of the number: the digit in the bubble, minimal: the text
      // (which the steplist CSS colours with the "background" colour)
      stepNumberColor(blockType) {
        return this.currentStepStyle(blockType) === "minimal" ? "item-number-background" : "item-number-text";
      },
      // steplist colour rows: the number's colour named "Numbering", its
      // bubble background "Background colour"
      stepColorLabels(blockType) {
        const labels = { [this.stepNumberColor(blockType)]: this.$t("prw.headline.numbering") };
        if (this.currentStepStyle(blockType) !== "minimal") labels["item-number-background"] = this.$t("prw.label.backgroundColor");
        return labels;
      },
      // alignment of the number in the shown style (centered: always centre)
      stepAlign(blockType) {
        if (this.currentStepStyle(blockType) === "centered") return "center";
        return this.itemLayoutDefault(blockType, this.stepValueKey(blockType, "item-number-align")) || "center";
      },
      currentStepStyle(blockType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        if (this.stepPreviewStyle[blockType]) return this.stepPreviewStyle[blockType];
        const ov = (_e = (_d = (_c = (_b = (_a = this.blockOverrides[blockType]) == null ? void 0 : _a.settings) == null ? void 0 : _b.fields) == null ? void 0 : _c.style) == null ? void 0 : _d["item-style"]) == null ? void 0 : _e.default;
        return ov || ((_k = (_j = (_i = (_h = (_g = (_f = this.blockConfigs[blockType]) == null ? void 0 : _f.defaults) == null ? void 0 : _g.settings) == null ? void 0 : _h.fields) == null ? void 0 : _i.style) == null ? void 0 : _j["item-style"]) == null ? void 0 : _k.default) || "default";
      },
      itemLayoutDefault(blockType, key) {
        const ov = this.blockOverrides[blockType];
        const ovVal = ov && ov.settings && ov.settings.fields && ov.settings.fields.layout && ov.settings.fields.layout[key] && ov.settings.fields.layout[key].default;
        if (ovVal !== void 0) return ovVal;
        const cfg = this.blockConfigs[blockType];
        return cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields && cfg.defaults.settings.fields.layout && cfg.defaults.settings.fields.layout[key] && cfg.defaults.settings.fields.layout[key].default;
      },
      hasItemFields(blockType) {
        const cfg = this.blockConfigs[blockType];
        const content = cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields && cfg.defaults.settings.fields.content || {};
        return content.blocks !== void 0 && content.blocks !== false;
      },
      // a block with values of its own (the items' CSS variables)
      hasDesign(blockType) {
        return this.hasItemFields(blockType) && !!this.blockValueDefaults[blockType];
      },
      hasItemDefaultFields(blockType) {
        const cfg = this.blockConfigs[blockType];
        const layout = cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields && cfg.defaults.settings.fields.layout || {};
        for (const key of Object.keys(layout)) {
          if (key.startsWith("item-radius-") || key === "item-link-style") return true;
        }
        return false;
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
        this.$set(this.dirtyTabs, "global", this.globalSnapshot() !== this.snapshots["global"]);
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
          this.$panel.notification.error(this.$t("prw.notify.fontsizes.error"));
        }
      },
      // --- Global: AI (kirby-contentwizard) ---
      setAiForm(ai) {
        this.aiForm = { fields: ai.fields || {} };
        this.aiValues = JSON.parse(JSON.stringify(ai.value || {}));
        this.originalAiValues = JSON.parse(JSON.stringify(ai.value || {}));
        this.$set(this.snapshots, "ai", JSON.stringify(this.aiValues));
        this.$set(this.dirtyTabs, "ai", false);
      },
      onAiInput(values) {
        this.aiValues = values;
        this.updateAiDirty();
      },
      setAiSecrets(res) {
        this.aiSecrets = res.secrets || [];
        this.aiSecretsWritable = res.writable !== false;
        this.aiSecretInputs = {};
      },
      onSecretInput(env, value) {
        this.$set(this.aiSecretInputs, env, value);
        this.updateAiDirty();
      },
      updateAiDirty() {
        const settingsDirty = !!this.aiForm && JSON.stringify(this.aiValues) !== this.snapshots["ai"];
        const keysDirty = Object.values(this.aiSecretInputs).some((v) => v && v.trim() !== "");
        this.$set(this.dirtyTabs, "ai", settingsDirty || keysDirty);
      },
      async removeSecret(secret) {
        if (!window.confirm(this.$t("prw.ai.keys.confirm", { label: secret.label }))) return;
        try {
          this.setAiSecrets(await this.$api.post("pagewizard/secrets", { remove: [secret.env] }));
          this.updateAiDirty();
          this.$panel.notification.success(this.$t("prw.notify.ai.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.ai.error"));
        }
      },
      async saveAi() {
        try {
          if (this.aiForm && JSON.stringify(this.aiValues) !== this.snapshots["ai"]) {
            this.setAiForm(await this.$api.post("contentwizard/settings", this.aiValues));
          }
          const set = {};
          for (const [env, value] of Object.entries(this.aiSecretInputs)) {
            if (value && value.trim() !== "") set[env] = value.trim();
          }
          if (Object.keys(set).length) {
            this.setAiSecrets(await this.$api.post("pagewizard/secrets", { set }));
          }
          this.updateAiDirty();
          this.$panel.notification.success(this.$t("prw.notify.ai.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.ai.error"));
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
          this.$panel.notification.success(this.$t("prw.notify.footer.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.footer.error"));
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
          this.$panel.notification.success(this.$t("prw.notify.elements.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.elements.error"));
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
      blockPreviewStyle(theme, single = false) {
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
        if (Array.isArray(radius) && radius.length === 4 && single) {
          borderRadius = [radius[0], radius[1], radius[3], radius[2]].join(" ");
        } else if (Array.isArray(radius) && radius.length === 4) {
          if (theme === "default") {
            borderRadius = radius[0] + " " + radius[1] + " 0 0";
          } else if (theme === "variant3") {
            borderRadius = "0 0 " + radius[3] + " " + radius[2];
          } else {
            borderRadius = "0";
          }
        }
        return {
          backgroundColor: bg,
          // top/bottom are small/large pairs: the step chosen in the padding card
          paddingTop: this.paddingStepValue(getGlobal("global-padding-top")) || "1.5rem",
          paddingBottom: this.paddingStepValue(getGlobal("global-padding-bottom")) || "1.5rem",
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
      blockPreviewElementStyle(element, theme, bp = "default") {
        var _a, _b;
        const elDef = this.elementDefaults[element] || {};
        const elOv = this.elementOverrides.global || {};
        const get = (v) => elOv[v] || "";
        const def = (v) => {
          var _a2;
          const d = (_a2 = elDef.vars) == null ? void 0 : _a2[v];
          if (!d) return "";
          if (d.default !== void 0) return (elOv[bp] || {})[v] || d[bp] || d.default;
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
          // headings have no base size: the "lg" step, as in the frontend
          fontSize: def(element + "-font-size") || this.fontStep(element, "lg", bp),
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
        const decoration = this.globalLayoutValue("block-link-decoration") || "none";
        return {
          color: colorOv || colorDef,
          textDecorationLine: decoration === "always" ? "underline" : "none",
          textDecorationThickness: this.globalLayoutValue("block-link-thickness"),
          textUnderlineOffset: this.globalLayoutValue("block-link-offset"),
          cursor: "pointer"
        };
      },
      // a global value of any group (override, else the plugin's)
      globalLayoutValue(name) {
        const ov = (this.globalOverrides.global || {})[name];
        if (ov !== void 0 && ov !== "") return ov;
        for (const group of Object.values(this.globalDefaults || {})) {
          if (group && group.vars && group.vars[name]) return group.vars[name].value;
        }
        return "";
      },
      // gap between the editor's paragraphs (em: at the paragraph's size)
      blockPreviewParagraphSpacing() {
        var _a, _b, _c;
        return (this.elementOverrides.global || {})["editor-paragraph-spacing"] || ((_c = (_b = (_a = this.elementDefaults.editor) == null ? void 0 : _a.vars) == null ? void 0 : _b["editor-paragraph-spacing"]) == null ? void 0 : _c.value) || "0";
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
        for (const theme of ["default", "variant", "variant2", "variant3"]) {
          const linkHover = this.blockPreviewLinkColor(theme, "-hover");
          const linkActive = this.blockPreviewLinkColor(theme, "-active");
          rules.push(".pw-preview-link-" + theme + ":hover { color: " + linkHover + " !important;" + (this.globalLayoutValue("block-link-decoration") === "none" ? "" : " text-decoration-line: underline !important;") + " }");
          rules.push(".pw-preview-link-" + theme + ":active { color: " + linkActive + " !important; }");
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
          this.$panel.notification.success(this.$t("prw.notify.header.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.header.error"));
        }
      },
      // --- Block overrides ---
      onBlockOverridesUpdate(blockType, overrides) {
        overrides = JSON.parse(JSON.stringify(overrides || {}));
        this.$set(this.blockOverrides, blockType, overrides);
        const current = JSON.stringify(overrides);
        const snapshot = this.snapshots[blockType] || "{}";
        this.$set(this.dirtyTabs, blockType, current !== snapshot);
        const config = this.blockConfigs[blockType];
        if (config) config.hasOverrides = Object.keys(overrides || {}).length > 0;
      },
      // --- Save / Discard ---
      isGlobalTab(...keys) {
        return this.activeTab === "global" && keys.includes(this.globalActiveTab);
      },
      // Opens a tab of the global view; from a block view it switches views and
      // remembers the tab (and element) for the global view to pick up.
      openGlobal(tab, element = null) {
        this.globalActiveTab = tab;
        if (this.activeTab === "global") return;
        try {
          sessionStorage.setItem("pw-wizard-tab", tab);
          if (element) sessionStorage.setItem("pw-wizard-element", element);
        } catch (e) {
        }
        this.$go("projectwizard");
      },
      async loadBlockUsage() {
        try {
          this.blockUsage = await this.$api.get("projectwizard/blocks/usage");
        } catch (e) {
        }
      },
      globalSnapshot() {
        return JSON.stringify({ blocks: this.activeBlocks, variants: this.activeVariants });
      },
      toggleVariant(variant, on) {
        const set = new Set(this.activeVariants);
        on ? set.add(variant) : set.delete(variant);
        this.activeVariants = ["variant", "variant2", "variant3"].filter((v) => set.has(v));
        this.$set(this.dirtyTabs, "global", this.globalSnapshot() !== this.snapshots["global"]);
      },
      togglePreview() {
        this.showPreview = !this.showPreview;
        try {
          localStorage.setItem("pw-wizard-preview", this.showPreview ? "on" : "off");
        } catch (e) {
        }
      },
      async saveCurrentView() {
        const cssBefore = await this.frontendCssVersion();
        if (this.activeTab === "global") {
          const tab = this.globalActiveTab;
          if (tab === "settings") {
            await this.saveGlobal();
          } else if (tab === "general") {
            if (this.dirtyTabs["global-settings"]) await this.saveGlobalSettings();
            if (this.dirtyTabs["global"]) await this.saveGlobal();
          } else if (["blocks", "fonts"].includes(tab)) {
            await this.saveGlobalSettings();
          } else if (tab === "elements") {
            await this.saveElements();
          } else if (tab === "header") {
            await this.saveNavigation();
          } else if (tab === "footer") {
            await this.saveFooter();
          } else if (tab === "ai") {
            await this.saveAi();
          }
        } else {
          await this.saveBlock(this.activeTab);
        }
        try {
          await fetch(window.location.origin, { cache: "no-store" });
        } catch (e) {
        }
        this.reloadFrontend(cssBefore);
      },
      // Last-Modified of the built frontend CSS (Tailwind rebuilds it in the background)
      async frontendCssVersion() {
        try {
          const res = await fetch(window.panel.urls.site + "/assets/css/site.min.css", { method: "HEAD", cache: "no-store" });
          return res.headers.get("last-modified");
        } catch (e) {
          return null;
        }
      },
      // Reload open frontend tabs like a module save does (pagewizard's reloadOnSave
      // listens on this channel) — once the new CSS is built, at most after 3 s.
      async reloadFrontend(cssBefore) {
        if (!("BroadcastChannel" in window)) return;
        for (let waited = 0; waited < 3e3; waited += 250) {
          if (await this.frontendCssVersion() !== cssBefore) break;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (!this._frontendChannel) this._frontendChannel = new BroadcastChannel(window.panel.urls.site);
        this._frontendChannel.postMessage("content/saved");
      },
      discardChanges() {
        if (this.activeTab === "global") {
          const tab = this.globalActiveTab;
          if (tab === "settings" || tab === "general") {
            this.activeBlocks = [...this.originalActiveBlocks];
            this.activeVariants = [...this.originalActiveVariants];
            for (const block of this.blocks) {
              block.active = this.activeBlocks.includes(block.blockType);
            }
            this.$set(this.dirtyTabs, "global", false);
          }
          if (["general", "blocks", "fonts"].includes(tab)) {
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
          } else if (tab === "ai") {
            this.aiValues = JSON.parse(JSON.stringify(this.originalAiValues));
            this.aiSecretInputs = {};
            this.$set(this.dirtyTabs, "ai", false);
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
          await this.$api.post("projectwizard/blocks/active", { blocks: this.activeBlocks, variants: this.activeVariants });
          this.originalActiveBlocks = [...this.activeBlocks];
          this.originalActiveVariants = [...this.activeVariants];
          this.$set(this.snapshots, "global", this.globalSnapshot());
          this.$set(this.dirtyTabs, "global", false);
          this.$panel.notification.success(this.$t("prw.notify.blocks.success"));
          setTimeout(() => window.location.reload(), 100);
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.blocks.error"));
        }
      },
      async saveGlobalSettings() {
        try {
          const res = await this.$api.post("projectwizard/global", this.globalOverrides);
          this.globalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.originalGlobalOverrides = JSON.parse(JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.snapshots, "global-settings", JSON.stringify(this.safeOverrides(res.overrides)));
          this.$set(this.dirtyTabs, "global-settings", false);
          this.$panel.notification.success(this.$t("prw.notify.global.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.global.error"));
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
          if (this.hasItemFields(blockType)) {
            const valuesRes = await this.$api.post(
              "projectwizard/values/" + blockType,
              this.blockValueOverrides[blockType] || {}
            );
            const ov = valuesRes.overrides && !Array.isArray(valuesRes.overrides) ? valuesRes.overrides : {};
            this.$set(this.blockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
            this.$set(this.originalBlockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
            this.$set(this.snapshots, blockType + ":values", JSON.stringify(ov));
          }
          this.$panel.notification.success(this.$t("prw.notify.block.success", { block: this.blockLabel(blockType) }));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.block.error", { block: this.blockLabel(blockType) }));
        }
      },
      onBlockValueOverridesUpdate(blockType, overrides) {
        this.$set(this.blockValueOverrides, blockType, overrides);
        const valuesDirty = JSON.stringify(overrides) !== this.snapshots[blockType + ":values"];
        const settingsDirty = JSON.stringify(this.blockOverrides[blockType] || {}) !== this.snapshots[blockType];
        this.$set(this.dirtyTabs, blockType, valuesDirty || settingsDirty);
      },
      safeOverrides(ov) {
        return ov && !Array.isArray(ov) ? ov : {};
      }
    }
  };
  var _sfc_render$d = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-panel-inside", { staticClass: "pw-wizard", style: { "--pw-body-background": _vm.bodyBackgroundColor }, attrs: { "data-preview": _vm.showPreview ? "on" : "off" } }, [_c("pw-portal", { attrs: { "to": ".pw-wizard .k-topbar" } }, [_c("div", { staticClass: "pw-topbar" }, [!_vm.loading ? _c("div", { staticClass: "pw-pill pw-tabs", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "aria-haspopup": "menu", "aria-pressed": _vm.isGlobalTab(..._vm.projectMenuTabs, "settings") ? "true" : "false" }, on: { "click": function($event) {
      return _vm.$refs.settingsMenu.toggle();
    } } }, [_c("k-icon", { attrs: { "type": "globe" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.project")))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "settingsMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, [_vm._l(_vm.projectMenuTabs.map((key) => _vm.globalTabs.find((t) => t.key === key)).filter(Boolean), function(tab, idx) {
      return [_c("button", { key: tab.key, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.isGlobalTab(tab.key) ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.settingsMenu.close();
        _vm.openGlobal(tab.key);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": tab.icon } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab." + tab.key)))])]), idx === 0 ? _c("hr", { key: "hr-" + tab.key }) : _vm._e()];
    }), _c("hr"), _c("button", { staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.isGlobalTab("settings") ? "true" : void 0 }, on: { "click": function($event) {
      _vm.$refs.settingsMenu.close();
      _vm.openGlobal("settings");
    } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": "cog" } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.settings")))])])], 2)])], 1)]) : _vm._e(), !_vm.loading ? _c("div", { staticClass: "pw-pill pw-tabs", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "aria-haspopup": "menu", "aria-pressed": _vm.isGlobalTab("elements") ? "true" : "false" }, on: { "click": function($event) {
      return _vm.$refs.elementsMenu.toggle();
    } } }, [_c("k-icon", { attrs: { "type": "layers" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.elements")))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "elementsMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, _vm._l(_vm.elementOptions, function(option) {
      return _c("button", { key: option.value, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.isGlobalTab("elements") && _vm.selectedElement === option.value ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.elementsMenu.close();
        _vm.selectedElement = option.value;
        _vm.openGlobal("elements", option.value);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": option.icon } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(option.text))])]);
    }), 0)])], 1)]) : _vm._e(), !_vm.loading ? _c("div", { staticClass: "pw-pill", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "aria-haspopup": "menu", "aria-pressed": _vm.activeTab !== "global" ? "true" : "false" }, on: { "click": function($event) {
      _vm.$refs.blocksMenu.toggle();
      _vm.loadBlockUsage();
    } } }, [_c("k-icon", { attrs: { "type": "box" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.blocks")))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "blocksMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, [_vm.activeBlockEntries.length ? _vm._l(_vm.activeBlockEntries, function(entry) {
      return _c("button", { key: entry.blockType, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.activeTab === entry.blockType ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.blocksMenu.close();
        _vm.$go("projectwizard/block/" + entry.blockType);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": entry.icon || "box" } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(" " + _vm._s(_vm.blockLabel(entry.blockType)) + " "), _vm.blockUsage[entry.blockType] !== void 0 ? _c("span", { staticClass: "pw-menu-count" }, [_vm._v(_vm._s(_vm.blockUsage[entry.blockType]))]) : _vm._e()])]);
    }) : _vm._e()], 2)])], 1)]) : _vm._e(), _vm.isDirty ? _c("div", { staticClass: "k-form-controls pw-topbar-controls" }, [_c("div", { staticClass: "k-button-group", attrs: { "data-layout": "collapsed" } }, [_c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": _vm.$t("discard"), "icon": "undo", "theme": "notice", "variant": "filled", "size": "sm", "responsive": "true" }, on: { "click": _vm.discardChanges } }), _c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": _vm.$t("save"), "icon": "check", "theme": "notice", "variant": "filled", "size": "sm" }, on: { "click": _vm.saveCurrentView } })], 1)]) : _vm._e()])]), _vm.loading ? _c("div", { staticClass: "pw-wizard-loading" }, [_vm._v(_vm._s(_vm.$t("loading")) + " …")]) : _c("div", { staticClass: "pw-wizard-columns" }, [_c("div", { staticClass: "pw-wizard-content" }, [!_vm.loading && _vm.activeTab === "global" ? _c("div", { staticClass: "pw-page-title-row" }, [_c("h1", { staticClass: "pw-page-title" }, [_vm._v(_vm._s(_vm.globalPageTitle))])]) : _vm._e(), !_vm.loading && _vm.activeTab !== "global" ? [_c("div", { staticClass: "pw-page-title-row pw-page-title-row-tabs" }, [_c("h1", { staticClass: "pw-page-title" }, [_vm._v(_vm._s(_vm.blockLabel(_vm.activeTab)))]), _c("k-tabs", { staticClass: "pw-block-view-tabs", attrs: { "tab": _vm.currentBlockView, "tabs": _vm.blockViewTabs } })], 1), _c("p", { staticClass: "pw-block-view-intro" }, [_vm._v(_vm._s(_vm.$t("prw.view." + _vm.currentBlockView + ".intro")))])] : _vm._e(), _vm.activeTab === "global" ? _c("div", { staticClass: "pw-wizard-panel" }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "settings", expression: "globalActiveTab === 'settings'" }], staticClass: "pw-wizard-global-content" }, [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.label.variants")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(["variant", "variant2", "variant3"], function(variant) {
      return _c("div", { key: variant, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("pw.option." + variant)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.activeVariants.includes(variant) ? "true" : "false", "options": [{ value: "true", text: _vm.$t("pw.option.enabled") }, { value: "false", text: _vm.$t("pw.option.disabled") }], "grow": false, "required": true }, on: { "input": function($event) {
        return _vm.toggleVariant(variant, $event === "true");
      } } })], 1)])])]);
    }), 0)])]), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "general", expression: "globalActiveTab === 'general'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-elements", { attrs: { "blocks": _vm.blocks }, on: { "toggle": function($event) {
      return _vm.toggleBlock($event.blockType, $event.checked);
    } } }), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-only": ["body-background"], "vars-only": true, "hide-section-headers": true }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1)])], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "blocks", expression: "globalActiveTab === 'blocks'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === "global" && _vm.globalActiveTab === "blocks", expression: "activeTab === 'global' && globalActiveTab === 'blocks'" }], staticClass: "pw-element-preview-side" }, [_c("div", { staticClass: "pw-preview-switches" }, [_c("div", { staticClass: "pw-pill pw-preview-bp pw-preview-theme", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "bpt-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentBlocksColorTheme === t ? "true" : "false" }, on: { "click": function($event) {
        _vm.blocksColorTheme = t;
      } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0), _c("div", { staticClass: "pw-pill pw-guides-switch", attrs: { "role": "group" } }, [_c("button", { staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t("prw.preview.guides"), "aria-label": _vm.$t("prw.preview.guides"), "aria-pressed": _vm.previewGuides ? "true" : "false" }, on: { "click": function($event) {
      _vm.previewGuides = !_vm.previewGuides;
    } } }, [_c("k-icon", { attrs: { "type": "prw-guides" } })], 1)]), _c("pw-device-select", { model: { value: _vm.blocksPreviewBp, callback: function($$v) {
      _vm.blocksPreviewBp = $$v;
    }, expression: "blocksPreviewBp" } })], 1), _c("div", { staticClass: "pw-block-preview-body", style: _vm.blockPreviewBodyStyle }, [_c("div", { staticClass: "pw-block-preview-row pw-block-preview-spaced", class: { "has-guides": _vm.previewGuides }, style: _vm.blockPreviewMarginStyle }, _vm._l([_vm.currentBlocksColorTheme], function(theme) {
      return _c("div", { key: theme, staticClass: "pw-block-preview", class: { "has-guides": _vm.previewGuides }, style: _vm.blockPreviewStyle(theme, true) }, [_c("div", { staticClass: "pw-block-preview-content pw-block-preview-text" }, [_c("p", { style: _vm.blockPreviewElementStyle("editor", theme, _vm.blocksPreviewBp) }, [_vm._v(_vm._s(_vm.$t("prw.preview.text.before")) + " "), _c("a", { class: "pw-preview-link-" + theme, style: _vm.blockPreviewLinkStyle(theme, "") }, [_vm._v(_vm._s(_vm.$t("prw.preview.text.link")))]), _vm._v(_vm._s(_vm.$t("prw.preview.text.after")))]), _c("p", { style: { ..._vm.blockPreviewElementStyle("editor", theme, _vm.blocksPreviewBp), marginTop: _vm.blockPreviewParagraphSpacing() } }, [_vm._v(_vm._s(_vm.$t("prw.sample.editor.2")))])])]);
    }), 0)])])]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.paddings")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("div", { staticClass: "pw-field-row", attrs: { "data-guide": _vm.previewGuides ? "padding" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.leftRight")))])]), _c("div", { staticClass: "pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid" }, _vm._l(_vm.paddingSides.filter((sd) => !sd.pair), function(side) {
      return _c("span", { key: side.key, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", attrs: { "type": "text", "inputmode": "decimal", "step": "0.1", "min": "0", "max": "20" }, domProps: { "value": parseFloat(_vm.paddingValue(side)) || 0 }, on: { "change": function($event) {
        return _vm.setPadding(side, $event.target.value);
      } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(Math.round((parseFloat(_vm.paddingValue(side)) || 0) * 16)) + "px")]), _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": "grid-" + side.key } })], 1);
    }), 0)])])]), _c("div", { staticClass: "pw-field-row", attrs: { "data-guide": _vm.previewGuides ? "padding" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.topBottom")))]), _c("span", { staticClass: "pw-pill pw-bp-switch pw-label-switch", attrs: { "role": "group" } }, _vm._l(["small", "large"], function(step) {
      return _c("button", { key: "ps-" + step, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t("pw.option." + step), "aria-label": _vm.$t("pw.option." + step), "aria-pressed": _vm.paddingStep === step ? "true" : "false" }, on: { "click": function($event) {
        _vm.paddingStep = step;
      } } }, [_c("k-icon", { attrs: { "type": "prw-step-" + step } })], 1);
    }), 0)]), _c("div", { staticClass: "pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid" }, _vm._l(_vm.paddingSides.filter((sd) => sd.pair), function(side) {
      return _c("span", { key: side.key, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", attrs: { "type": "text", "inputmode": "decimal", "step": "0.1", "min": "0", "max": "20" }, domProps: { "value": parseFloat(_vm.paddingValue(side)) || 0 }, on: { "change": function($event) {
        return _vm.setPadding(side, $event.target.value);
      } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(Math.round((parseFloat(_vm.paddingValue(side)) || 0) * 16)) + "px")]), _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": "grid-" + side.key } })], 1);
    }), 0)])])])])]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.margins")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("div", { staticClass: "pw-field-row", attrs: { "data-guide": _vm.previewGuides ? "margin" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.topBottom")))])]), _c("div", { staticClass: "pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid" }, _vm._l(_vm.marginSides, function(side) {
      return _c("span", { key: side.key, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", attrs: { "type": "text", "inputmode": "decimal", "step": "0.1", "min": "0", "max": "20" }, domProps: { "value": parseFloat(_vm.paddingValue(side)) || 0 }, on: { "change": function($event) {
        return _vm.setPadding(side, $event.target.value);
      } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(Math.round((parseFloat(_vm.paddingValue(side)) || 0) * 16)) + "px")]), _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": "grid-" + side.key } })], 1);
    }), 0)])])])])]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.shape")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.element.button-shape")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.radiusShape, "options": [{ value: "square", text: _vm.$t("pw.option.square") }, { value: "custom", text: _vm.$t("pw.option.round") }], "grow": false, "required": true }, on: { "input": _vm.setRadiusShape } })], 1)])])]), _vm.radiusShape === "custom" ? _c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": ["global-"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } }) : _vm._e()], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "bt-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentBlocksColorTheme === t ? "true" : "false" }, on: { "click": function($event) {
        _vm.blocksColorTheme = t;
      } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": [], "show-colors": true, "theme": _vm.currentBlocksColorTheme, "hide-color-names": ["block-link"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.links")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "lk-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentBlocksColorTheme === t ? "true" : "false" }, on: { "click": function($event) {
        _vm.blocksColorTheme = t;
      } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": ["block-link-decoration", "block-link-thickness", "block-link-offset"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } }), _c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": [], "show-colors": true, "theme": _vm.currentBlocksColorTheme, "color-names": ["block-link"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1)])], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "fonts", expression: "globalActiveTab === 'fonts'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === "global" && _vm.globalActiveTab === "fonts", expression: "activeTab === 'global' && globalActiveTab === 'fonts'" }] }, [_c("div", { staticClass: "pw-preview-switches" }, [_c("div", { staticClass: "pw-pill pw-font-preview-select", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "aria-haspopup": "menu" }, on: { "click": function($event) {
      return _vm.$refs.fontPreviewMenu.toggle();
    } } }, [_c("k-icon", { attrs: { "type": "title" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.previewFontFamily))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "fontPreviewMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, _vm._l(_vm.installedFonts, function(font) {
      return _c("button", { key: font.family, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "aria-current": _vm.previewFontFamily === font.family ? "true" : void 0 }, on: { "click": function($event) {
        _vm.previewFont = font.family;
        _vm.$refs.fontPreviewMenu.close();
      } } }, [_c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(font.family === _vm.bodyDefaultFont ? _vm.$t("prw.label.defaultFont", { font: font.family }) : font.family))])]);
    }), 0)])], 1)])]), _c("div", { staticClass: "pw-default-font-preview", style: _vm.previewFontStyle }, _vm._l(["large", "medium", "small"], function(size2) {
      return _c("p", { key: size2, attrs: { "data-size": size2 } }, [_vm._v(_vm._s(_vm.$t("prw.preview.font")))]);
    }), 0)])]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.defaultFont")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-only": ["font-family-default"], "hide-section-headers": true }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.installed-fonts")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-font-manager", { attrs: { "fonts": _vm.fontsData, "mode": "installed" }, on: { "update": _vm.loadFontsData } })], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.add-font")))])]), _c("pw-global-font-manager", { attrs: { "fonts": _vm.fontsData, "mode": "add" }, on: { "update": _vm.loadFontsData } })], 1)], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "elements", expression: "globalActiveTab === 'elements'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-elements-styles", { attrs: { "guides": _vm.previewGuides, "preview-active": _vm.activeTab === "global" && _vm.globalActiveTab === "elements", "themes": _vm.themes, "selected-element": _vm.selectedElement, "element-defaults": _vm.elementDefaults, "element-overrides": _vm.elementOverrides, "saved-overrides": _vm.originalElementOverrides, "discard-key": _vm.discardKey, "global-defaults": _vm.globalDefaults, "global-overrides": _vm.globalOverrides, "fonts": _vm.fontsData, "font-defaults": _vm.fontDefaults, "font-overrides": _vm.fontOverrides, "body-default-font": _vm.bodyDefaultFont }, on: { "update:guides": function($event) {
      _vm.previewGuides = $event;
    }, "update:selectedElement": function($event) {
      _vm.selectedElement = $event;
    }, "update:selected-element": function($event) {
      _vm.selectedElement = $event;
    }, "update:overrides": _vm.onElementOverridesUpdate, "update:font-overrides": _vm.onFontOverridesUpdate } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "header", expression: "globalActiveTab === 'header'" }], staticClass: "pw-wizard-global-content" }, [_c("div", { staticClass: "pw-element-pills" }, _vm._l(["general", "desktop", "tablet", "mobile"], function(pill) {
      return _c("button", { key: pill, staticClass: "pw-element-pill", class: { "is-active": (_vm.headerPill || "general") === pill }, attrs: { "type": "button" }, on: { "click": function($event) {
        _vm.headerPill = pill;
        _vm.headerSubtab = null;
      } } }, [_vm._v(_vm._s(_vm.$t("prw.prop." + pill) || pill))]);
    }), 0), _c("pw-global-navigation", { directives: [{ name: "show", rawName: "v-show", value: (_vm.headerPill || "general") === "general", expression: "(headerPill || 'general') === 'general'" }], attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "saved-overrides": _vm.originalNavOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-group": "general", "hide-section-headers": true }, on: { "update:overrides": _vm.onNavOverridesUpdate } }), _vm.headerPill && _vm.headerPill !== "general" ? [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-group": _vm.headerPill, "show-preview": true, "show-flyout": _vm.headerSubtab === "flyout" || _vm.headerSubtab === "flyout-colors", "hide-section-headers": true }, on: { "update:overrides": _vm.onNavOverridesUpdate } }), _c("div", { staticClass: "pw-element-subtabs" }, _vm._l(_vm.headerSubtabs, function(st) {
      return _c("button", { key: st.key, staticClass: "pw-element-subtab", class: { "is-active": (_vm.headerSubtab || _vm.headerSubtabs[0].key) === st.key }, attrs: { "type": "button" }, on: { "click": function($event) {
        _vm.headerSubtab = st.key;
      } } }, [_vm._v(_vm._s(st.label))]);
    }), 0), _c("pw-global-navigation", { attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "saved-overrides": _vm.originalNavOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-group": _vm.headerPill, "show-only": _vm.headerNavShowOnly, "show-colors": true, "hide-section-headers": true, "hide-preview": true }, on: { "update:overrides": _vm.onNavOverridesUpdate } })] : _vm._e()], 2), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "footer", expression: "globalActiveTab === 'footer'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.footerDefaults, "nav-overrides": _vm.footerOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onFooterOverridesUpdate } })], 1), _vm.hasAiTab ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "ai", expression: "globalActiveTab === 'ai'" }], staticClass: "pw-wizard-global-content pw-ai-settings", class: { "pw-ai-single": !_vm.aiForm || !(_vm.aiSecrets && _vm.aiSecrets.length) } }, [_vm.aiForm ? _c("div", { staticClass: "pw-ai-main" }, [_vm.aiForm ? _c("k-form", { key: "ai-" + _vm.discardKey, attrs: { "fields": _vm.aiForm.fields, "value": _vm.aiValues }, on: { "input": _vm.onAiInput } }) : _vm._e()], 1) : _vm._e(), _vm.aiSecrets && _vm.aiSecrets.length ? _c("aside", { staticClass: "pw-ai-aside" }, [_vm.aiSecrets && _vm.aiSecrets.length ? _c("section", { staticClass: "pw-ai-secrets" }, [_c("h2", { staticClass: "k-label pw-ai-secrets-title" }, [_vm._v(_vm._s(_vm.$t("prw.ai.keys")))]), _c("p", { staticClass: "pw-ai-secrets-help" }, [_vm._v(_vm._s(_vm.$t("prw.ai.keys.help")))]), !_vm.aiSecretsWritable ? _c("k-box", { attrs: { "theme": "negative", "text": _vm.$t("prw.ai.keys.readonly") } }) : _vm._e(), _vm._l(_vm.aiSecrets, function(secret) {
      return _c("div", { key: secret.env, staticClass: "pw-ai-secret" }, [_c("label", { staticClass: "k-label", attrs: { "for": "pw-secret-" + secret.env } }, [_vm._v(_vm._s(secret.label))]), _c("div", { staticClass: "pw-ai-secret-row" }, [_c("input", { staticClass: "pw-ai-secret-input", attrs: { "id": "pw-secret-" + secret.env, "type": "password", "autocomplete": "new-password", "disabled": !_vm.aiSecretsWritable || secret.source === "config", "placeholder": secret.masked ? secret.masked : _vm.$t("prw.ai.keys.empty") }, domProps: { "value": _vm.aiSecretInputs[secret.env] || "" }, on: { "input": function($event) {
        return _vm.onSecretInput(secret.env, $event.target.value);
      } } }), secret.source === "env" && _vm.aiSecretsWritable ? _c("k-button", { attrs: { "icon": "trash", "size": "sm", "variant": "filled", "title": _vm.$t("prw.ai.keys.remove") }, on: { "click": function($event) {
        return _vm.removeSecret(secret);
      } } }) : _vm._e()], 1), _c("p", { staticClass: "pw-ai-secret-status" }, [secret.source === "config" ? [_vm._v(_vm._s(_vm.$t("prw.ai.keys.config")))] : secret.source === "env" ? [_vm._v(_vm._s(_vm.$t("prw.ai.keys.set")))] : [_vm._v(_vm._s(_vm.$t("prw.ai.keys.notset")))], secret.help ? [_vm._v(" · " + _vm._s(secret.help))] : _vm._e()], 2)]);
    })], 2) : _vm._e()]) : _vm._e()]) : _vm._e()]) : _vm._e(), _vm._l(_vm.blocks, function(block) {
      return _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === block.blockType, expression: "activeTab === block.blockType" }], key: block.blockType, staticClass: "pw-wizard-panel" }, [["pwtext", "pwsteplist"].includes(block.blockType) && _vm.blockConfigs[block.blockType] ? _c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === block.blockType, expression: "activeTab === block.blockType" }] }, [_c("pw-block-preview", { attrs: { "block-type": block.blockType, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "element-defaults": _vm.elementDefaults, "element-overrides": _vm.elementOverrides, "global-defaults": _vm.globalDefaults, "global-overrides": _vm.globalOverrides, "font-defaults": _vm.fontDefaults, "font-overrides": _vm.fontOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "body-background": _vm.bodyBackgroundColor, "themes": _vm.themes, "guides": _vm.previewGuides, "bp": _vm.itemBp, "value-defaults": _vm.blockValueDefaults[block.blockType] || {}, "value-overrides": _vm.blockValueOverrides[block.blockType] || {}, "step-style": block.blockType === "pwsteplist" ? _vm.currentStepStyle(block.blockType) : "", "variant": _vm.currentItemColorTheme }, on: { "update:guides": function($event) {
        _vm.previewGuides = $event;
      }, "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:variant": function($event) {
        _vm.itemColorTheme = $event;
      } } })], 1)]) : _vm._e(), _vm.blockConfigs[block.blockType] ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.currentBlockView === "defaults", expression: "currentBlockView === 'defaults'" }] }, [_c("pw-block-settings", { attrs: { "view": "defaults", "variants": _vm.activeVariants, "global-values": _vm.globalLayoutValues, "guides": _vm.previewGuides, "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.hasItemFields(block.blockType) && _vm.hasItemDefaultFields(block.blockType) ? [_c("h2", { staticClass: "pw-group-title" }, [_vm._v(_vm._s(_vm.$t("prw.tab.items")))]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-defaults", "item-radius": _vm.itemRadiusValues(block.blockType), "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1)])] : _vm._e()], 2) : _vm._e(), _vm.blockConfigs[block.blockType] ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.currentBlockView === "presets", expression: "currentBlockView === 'presets'" }] }, [_c("pw-block-settings", { attrs: { "view": "presets", "variants": _vm.activeVariants, "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1) : _vm._e(), _vm.blockConfigs[block.blockType] && _vm.hasDesign(block.blockType) ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.currentBlockView === "design", expression: "currentBlockView === 'design'" }] }, [block.blockType === "pwsteplist" && _vm.blockValueDefaults[block.blockType] ? _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.numbering")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.stepStyleOptions(block.blockType), function(st) {
        return _c("button", { key: "st-" + st, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentStepStyle(block.blockType) === st ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$set(_vm.stepPreviewStyle, block.blockType, st);
        } } }, [_vm._v(_vm._s(_vm.$t("kirbyblock-steplist.item-style." + st)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [_vm.stepValueKey(block.blockType, "item-number-size")], "labels": { [_vm.stepValueKey(block.blockType, "item-number-size")]: _vm.$t(_vm.currentStepStyle(block.blockType) === "minimal" ? "prw.prop.font-size" : "prw.label.size") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }), _vm.currentStepStyle(block.blockType) !== "minimal" ? [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shape"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemRadiusVisible(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }) : _vm._e()] : _vm._e(), _vm.currentStepStyle(block.blockType) !== "centered" ? _c("pw-block-settings", { key: "align-" + _vm.currentStepStyle(block.blockType), attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": [_vm.stepValueKey(block.blockType, "item-number-align")] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.currentStepStyle(block.blockType) !== "centered" && _vm.stepAlign(block.blockType) === "top" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [_vm.stepValueKey(block.blockType, "item-number-offset")], "labels": { [_vm.stepValueKey(block.blockType, "item-number-offset")]: _vm.$t("prw.label.offset") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }) : _vm._e(), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [_vm.stepValueKey(block.blockType, "item-content-gap")], "labels": { [_vm.stepValueKey(block.blockType, "item-content-gap")]: _vm.$t(_vm.currentStepStyle(block.blockType) === "centered" ? "prw.label.gapVertical" : "prw.label.gapHorizontal") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }), _vm.currentStepStyle(block.blockType) === "connected" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-connector-width"], "labels": { "item-connector-width": _vm.$t("prw.prop.item-connector") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }) : _vm._e()], 2)]) : _vm._e(), _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t(block.blockType === "pwsteplist" ? "prw.headline.spacing" : "prw.subtab.layout")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-padding"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }), _vm.isItemShapeVisible(block.blockType) && block.blockType !== "pwsteplist" ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shape"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.isItemRadiusVisible(block.blockType) && block.blockType !== "pwsteplist" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }) : _vm._e(), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": block.blockType === "pwsteplist" ? ["item-gap"] : ["item-number-size", "item-gap", "item-content-gap", "item-connector-width"], "labels": block.blockType === "pwsteplist" ? { "item-gap": _vm.$t("prw.label.betweenSteps") } : {}, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-size"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }), _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-icon-position", "item-icon-style", "item-title-style"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-size", "item-icon-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }), _vm.itemLayoutDefault(block.blockType, "item-icon-style") === "tile" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-tile-padding", "item-icon-tile-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }) : _vm._e(), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-title-size", "item-title-line-height", "item-title-gap", "item-text-size"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }), _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-border"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemBorderEnabled(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-border-width"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } }) : _vm._e(), _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-link-style"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemLinkStyleButton(block.blockType) ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-button-style"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), !_vm.isItemLinkStyleButton(block.blockType) ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-link-decoration", "item-link-icon"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e()], 1)])] : _vm._e(), _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "th-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": _vm.itemColorsShowOnly(block.blockType), "labels": block.blockType === "pwsteplist" ? _vm.stepColorLabels(block.blockType) : {}, "theme": _vm.currentItemColorTheme, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      } } })], 1)])] : _vm._e()], 2) : _vm._e()], 1);
    })], 2), _c("aside", { staticClass: "pw-preview-column" }, [!_vm.showPreview ? _c("k-button", { staticClass: "pw-preview-open", attrs: { "icon": "preview", "title": _vm.$t("expand") }, on: { "click": _vm.togglePreview } }) : _vm._e()], 1), _c("k-button", { staticClass: "pw-preview-toggle", attrs: { "icon": _vm.showPreview ? "angle-right" : "angle-left", "title": _vm.showPreview ? _vm.$t("collapse") : _vm.$t("expand"), "size": "xs" }, on: { "click": _vm.togglePreview } })], 1)], 1);
  };
  var _sfc_staticRenderFns$d = [];
  _sfc_render$d._withStripped = true;
  var __component__$d = /* @__PURE__ */ normalizeComponent(
    _sfc_main$d,
    _sfc_render$d,
    _sfc_staticRenderFns$d
  );
  __component__$d.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/Overview.vue";
  const Overview = __component__$d.exports;
  const _sfc_main$c = {
    props: {
      uid: String,
      label: String,
      allOptions: Array,
      activeOptions: Array,
      currentDefault: String,
      pluginDefault: String,
      enabled: { type: Boolean, default: true },
      modified: { type: Boolean, default: false },
      required: { type: Boolean, default: false },
      // the block's plugin (kirbyblock-steplist): its own option labels
      plugin: { type: String, default: "" }
    },
    data() {
      return {
        localActive: [...this.activeOptions || []],
        localDefault: null
      };
    },
    computed: {
      options() {
        return (this.allOptions || []).filter((o) => o !== "|");
      },
      allowedOptions() {
        return this.options.filter((o) => this.localActive.includes(o));
      },
      // start value shown: the chosen one, else the current/plugin default
      defaultValue() {
        const value = this.localDefault ?? this.currentDefault ?? this.pluginDefault;
        return this.allowedOptions.includes(value) ? value : this.allowedOptions[0];
      }
    },
    watch: {
      modified(val) {
        if (!val) {
          this.localDefault = null;
          this.localActive = [...this.activeOptions || []];
        }
      },
      activeOptions(newVal) {
        this.localActive = [...newVal || []];
      },
      currentDefault() {
        this.localDefault = null;
      }
    },
    methods: {
      propertyLabel(key) {
        const tKey = "prw.property." + key;
        const translated = this.$t(tKey);
        return translated && translated !== tKey ? translated : key;
      },
      optionLabel(opt) {
        if (this.plugin) {
          const ownKey = this.plugin + "." + this.label + "." + opt;
          const own = this.$t(ownKey);
          if (own && own !== ownKey) return own;
        }
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
      setDefault(opt) {
        this.localDefault = opt;
        this.$emit("update:default", opt);
      }
    }
  };
  var _sfc_render$c = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row", class: { "is-disabled": !_vm.enabled, "is-modified": _vm.modified } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.propertyLabel(_vm.label))), _vm.required ? _c("span", { staticClass: "pw-field-required" }, [_vm._v("*")]) : _vm._e()])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.defaultValue, "options": _vm.allowedOptions.map((o) => ({ value: o, text: _vm.optionLabel(o) })), "grow": false, "required": true }, on: { "input": _vm.setDefault } })], 1)])])]);
  };
  var _sfc_staticRenderFns$c = [];
  _sfc_render$c._withStripped = true;
  var __component__$c = /* @__PURE__ */ normalizeComponent(
    _sfc_main$c,
    _sfc_render$c,
    _sfc_staticRenderFns$c
  );
  __component__$c.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/FieldRow.vue";
  const FieldRow = __component__$c.exports;
  const _sfc_main$b = {
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
  var _sfc_render$b = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-color-field", class: { "is-default": !_vm.overrideValue } }, [_c("k-colorname-input", { staticClass: "pw-color-value", attrs: { "value": _vm.displayValue, "alpha": true, "format": "hex" }, on: { "input": _vm.onInput } }), _c("button", { staticClass: "pw-color-swatch", attrs: { "type": "button", "title": _vm.displayValue }, on: { "click": function($event) {
      return _vm.$refs.picker.toggle();
    } } }, [_c("k-color-frame", { attrs: { "color": _vm.displayValue, "ratio": "1/1" } })], 1), _c("k-dropdown-content", { ref: "picker", staticClass: "k-color-field-picker", attrs: { "align-x": "start" } }, [_c("k-colorpicker-input", { attrs: { "value": _vm.displayValue, "alpha": true, "format": "hex" }, on: { "input": _vm.onInput }, nativeOn: { "click": function($event) {
      $event.stopPropagation();
    } } })], 1)], 1);
  };
  var _sfc_staticRenderFns$b = [];
  _sfc_render$b._withStripped = true;
  var __component__$b = /* @__PURE__ */ normalizeComponent(
    _sfc_main$b,
    _sfc_render$b,
    _sfc_staticRenderFns$b
  );
  __component__$b.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/ColorFieldRow.vue";
  const ColorFieldRow = __component__$b.exports;
  const _sfc_main$a = {
    props: {
      blocks: {
        type: Array,
        default: () => []
      }
    },
    computed: {
      groups() {
        return [
          {
            key: "pagewizard",
            label: this.$t("prw.headline.pagewizard") || "Pagewizard",
            blocks: this.blocks.filter((b) => (b.blockType || "").startsWith("pw"))
          },
          {
            key: "projectRelated",
            label: this.$t("prw.headline.projectRelated") || "Project Related",
            blocks: this.blocks.filter((b) => !(b.blockType || "").startsWith("pw"))
          }
        ];
      }
    },
    methods: {
      blockLabel(blockType) {
        const block = this.blocks.find((b) => b.blockType === blockType);
        if (block && block.name) return block.name;
        if (block) {
          const translated = this.$t(block.plugin + ".name");
          if (translated && translated !== block.plugin + ".name") return translated;
        }
        const name = blockType.replace(/^pw/, "").replace(/([A-Z])/g, " $1").trim() || blockType;
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
  };
  var _sfc_render$a = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", [_vm._l(_vm.groups, function(group) {
      return [group.blocks.length ? _c("section", { key: group.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(group.label))])]), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(group.blocks, function(block) {
        return _c("div", { key: block.blockType, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.blockLabel(block.blockType)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": block.active ? "true" : "false", "options": [{ value: "true", text: _vm.$t("pw.option.enabled") || "Enabled" }, { value: "false", text: _vm.$t("pw.option.disabled") || "Disabled" }], "grow": false, "required": true }, on: { "input": function($event) {
          return _vm.$emit("toggle", { blockType: block.blockType, checked: $event === "true" });
        } } })], 1)])])]);
      }), 0)]) : _vm._e()];
    })], 2);
  };
  var _sfc_staticRenderFns$a = [];
  _sfc_render$a._withStripped = true;
  var __component__$a = /* @__PURE__ */ normalizeComponent(
    _sfc_main$a,
    _sfc_render$a,
    _sfc_staticRenderFns$a
  );
  __component__$a.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalElements.vue";
  const GlobalElements = __component__$a.exports;
  const _sfc_main$9 = {
    props: {
      block: {
        type: Object,
        required: true
      },
      // the project's variants switched on (variant, variant2 …); null: all
      variants: {
        type: Array,
        default: null
      },
      config: {
        type: Object,
        required: true
      },
      overrides: {
        type: Object,
        default: () => ({})
      },
      // global layout values (margins, paddings) shown next to the switches
      // that use them
      globalValues: {
        type: Object,
        default: () => ({})
      },
      // the items' corner radii (top-left, top-right, bottom-left, bottom-right)
      // shown next to the item radius switches
      itemRadius: {
        type: Array,
        default: () => []
      },
      // preview guides on: the rows they belong to get a stripe in their colour
      guides: {
        type: Boolean,
        default: false
      },
      writerActive: {
        type: Boolean,
        default: true
      },
      view: {
        type: String,
        default: "defaults",
        validator: (v) => ["defaults", "items", "items-defaults", "items-layout", "layout"].includes(v)
      },
      layoutKeys: {
        type: Array,
        default: null
      }
    },
    data() {
      return {
        // chosen tab of the drawer header (null: the first with rows)
        drawerTab: null
      };
    },
    computed: {
      // the block's drawer tabs, as in the block's drawer (content always);
      // tabs without rows in this view are disabled
      drawerTabs() {
        const tabs = this.getDefault("settings.tabs") || {};
        return ["content", "layout", "style", "effects", "grid", "settings"].filter((key) => key === "content" || tabs[key] !== void 0 && tabs[key] !== false).map((key) => ({ name: key, label: this.drawerLabel(key), disabled: !this.drawerTabHasRows(key) }));
      },
      // the chosen drawer tab, else the first one with rows
      currentDrawerTab() {
        const usable = this.drawerTabs.filter((t) => !t.disabled).map((t) => t.name);
        return usable.includes(this.drawerTab) ? this.drawerTab : usable[0] || "content";
      },
      // blocks are square: all four global corner radii are 0
      blocksSquare() {
        const radii = (this.globalValues || {})["global-"];
        return Array.isArray(radii) && radii.length > 0 && radii.every((r) => parseFloat(r) === 0);
      },
      blockType() {
        return this.block.blockType;
      }
    },
    methods: {
      // --- Content fields ---
      getContentFields() {
        return this.collectContentFields({ items: false });
      },
      getItemDefaultsContentFields() {
        return this.collectContentFields({ items: true });
      },
      collectContentFields({ items }) {
        const settings = this.getDefault("settings.fields.content") || {};
        const fields = [];
        for (const [key, settingVal] of Object.entries(settings)) {
          if (key === "editor" || key === "column-blocks" || key === "blocks") continue;
          const isItemKey = key.startsWith("item-");
          if (items && !isItemKey) continue;
          if (!items && isItemKey) continue;
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
      getItemRadiusFields() {
        const settings = this.getDefault("settings.fields.layout") || {};
        const fields = [];
        let radiusGroup = null;
        for (const [key, settingVal] of Object.entries(settings)) {
          if (!key.startsWith("item-radius-")) continue;
          if (settingVal === false || settingVal === "enabled") continue;
          if (!radiusGroup) {
            radiusGroup = { key: "item-radius", displayKey: "radius", type: "toggle-group", subFields: [] };
            fields.push(radiusGroup);
          }
          const defaultValue = this.isObject(settingVal) && "default" in settingVal ? settingVal.default : false;
          radiusGroup.subFields.push({
            key,
            label: key.replace(/^item-radius-/, ""),
            defaultValue
          });
        }
        return fields;
      },
      getItemLayoutSettings() {
        const settings = this.getDefault("settings.fields.layout") || {};
        const fields = [];
        const filter = Array.isArray(this.layoutKeys) ? this.layoutKeys : null;
        for (const [key, settingVal] of Object.entries(settings)) {
          if (!key.startsWith("item-")) continue;
          if (key === "item-radius" || key.startsWith("item-radius-")) continue;
          if (settingVal === false || settingVal === "enabled") continue;
          if (filter && !filter.includes(key)) continue;
          const displayKey = key.replace(/^item-/, "");
          if (this.isObject(settingVal) && settingVal.type === "icon-select" && Array.isArray(settingVal.options)) {
            fields.push({
              key,
              displayKey,
              type: "icon-select",
              options: settingVal.options,
              defaultValue: settingVal.default !== void 0 ? settingVal.default : settingVal.options[0] && settingVal.options[0].value
            });
            continue;
          }
          if (this.isObject(settingVal) && Array.isArray(settingVal.options)) {
            fields.push({
              key,
              displayKey,
              // Optional own label key (block-specific wording, e.g. featurelist's tile shape)
              label: settingVal.label || null,
              type: "select",
              options: settingVal.options,
              defaultValue: settingVal.default !== void 0 ? settingVal.default : settingVal.options[0]
            });
            continue;
          }
          let defaultValue = false;
          if (this.isObject(settingVal) && "default" in settingVal) {
            defaultValue = settingVal.default;
          }
          fields.push({ key, displayKey, type: "toggle", defaultValue });
        }
        return fields;
      },
      getItemFields() {
        return this.getItemFieldsRaw();
      },
      getItemFieldsRaw() {
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
      // Editor field for the visibility eye (a stand-in when the block has
      // only editor.json rows)
      // items-defaults / items-layout sit in a shared card: without rows of
      // their own they render nothing
      hasRows() {
        if (this.view === "items-defaults") return this.getItemRadiusFields().length > 0;
        if (this.view === "items-layout") return this.getItemLayoutSettings().length > 0;
        return true;
      },
      // content fields with preset rows (presets view only)
      // (start values: which option a new block starts with; restrictions:
      // which options are allowed)
      presetFields(fields) {
        return this.view === "presets" || this.view === "defaults" ? fields.filter((f) => f.properties.length) : [];
      },
      // the editor card sits in the presets: mode/align/size, then (writer)
      // formatting and lists
      hasEditorCard() {
        if (this.view === "defaults") return !!(this.getEditorField() && this.getEditorField().properties.length);
        if (this.view !== "presets") return false;
        return !!(this.getEditorField() && this.getEditorField().properties.length) || this.writerActive !== false && this.getEditorConfigRows().length > 0;
      },
      // category rows of this view: pills + preset and the whole grid (sizes
      // and offsets, allowed on every block) in "presets", the rest in "defaults"
      viewFields(cat) {
        if (this.view === "layout") return cat.fields;
        let fields = this.view === "presets" ? [] : cat.fields;
        if (this.view === "defaults" && cat.key === "layout" && this.blockType === "pwsteplist" && this.getVal("settings.fields.style.item-style.default", "default") === "connected") {
          fields = fields.filter((f) => !f.key.startsWith("columns-"));
        }
        return fields;
      },
      // the cards of a category, as the drawer tab groups them: layout has
      // paddings and corners (the corners only while the blocks are round);
      // a card's heading is left out when it just repeats the drawer tab
      catSections(cat) {
        const fields = this.viewFields(cat);
        if (this.view === "defaults" && cat.key === "layout") {
          const radius = fields.find((f) => f.key === "radius");
          const paddings = fields.filter((f) => f.key !== "radius");
          const sections = [];
          if (paddings.length) sections.push({ key: "paddings", heading: this.$t("prw.headline.spacing"), fields: paddings });
          if (radius && !this.blocksSquare) sections.push({ key: "radius", heading: this.$t("prw.prop.border-radius"), fields: [radius] });
          return sections;
        }
        if (!fields.length) return [];
        if (this.view === "defaults" && cat.key === "style" && fields.length > 1) {
          return fields.map((f) => ({ key: f.key, heading: this.styleSectionHeading(f.key), fields: [f] }));
        }
        const heading = this.categoryHeading(cat.key);
        const repeats = this.view !== "layout" && heading === this.drawerLabel(cat.key);
        return [{ key: "main", heading: repeats ? null : heading, fields }];
      },
      // heading of a style card: the variant, else the field's own label
      styleSectionHeading(key) {
        if (key === "theme") return this.$t("prw.headline.variant");
        const tKey = "prw.property." + key;
        const t = this.$t(tKey);
        return t && t !== tKey ? t : key;
      },
      // name of a drawer tab (as in the block's drawer)
      drawerLabel(key) {
        return this.$t("pw.tab." + key);
      },
      // options of an option row; the variant only with the project's variants,
      // and "custom" (own colours) never as a start value
      fieldOptions(field) {
        if (field.key !== "theme") return field.allOptions;
        return field.allOptions.filter((o) => {
          if (o === "custom") return this.view !== "defaults";
          return o === "default" || !Array.isArray(this.variants) || this.variants.includes(o);
        });
      },
      // the fields of a drawer tab for the restrictions: content (the block's
      // fields, then its items'), else the tab's settings keys (the four
      // corners together, as in the drawer); each row: its keys and label
      restrictionGroups(tab) {
        const all = this.getDefault("settings.fields." + tab) || {};
        if (tab === "content") {
          const isField = (v) => v === "enabled" || v === true || this.isObject(v) && Object.values(v).some((p) => this.isObject(p) && ("options" in p || "default" in p));
          const keys2 = Object.keys(all).filter((k) => isField(all[k]));
          const row = (k) => ({ id: k, keys: [k], label: this.fieldLabel(k) });
          const groups = [];
          const own = keys2.filter((k) => !k.startsWith("item-")).map(row);
          const items = keys2.filter((k) => k.startsWith("item-")).map(row);
          if (own.length) groups.push({ key: "block", heading: null, rows: own });
          if (items.length) groups.push({ key: "items", heading: this.$t("prw.tab.items"), rows: items });
          return groups;
        }
        const keys = Object.keys(all).filter((k) => !(tab === "layout" && k.startsWith("item-")) && this.isObject(all[k]) && "default" in all[k]);
        const together = [
          { prefix: "padding-", label: this.$t("prw.headline.paddings") },
          { prefix: "radius-", label: this.categoryFieldLabel("radius") },
          { prefix: "columns-", label: this.$t("pw.headline.columns") },
          { prefix: "grid-", label: this.$t("prw.label.gridLayout") },
          { prefix: "margin-", label: this.$t("prw.headline.margins") }
        ];
        const rows = [];
        for (const k of keys) {
          const group = together.find((g) => k.startsWith(g.prefix));
          if (!group) {
            const pKey = "prw.property." + k;
            const pLabel = this.$t(pKey);
            rows.push({ id: k, keys: [k], label: pLabel && pLabel !== pKey ? pLabel : this.categoryFieldLabel(k) });
          } else if (!rows.some((r) => r.id === group.prefix)) {
            rows.push({ id: group.prefix, keys: keys.filter((x) => x.startsWith(group.prefix)), label: group.label });
          }
        }
        return rows.length ? [{ key: tab, heading: null, rows }] : [];
      },
      // all drawer tabs one below the other, each a card headed by its name
      allRestrictionGroups() {
        const groups = [];
        for (const tab of this.drawerTabs) {
          for (const group of this.restrictionGroups(tab.name)) {
            groups.push({ ...group, key: tab.name + "-" + group.key, heading: group.heading || tab.label });
          }
        }
        return groups;
      },
      // fields hidden from the editors (setting keys)
      hiddenKeys() {
        const list = this.getOverrideOnly("settings.hidden");
        return Array.isArray(list) ? list : [];
      },
      isHidden(keys) {
        const hidden = this.hiddenKeys();
        return keys.every((k) => hidden.includes(k));
      },
      // eye clicked: hide the row's fields from the editors or show them again
      toggleHidden(keys) {
        const hidden = this.hiddenKeys().filter((k) => !keys.includes(k));
        if (!this.isHidden(keys)) hidden.push(...keys);
        if (hidden.length) {
          this.setNested(this.overrides, "settings.hidden", hidden);
        } else {
          this.deleteNested(this.overrides || {}, "settings.hidden");
          this.cleanEmpty(this.overrides || {}, "settings");
        }
        this.markDirty();
      },
      // start values of the content: the block's fields and (blocks with items)
      // the items' fields, each a row with the drawer's dropdowns
      contentToolbarGroups() {
        const groups = [];
        const own = [...this.presetFields(this.getContentFields())];
        const editor = this.getEditorField();
        if (editor && editor.properties.length) own.push(editor);
        const ownRows = own.map((f) => this.contentToolbarRow(f)).filter((r) => r.items.length);
        if (ownRows.length) groups.push({ key: "block", heading: null, rows: ownRows });
        const itemRows = this.presetFields(this.getItemDefaultsContentFields()).map((f) => this.contentToolbarRow(f)).filter((r) => r.items.length);
        if (itemRows.length) groups.push({ key: "items", heading: this.$t("prw.tab.items"), rows: itemRows });
        return groups;
      },
      // a content field's dropdowns (as in the drawer: flourish … level, then
      // the editor mode), each with the allowed options and the start value
      contentToolbarRow(field) {
        const order = ["flourish", "multiline", "textbackground", "align", "sizes", "level", "mode"];
        const items = field.properties.filter((p) => order.includes(p.key)).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)).map((p) => {
          const options = this.getActiveOptions(field.key, p.key, p);
          const value = this.getVal("settings.fields.content." + field.key + "." + p.key + ".default", p.pluginDefault);
          return {
            key: p.key === "sizes" ? "size" : p.key,
            prop: p,
            value: options.includes(value) ? value : options[0],
            options
          };
        });
        return { key: field.key, items };
      },
      setContentPreset(row, { key, value }) {
        const item = row.items.find((i) => i.key === key);
        if (!item) return;
        this.selectOption("settings.fields.content." + row.key + "." + item.prop.key + ".default", value, item.prop.pluginDefault);
      },
      // a drawer tab has rows in this view
      drawerTabHasRows(key) {
        if (this.view === "presets") return this.restrictionGroups(key).length > 0;
        if (key === "content") {
          return this.presetFields(this.getContentFields()).length > 0 || this.hasEditorCard() || this.presetFields(this.getItemDefaultsContentFields()).length > 0;
        }
        const cat = this.getCategories().find((c) => c.key === key);
        return !!cat && this.catSections(cat).length > 0;
      },
      editorField() {
        return this.getEditorField() || { key: "editor", enabled: true };
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
          if (key === "headings") continue;
          if (Array.isArray(val) && val.length > 0) {
            rows.push({ key, type: "array", values: val });
          }
        }
        return rows;
      },
      // --- Column blocks ---
      // --- Editor options ---
      setEditorContentOptions(propKey, prop, values) {
        this.setActiveOptions("editor", propKey, prop, values);
        if (propKey === "mode") {
          this.$emit("update:writer-active", values.includes("writer"));
        }
      },
      // --- Active options ---
      // the options of a content field's property: always all of them (only
      // whole fields are switched off)
      getActiveOptions(fieldKey, propKey, prop) {
        return prop.allOptions;
      },
      setActiveOptions(fieldKey, propKey, prop, values) {
        const basePath = "settings.fields.content." + fieldKey + "." + propKey;
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
          if (this.view === "layout" && catKey !== "layout") continue;
          const settingsFields = this.getDefault("settings.fields." + catKey) || {};
          if (Object.keys(settingsFields).length === 0) continue;
          const fields = [];
          const grouped = {};
          for (const [key, val] of Object.entries(settingsFields)) {
            if (this.view === "layout" && catKey === "layout" && !key.startsWith("item-")) continue;
            if (this.view === "layout" && catKey === "layout" && (key === "item-radius" || key.startsWith("item-radius-"))) continue;
            if ((this.view === "defaults" || this.view === "presets") && catKey === "layout" && key.startsWith("item-")) continue;
            const lookupKey = this.view === "layout" && key.startsWith("item-") ? key.slice(5) : key;
            if (lookupKey === "padding" || lookupKey === "radius") continue;
            if (val === "enabled") continue;
            if (lookupKey.startsWith("radius-")) {
              if (!grouped["radius"]) {
                grouped["radius"] = { key: "radius", type: "toggle-group", subFields: [] };
              }
              const subLabel = lookupKey.replace("radius-", "");
              const defaultValue = this.isObject(val) && "default" in val ? val.default : false;
              grouped["radius"].subFields.push({ key, label: subLabel, defaultValue });
              continue;
            }
            if (lookupKey === "padding-top" || lookupKey === "padding-bottom") {
              const defaultValue = this.isObject(val) && "default" in val ? val.default : "large";
              fields.push({
                key,
                type: "toggles",
                defaultValue,
                options: [
                  { value: "small", text: this.$t("pw.option.small") },
                  { value: "large", text: this.$t("pw.option.large") }
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
        return field.enabled !== false;
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
        const own = this.$t("prw.contentfield." + key);
        if (own && own !== "prw.contentfield." + key) return own;
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
      // radius a corner switch applies: its value from the four corner values
      // (top-left, top-right, bottom-left, bottom-right); off → 0rem
      cornerHint(corner, on, values) {
        if (!on) return "0rem";
        const idx = ["top-left", "top-right", "bottom-left", "bottom-right"].indexOf(corner);
        return Array.isArray(values) && values[idx] || "";
      },
      // the four corner switches (radius): a 2×2 grid like the corner values
      isCornerGroup(field) {
        return (field.subFields || []).length === 4 && field.subFields.some((sub) => sub.label === "top-left");
      },
      cornerOrder(subFields) {
        const order = ["top-left", "top-right", "bottom-left", "bottom-right"];
        if (!subFields.every((sub) => order.includes(sub.label))) return subFields;
        return [...subFields].sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
      },
      // card heading of a category: the layout card holds the paddings, the
      // settings card the block's layout (size, outer spacing)
      categoryHeading(key) {
        if (key === "layout") return this.$t("prw.headline.paddings");
        if (key === "settings") return this.$t("prw.headline.blockLayout");
        return this.$t("pw.headline." + key);
      },
      // guide colour of a row while the preview guides are on and the row's
      // switch is on: outer spacing (cyan lines) or paddings (magenta line)
      guideType(key, value) {
        if (!this.guides || !value) return null;
        if (key === "margin-top" || key === "margin-bottom") return "margin";
        if (["padding-top", "padding-bottom", "padding-left", "padding-right"].includes(key)) return "padding";
        return null;
      },
      // the value a switch applies (e.g. padding-left → 4.5rem, padding-top
      // "large" → the large step); switched off → 0rem
      globalHint(key, value) {
        const g = this.globalValues || {};
        const single = {
          "padding-left": "global-padding-left",
          "padding-right": "global-padding-right",
          "margin-top": "global-margin-top",
          "margin-bottom": "global-margin-bottom"
        };
        if (single[key]) return value ? g[single[key]] || "" : "0rem";
        if (key === "padding-top" || key === "padding-bottom") {
          if (value !== "small" && value !== "large") return "0rem";
          const pair = g["global-" + key];
          return Array.isArray(pair) ? pair[value === "large" ? 1 : 0] || "" : "";
        }
        return "";
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
  var _sfc_render$9 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _vm.hasRows() ? _c("div", { staticClass: "pw-wizard-block-sections" }, [_vm.view === "defaults" || _vm.view === "presets" || _vm.view === "layout" ? _c("div", { staticClass: "pw-wizard-tab-content" }, [_vm.view === "defaults" ? _c("header", { staticClass: "k-drawer-header pw-drawer-strip" }, [_c("k-drawer-tabs", { attrs: { "tab": _vm.currentDrawerTab, "tabs": _vm.drawerTabs }, on: { "open": function($event) {
      _vm.drawerTab = $event;
    } } })], 1) : _vm._e(), _vm.view === "defaults" && _vm.currentDrawerTab === "content" ? _vm._l(_vm.contentToolbarGroups(), function(group) {
      return _c("section", { key: "ct-" + group.key, staticClass: "pw-card-section" }, [group.heading ? _c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(group.heading))])]) : _vm._e(), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(group.rows, function(row) {
        return _c("div", { key: row.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.fieldLabel(row.key)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("pw-field-toolbar", { attrs: { "items": row.items }, on: { "input": function($event) {
          return _vm.setContentPreset(row, $event);
        } } })], 1)])])]);
      }), 0)]);
    }) : _vm._e(), _vm.view === "presets" ? _vm._l(_vm.allRestrictionGroups(), function(group) {
      return _c("section", { key: "rg-" + group.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(group.heading))])]), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(group.rows, function(row) {
        return _c("div", { key: row.id, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(row.label))]), _vm.isHidden(row.keys) ? _c("k-icon", { staticClass: "pw-field-state-eye", attrs: { "type": "hidden" } }) : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggle-input", { attrs: { "value": !_vm.isHidden(row.keys), "text": _vm.$t(_vm.isHidden(row.keys) ? "prw.field.hidden" : "prw.field.visible") }, on: { "input": function($event) {
          return _vm.toggleHidden(row.keys);
        } } })], 1)])])]);
      }), 0)]);
    }) : _vm._e(), _vm._l(_vm.getCategories(), function(cat) {
      return _vm._l(_vm.view === "layout" || cat.key === _vm.currentDrawerTab ? _vm.catSections(cat) : [], function(sec) {
        return _c("section", { key: "card-" + cat.key + "-" + sec.key, staticClass: "pw-card-section" }, [sec.heading ? _c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(sec.heading))])]) : _vm._e(), _c("div", { staticClass: "pw-card pw-field-table" }, [_vm._l(sec.fields, function(field) {
          return [field.type === "fieldrow" ? _c("pw-field-row", { key: field.key, attrs: { "uid": _vm.blockType + "-" + cat.key + "-" + field.key, "label": field.key, "all-options": _vm.fieldOptions(field), "active-options": cat.key === "grid" ? _vm.fieldOptions(field) : _vm.getCategoryActiveOptions(cat.key, field.key, field).filter((o) => _vm.fieldOptions(field).includes(o)), "current-default": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.pluginDefault), "plugin-default": field.pluginDefault, "enabled": true, "modified": _vm.hasOverride("settings.fields." + cat.key + "." + field.key), "required": field.required === true, "plugin": _vm.block.plugin || "" }, on: { "update:options": function($event) {
            return _vm.setCategoryOptions(cat.key, field.key, field, $event);
          }, "update:default": function($event) {
            return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event, field.pluginDefault);
          } } }) : _vm._e(), field.type === "toggles" ? _c("div", { key: field.key, staticClass: "pw-field-row", attrs: { "data-guide": _vm.guideType(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key))), field.required ? _c("span", { staticClass: "pw-field-required" }, [_vm._v("*")]) : _vm._e()])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue), "options": field.options, "grow": false, "reset": field.reset !== false, "required": field.required === true }, on: { "input": function($event) {
            return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event, field.defaultValue);
          } } }), _vm.globalHint(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) ? _c("span", { staticClass: "pw-field-hint", class: { "is-zero": _vm.globalHint(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) === "0rem" } }, [_vm._v(_vm._s(_vm.globalHint(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue))))]) : _vm._e()], 1)])])]) : field.type === "toggle-group" ? _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key)))])]), _c("div", { staticClass: "pw-field-row-options pw-toggle-group", class: { "pw-corner-grid": _vm.isCornerGroup(field) } }, _vm._l(_vm.cornerOrder(field.subFields), function(sub) {
            return _c("span", { key: sub.key, staticClass: "pw-corner-cell" }, [_c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default", sub.defaultValue), "text": _vm.toggleOptionLabel(sub.label) }, on: { "input": function($event) {
              _vm.setVal("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default", $event);
            } } }), _vm.isCornerGroup(field) ? _c("span", { staticClass: "pw-field-hint", class: { "is-zero": !_vm.getVal("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default", sub.defaultValue) } }, [_vm._v(_vm._s(_vm.cornerHint(sub.label, _vm.getVal("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default", sub.defaultValue), _vm.globalValues["global-"])))]) : _vm._e()], 1);
          }), 0)])])]) : field.type === "single" ? _c("div", { key: field.key, staticClass: "pw-field-row", attrs: { "data-guide": _vm.guideType(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key)))])]), _c("div", { staticClass: "pw-field-row-options" }, [field.defaultValue !== null && typeof field.defaultValue === "boolean" ? _c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue), "text": [_vm.$t("pw.option.disabled"), _vm.$t("pw.option.enabled")] }, on: { "input": function($event) {
            return _vm.setVal("settings.fields." + cat.key + "." + field.key + ".default", $event);
          } } }) : _vm._e(), field.defaultValue !== null && typeof field.defaultValue === "boolean" && _vm.globalHint(field.key, true) ? _c("span", { staticClass: "pw-field-hint", class: { "is-zero": !_vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue) } }, [_vm._v(_vm._s(_vm.globalHint(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue))))]) : field.options && field.options.length ? _c("select", { staticClass: "pw-category-select", domProps: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue) }, on: { "change": function($event) {
            return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event.target.value, field.defaultValue);
          } } }, _vm._l(field.options, function(opt) {
            return _c("option", { key: opt, domProps: { "value": opt } }, [_vm._v(_vm._s(opt))]);
          }), 0) : field.defaultValue !== null && typeof field.defaultValue === "string" ? _c("input", { staticClass: "pw-category-input", attrs: { "type": "text", "placeholder": field.defaultValue }, domProps: { "value": _vm.getOverrideOnly("settings.fields." + cat.key + "." + field.key + ".default") || "" }, on: { "input": function($event) {
            return _vm.setValOrClear("settings.fields." + cat.key + "." + field.key + ".default", $event.target.value, field.defaultValue);
          } } }) : field.defaultValue !== null && typeof field.defaultValue === "number" ? _c("input", { staticClass: "pw-category-input", attrs: { "type": "text", "inputmode": "decimal", "placeholder": String(field.defaultValue) }, domProps: { "value": _vm.getOverrideOnly("settings.fields." + cat.key + "." + field.key + ".default") }, on: { "input": function($event) {
            _vm.setValOrClear("settings.fields." + cat.key + "." + field.key + ".default", $event.target.value !== "" ? Number($event.target.value) : "", String(field.defaultValue));
          } } }) : _vm._e()], 1)])])]) : _vm._e()];
        })], 2)]);
      });
    })], 2) : _vm._e(), _vm.view === "items-defaults" || _vm.view === "items-layout" ? _c("div", { staticClass: "pw-wizard-tab-content" }, [_vm.view === "items-defaults" && _vm.getItemRadiusFields().length ? _c("div", { staticClass: "pw-field-block" }, _vm._l(_vm.getItemRadiusFields(), function(field) {
      return _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.fieldLabel(field.displayKey)))])]), _c("div", { staticClass: "pw-field-row-options", class: { "pw-toggle-group": field.type === "toggle-group", "pw-corner-grid": _vm.isCornerGroup(field) } }, _vm._l(_vm.cornerOrder(field.subFields), function(sub) {
        return _c("span", { key: sub.key, staticClass: "pw-corner-cell" }, [_c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields.layout." + sub.key + ".default", sub.defaultValue), "text": _vm.toggleOptionLabel(sub.label) }, on: { "input": function($event) {
          return _vm.setVal("settings.fields.layout." + sub.key + ".default", $event);
        } } }), _vm.isCornerGroup(field) ? _c("span", { staticClass: "pw-field-hint", class: { "is-zero": !_vm.getVal("settings.fields.layout." + sub.key + ".default", sub.defaultValue) } }, [_vm._v(_vm._s(_vm.cornerHint(sub.label, _vm.getVal("settings.fields.layout." + sub.key + ".default", sub.defaultValue), _vm.itemRadius)))]) : _vm._e()], 1);
      }), 0)])])]);
    }), 0) : _vm._e(), _vm.view === "items-layout" && _vm.getItemLayoutSettings().length ? _c("div", { staticClass: "pw-field-block" }, _vm._l(_vm.getItemLayoutSettings(), function(field) {
      return _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(field.label ? _vm.$t(field.label) : _vm.fieldLabel(field.displayKey)))])]), _c("div", { staticClass: "pw-field-row-options" }, [field.type === "icon-select" ? _c("div", { staticClass: "pw-icon-select" }, _vm._l(field.options, function(opt) {
        return _c("button", { key: opt.value, staticClass: "pw-icon-option", class: { "is-active": _vm.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue) === opt.value }, attrs: { "type": "button" }, domProps: { "innerHTML": _vm._s('<svg viewBox="0 0 24 24" aria-hidden="true">' + opt.svg + "</svg>") }, on: { "click": function($event) {
          return _vm.setVal("settings.fields.layout." + field.key + ".default", opt.value);
        } } });
      }), 0) : field.type === "select" ? _c("k-toggles-input", { attrs: { "value": _vm.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue), "options": field.options.map((o) => ({ value: o, text: _vm.$t("pw.option." + o) || o })), "grow": false, "required": true }, on: { "input": function($event) {
        return _vm.setVal("settings.fields.layout." + field.key + ".default", $event);
      } } }) : _c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue), "text": [_vm.$t("pw.option.disabled"), _vm.$t("pw.option.enabled")] }, on: { "input": function($event) {
        return _vm.setVal("settings.fields.layout." + field.key + ".default", $event);
      } } })], 1)])])]);
    }), 0) : _vm._e()]) : _vm._e()]) : _vm._e();
  };
  var _sfc_staticRenderFns$9 = [];
  _sfc_render$9._withStripped = true;
  var __component__$9 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$9,
    _sfc_render$9,
    _sfc_staticRenderFns$9
  );
  __component__$9.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BlockSettings.vue";
  const BlockSettings = __component__$9.exports;
  const _sfc_main$8 = {
    directives: { "pw-autosize": autosize },
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
        const size2 = match[1];
        const tKey = "pw.option." + size2;
        const t = this.$t(tKey);
        const label = t && t !== tKey ? t : size2.toUpperCase();
        return label + " (" + size2.toUpperCase() + ")";
      },
      stripRem(val) {
        if (!val) return "";
        return val.replace(/rem$/, "");
      },
      setRemValue(bp, varName, value, defaultVal) {
        const num = parseFloat(String(value).replace(",", "."));
        const remVal = value === "" || isNaN(num) ? "" : num + "rem";
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
  var _sfc_render$8 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", [_c("div", { staticClass: "pw-font-help", staticStyle: { "margin-bottom": "var(--spacing-4)" } }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.sizesHelp")) + " ")]), _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isOpen(groupKey), expression: "isOpen(groupKey)" }], staticClass: "pw-element-list" }, [_c("div", { staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-responsive" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.mobile")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.tablet")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.desktop")))])])])]), _vm._l(group.vars, function(value, varName) {
        return _c("div", { key: varName, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.sizeLabel(varName)))])]), _c("div", { staticClass: "pw-field-row-options pw-group-type-responsive" }, _vm._l(["default", "lg", "xl"], function(bp) {
          return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(bp, varName) }, attrs: { "type": "text", "inputmode": "decimal", "step": group.step || 0.1, "min": "0.1", "max": "20" }, domProps: { "value": _vm.stripRem(_vm.getOverrideValue(bp, varName) || value[bp]) }, on: { "change": function($event) {
            return _vm.setRemValue(bp, varName, $event.target.value, value[bp] || "");
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.remToPx(_vm.getOverrideValue(bp, varName) || value[bp])))])]);
        }), 0)])])]);
      }), _c("div", { staticClass: "pw-group-end" })], 2)])], 1);
    })], 2);
  };
  var _sfc_staticRenderFns$8 = [];
  _sfc_render$8._withStripped = true;
  var __component__$8 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$8,
    _sfc_render$8,
    _sfc_staticRenderFns$8
  );
  __component__$8.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalFonts.vue";
  const GlobalFonts = __component__$8.exports;
  const _sfc_main$7 = {
    directives: { "pw-autosize": autosize },
    props: {
      // preview guides on/off (shared, .sync)
      guides: { type: Boolean, default: false },
      // themes to offer: default + the variants switched on in the settings
      themes: { type: Array, default: () => ["default", "variant", "variant2", "variant3"] },
      // element chosen in the header's select (Overview)
      selectedElement: { type: String, default: null },
      // the elements tab is showing: its previews appear in the sidebar
      previewActive: { type: Boolean, default: false },
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
        // breakpoint shown in the preview sidebar
        previewBp: "xl",
        // theme whose colours the colour rows show
        colorTheme: "default",
        // size step shown in the preview (headings without a base size)
        // size step per element (edited and previewed): heading → "lg",
        // elements with a base size → "normal"
        previewSteps: {},
        // heading preview with the text marking / the flourish
        previewMarked: false,
        previewFlourish: false,
        // media preview with a sample image
        // media radii kept while the corners are square
        mediaCustomRadius: null,
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
      },
      themes(list) {
        if (!list.includes(this.colorTheme)) this.colorTheme = "default";
      },
      selectedElement: {
        immediate: true,
        handler(key) {
          if (key && key !== this.activeElement) this.activeElement = key;
        }
      },
      activeElement: {
        immediate: true,
        handler(key) {
          this.$emit("update:selectedElement", key);
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
        const options = [{ value: "default", text: this.$t("prw.label.defaultFont", { font: this.bodyDefaultFont }) }];
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
      // four corner values (top-left, top-right, bottom-left, bottom-right):
      // shown as a 2×2 grid in the cell, like the corners themselves
      // corner values in the 2×2 grid carry their own glyphs: no column labels
      // element with a base font size (e.g. editor); headings have steps only
      hasBaseFontSize(elementKey) {
        var _a, _b;
        return !!((_b = (_a = this.elementDefaults[elementKey]) == null ? void 0 : _a.vars) == null ? void 0 : _b[elementKey + "-font-size"]);
      },
      // step of an element: chosen, else "normal" (base size) or "lg"
      stepOf(elementKey) {
        return this.previewSteps[elementKey] || (this.hasBaseFontSize(elementKey) ? "normal" : "lg");
      },
      // pills of the size card: "normal" first when the element has a base size
      sizeStepOptions(elementKey) {
        const steps = this.fontSteps(elementKey);
        return this.hasBaseFontSize(elementKey) ? ["normal", ...steps] : steps;
      },
      // the size steps of an element (xs, sm … 3xl)
      fontSteps(elementKey) {
        var _a;
        const vars = ((_a = this.fontSizesForGroup(elementKey)) == null ? void 0 : _a.vars) || {};
        return Object.keys(vars).map((name) => name.replace(elementKey + "-size-", ""));
      },
      // guide colour of a row while the preview guides are on (a stripe at the
      // label, as in the block defaults): the paragraph spacing, and the
      // flourish's outer spacing when the flourish is shown (cyan lines)
      guideType(varName) {
        if (!this.guides) return null;
        if (varName.endsWith("-paragraph-spacing") || varName.endsWith("cite-spacing") || varName === "button-gap" || varName === "button-row-gap") return "margin";
        if (!this.previewFlourish) return null;
        if (varName.endsWith("-flourish-margin-top") || varName.endsWith("-flourish-margin-bottom")) return "margin";
        return null;
      },
      // button corners: square, round or custom (then the radii apply)
      // media corners: square when all four radii are 0
      mediaShape() {
        var _a, _b, _c;
        const def = ((_c = (_b = (_a = this.elementDefaults.media) == null ? void 0 : _a.vars) == null ? void 0 : _b["media-radius"]) == null ? void 0 : _c.value) || [];
        const ov = (this.elementOverrides.global || {})["media-radius"];
        const radii = Array.isArray(ov) ? ov : def;
        return radii.length && radii.every((r) => parseFloat(r) === 0) ? "square" : "custom";
      },
      // square sets the radii to 0 (keeping the custom ones to switch back)
      setMediaShape(shape) {
        const overrides = JSON.parse(JSON.stringify(this.elementOverrides));
        if (!overrides.global) overrides.global = {};
        if (shape === "square") {
          if (this.mediaShape() === "custom") this.mediaCustomRadius = overrides.global["media-radius"] || null;
          overrides.global["media-radius"] = ["0rem", "0rem", "0rem", "0rem"];
        } else if (this.mediaCustomRadius) {
          overrides.global["media-radius"] = [...this.mediaCustomRadius];
        } else {
          delete overrides.global["media-radius"];
        }
        if (Object.keys(overrides.global).length === 0) delete overrides.global;
        this.$emit("update:overrides", overrides);
      },
      buttonShape() {
        var _a, _b, _c;
        return this.getOverrideValue("button-shape") || ((_c = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.vars) == null ? void 0 : _b["button-shape"]) == null ? void 0 : _c.value) || "custom";
      },
      // button shadow: the chosen step's CSS (generates in elements.json)
      buttonShadow() {
        var _a, _b, _c, _d;
        const def = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.vars) == null ? void 0 : _b["button-shadow"];
        if (!def) return "none";
        const step = this.getOverrideValue("button-shadow") || def.value;
        return ((_d = (_c = def.generates) == null ? void 0 : _c["button-shadow"]) == null ? void 0 : _d[step]) || "none";
      },
      // gap between buttons (button-gap), as in the frontend
      buttonGap(name = "button-gap") {
        var _a, _b, _c;
        return this.getOverrideValue(name) || ((_c = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value) || "";
      },
      // gap between quote and source, as in the frontend
      citeGapStyle(childKey) {
        var _a, _b, _c;
        if (childKey !== "cite") return {};
        const gap = this.getOverrideValue("cite-spacing") || ((_c = (_b = (_a = this.elementDefaults.cite) == null ? void 0 : _a.vars) == null ? void 0 : _b["cite-spacing"]) == null ? void 0 : _c.value) || "";
        return { marginTop: gap, "--pw-cite-gap": gap };
      },
      // flourish below the heading, as in the frontend ([data-flourish]): its
      // em values relate to the heading's font size
      flourishStyle(bp, theme) {
        var _a, _b, _c, _d;
        const vars = ((_a = this.elementDefaults.heading) == null ? void 0 : _a.vars) || {};
        const ov = this.elementOverrides.global || {};
        const val = (name, fallback) => {
          const def = vars[name] || {};
          return (ov[bp] || {})[name] || ov[name] || def[bp] || def.default || def.value || fallback;
        };
        const color = (ov[theme] || {})["element-heading-flourish-color"] || ((_d = (_c = (_b = this.elementDefaults.heading) == null ? void 0 : _b.colors) == null ? void 0 : _c["element-heading-flourish-color"]) == null ? void 0 : _d[theme]) || "currentColor";
        return {
          display: "block",
          width: val("heading-flourish-width", "4em"),
          height: val("heading-flourish-height", "0.15em"),
          backgroundColor: color
        };
      },
      // the flourish's outer spacing as padding of a box around it, so the
      // guides can mark where that spacing ends
      flourishBoxStyle(bp, theme) {
        var _a;
        const vars = ((_a = this.elementDefaults.heading) == null ? void 0 : _a.vars) || {};
        const ov = this.elementOverrides.global || {};
        const val = (name, fallback) => {
          const def = vars[name] || {};
          return (ov[bp] || {})[name] || ov[name] || def[bp] || def.default || def.value || fallback;
        };
        return {
          display: "block",
          position: "relative",
          fontSize: this.previewStyle("heading", bp, theme).fontSize,
          paddingTop: val("heading-flourish-margin-top", "0.5em"),
          paddingBottom: val("heading-flourish-margin-bottom", "0")
        };
      },
      // only the size step chosen in the card heading: { name: entry }
      chosenStep(elementKey) {
        var _a, _b;
        const name = elementKey + "-size-" + this.stepOf(elementKey);
        const entry = (_b = (_a = this.fontSizesForGroup(elementKey)) == null ? void 0 : _a.vars) == null ? void 0 : _b[name];
        return entry ? { [name]: entry } : {};
      },
      // a size step's value at a breakpoint (override, else default)
      fontStepValue(elementKey, step, bp) {
        var _a, _b;
        const name = elementKey + "-size-" + step;
        const entry = (_b = (_a = this.fontSizesForGroup(elementKey)) == null ? void 0 : _a.vars) == null ? void 0 : _b[name];
        if (!entry) return "";
        return this.getFontSizeOverride(bp, name) || entry[bp] || entry.default || "";
      },
      isCornerGroup(fieldGroup) {
        return (fieldGroup.fields || []).some((field) => this.isCorners(field.def) || this.isSides(field.def));
      },
      // four values by side (top, right, bottom, left): a 2×2 grid with the
      // side icons
      isSides(def) {
        const names = def && (def.suffixes || def.labels) || [];
        return Array.isArray(names) && names.length === 4 && names.some((n) => /(^|[.-])top$/.test(String(n)));
      },
      isCorners(def) {
        const names = def && (def.suffixes || def.labels) || [];
        return Array.isArray(names) && names.length === 4 && names.some((n) => String(n).includes("top-left"));
      },
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
          return { type: "theme-color", labels: ["Default", "Variant", "Variant2", "Variant3"] };
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
      // colour rows of a card: the marking colours (text/background of the
      // marked heading) sit in the "text marking" card, the flourish colour in
      // the flourish card, the rest under colours
      groupedColorFields(group, section = "colors") {
        const names = Object.keys(group.colors || {});
        const hasStates = names.some((n) => n.endsWith("-hover") || n.endsWith("-active"));
        const sectionOf = (name) => {
          if (name.startsWith("element-button-icon")) return "icon";
          if (name.startsWith("element-button-border") || name.startsWith("element-button-background")) return "style";
          if (name.startsWith("element-button-text")) return "text";
          if (name === "element-media-background") return "style";
          if (name.startsWith("element-slideshow-")) return "slideshow";
          if (name.startsWith("element-image-zoom")) return "zoom";
          if (name.includes("-marked-")) return "marked";
          if (name.includes("-flourish-")) return "flourish";
          if (!hasStates && /^element-[a-z]+-text$/.test(name)) return "text";
          return "colors";
        };
        const colors = {};
        const entries = Object.entries(group.colors || {}).sort(([a], [b]) => Number(b.includes("-border")) - Number(a.includes("-border")));
        for (const [name, value] of entries) {
          if (sectionOf(name) === section) colors[name] = value;
        }
        if (!hasStates) return this.groupedFields({ ...group, colors }, "colors");
        const fields = Object.keys(colors).filter((name) => !name.endsWith("-hover") && !name.endsWith("-active")).map((name) => ({
          varName: name,
          def: {},
          label: this.colorLabel(name),
          type: "state-colors",
          states: ["", "-hover", "-active"].filter((suffix) => colors[name + suffix]).map((suffix) => ({ varName: name + suffix, colorVal: colors[name + suffix], state: suffix ? suffix.slice(1) : "normal" }))
        }));
        if (!fields.length) return [];
        return [{ fields }];
      },
      // element with hover/active colours (buttons, breadcrumbs)
      hasColorStates(elementKey) {
        var _a;
        return Object.keys(((_a = this.elementDefaults[elementKey]) == null ? void 0 : _a.colors) || {}).some((n) => n.endsWith("-hover") || n.endsWith("-active"));
      },
      // cards that hold colour rows (with the variant switch in their heading)
      hasColorRows(category) {
        return ["colors", "marked", "flourish", "text", "icon", "shape", "style", "slideshow", "zoom"].includes(category);
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
          const textRank = (name) => name.endsWith("-font-size") ? 1 : name.endsWith("-line-height") ? 2 : name.endsWith("-letter-spacing") ? 3 : 0;
          const entries = Object.entries(group.vars).sort(([a], [b]) => category === "text" ? textRank(a) - textRank(b) : Number(b.endsWith("-font-size")) - Number(a.endsWith("-font-size")));
          for (const [varName, def] of entries) {
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
      // option label from pagewizard's pw.option.* (e.g. uppercase → "Uppercase"), else the value
      optionText(value) {
        const key = "pw.option." + value;
        const t = this.$t(key);
        return t && t !== key ? t : value;
      },
      filteredOptions(varName, options) {
        if (!varName.endsWith("-font-weight")) {
          if (varName.endsWith("text-transform")) {
            const icons = { none: "prw-case-none", uppercase: "prw-case-upper", lowercase: "prw-case-lower", capitalize: "prw-case-capitalize" };
            return options.map((o) => ({ value: o, icon: icons[o], text: o === "none" ? this.$t("prw.option.asTyped") : this.optionText(o) }));
          }
          return options.map((o) => ({ value: o, text: this.optionText(o) }));
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
        const quadNum = parseFloat(String(value).replace(",", "."));
        current[index] = value === "" || isNaN(quadNum) ? def.value[index] : quadNum + (def.unit || "");
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
        const num = parseFloat(String(value).replace(",", "."));
        const withUnit = value === "" || isNaN(num) ? "" : num + (unit || "");
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
          for (const theme of ["default", "variant", "variant2", "variant3"]) {
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
          for (const theme of ["default", "variant", "variant2", "variant3"]) {
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
        const num = parseFloat(String(value).replace(",", "."));
        const effectiveUnit = unit || "rem";
        const withUnit = value === "" || isNaN(num) ? "" : num + effectiveUnit;
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
        const num = parseFloat(String(value).replace(",", "."));
        const withUnit = value === "" || isNaN(num) ? "" : num + (unit || "");
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
      // sample texts of the previews, in the panel language (heading: the
      // __marked__ part is the text marking)
      previewText(groupKey) {
        if (groupKey === "media") return "__media__";
        const key = "prw.sample." + groupKey;
        const text = this.$t(key);
        return text && text !== key ? text : null;
      },
      previewParagraphs(groupKey) {
        if (groupKey !== "editor") return null;
        return [this.$t("prw.sample.editor.1"), this.$t("prw.sample.editor.2")];
      },
      elementSubtabs(groupKey) {
        const tabs = {
          heading: ["text", "sizes", "marked", "flourish", "colors"],
          tagline: ["text", "colors"],
          editor: ["text", "sizes", "colors"],
          quote: ["text", "sizes", "colors"],
          button: ["text", "padding", "margin", "shape", "style", "icon", "colors"],
          caption: ["text", "colors"],
          breadcrumb: ["text", "colors"],
          media: ["shape", "style", "slideshow", "zoom"],
          cite: ["text", "colors"]
        };
        return tabs[groupKey] || ["text", "sizes", "colors"];
      },
      varCategory(varName) {
        if (varName === "cite-spacing") return "text";
        if (varName === "button-padding") return "padding";
        if (varName === "button-gap" || varName === "button-row-gap") return "margin";
        if (varName === "button-shape" || varName === "button-border-radius") return "shape";
        if (varName === "media-radius") return "shape";
        if (varName === "button-border-width" || varName === "button-shadow") return "style";
        if (varName === "button-icon-size" || varName === "button-icon-gap") return "icon";
        if (varName.endsWith("-marked-line-height") || varName.endsWith("-marked-radius")) return "marked";
        if (varName.endsWith("-flourish-width") || varName.endsWith("-flourish-height") || varName.endsWith("-flourish-margin-top") || varName.endsWith("-flourish-margin-bottom")) return "flourish";
        if (varName.endsWith("-font-family") || varName.endsWith("-font-weight") || varName.endsWith("-text-transform") || varName.endsWith("-font-style") || varName.endsWith("-marks") || varName.endsWith("-gap") && !varName.endsWith("-icon-gap")) return "text";
        if (varName.endsWith("-font-size") || varName.endsWith("-line-height") || varName.endsWith("-paragraph-spacing") || varName.endsWith("-letter-spacing") || varName.endsWith("-padding") || varName.endsWith("-border-radius") || varName.endsWith("-radius") || varName.endsWith("-icon-size") || varName.endsWith("-icon-gap")) {
          const elementKey = varName.split("-")[0];
          return this.fontSizesForGroup(elementKey) ? "sizes" : "text";
        }
        return "text";
      },
      combinedSubtabs(groupKey) {
        const tabLabels = { text: this.$t("prw.subtab.text"), sizes: this.$t("prw.subtab.sizes"), padding: this.$t("prw.headline.paddings"), margin: this.$t("prw.headline.margins"), shape: this.$t("prw.subtab.shape"), style: this.$t("pw.headline.style"), icon: this.$t("prw.subtab.icon"), slideshow: this.$t("prw.subtab.slideshow"), zoom: this.$t("prw.subtab.zoom"), marked: this.$t("prw.subtab.marked"), flourish: this.$t("prw.subtab.flourish"), colors: this.$t("prw.subtab.colors") };
        const result = [];
        const childKey = this.previewChildKey(groupKey);
        const hasChild = childKey && this.groups[childKey];
        const parts = hasChild ? [groupKey, childKey] : [groupKey];
        for (const elementKey of parts) {
          const subtabs = this.elementSubtabs(elementKey).filter((st) => st !== "colors" || !this.groups[elementKey] || this.groupedColorFields(this.groups[elementKey], "colors").length > 0);
          subtabs.forEach((st) => {
            result.push({
              key: elementKey + ":" + st,
              label: elementKey === childKey && st === "text" ? this.partLabel(elementKey) : tabLabels[st],
              elementKey,
              category: st
            });
          });
        }
        return result;
      },
      partLabel(key) {
        const tKey = "prw.elementpart." + key;
        const t = this.$t(tKey);
        return t && t !== tKey ? t : this.groupLabel(key);
      },
      bpIcon(bp) {
        return { default: "mobile", lg: "tablet", xl: "display" }[bp];
      },
      bpLabel(bp) {
        return { default: this.$t("prw.label.mobile"), lg: this.$t("prw.label.tablet"), xl: this.$t("prw.label.desktop") }[bp];
      },
      // field group, category and element of one card (former subtab)
      stInfo(st) {
        return { group: this.groups[st.elementKey], category: st.category, elementKey: st.elementKey };
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
      previewHtml(groupKey, theme, plain = false) {
        let text = this.previewText(groupKey);
        if (!text) return "";
        if (plain) return text.replace(/__\/?marked__/g, "");
        const elDef = this.elementDefaults[groupKey] || {};
        const elOv = this.elementOverrides.global || {};
        text = text.replace(/__marked__(.+?)__\/marked__/g, (match, content) => {
          var _a, _b, _c, _d, _e, _f;
          const markedTextColor = (elOv[theme] || {})["element-" + groupKey + "-marked-text"] || ((_b = (_a = elDef.colors) == null ? void 0 : _a["element-" + groupKey + "-marked-text"]) == null ? void 0 : _b[theme]) || "";
          const markedBgColor = (elOv[theme] || {})["element-" + groupKey + "-marked-background"] || ((_d = (_c = elDef.colors) == null ? void 0 : _c["element-" + groupKey + "-marked-background"]) == null ? void 0 : _d[theme]) || "";
          let style = "";
          if (markedTextColor) style += "color:" + markedTextColor + ";";
          if (markedBgColor) style += "background:" + markedBgColor + ";";
          const markedRadius = elOv[groupKey + "-marked-radius"] || ((_f = (_e = elDef.vars) == null ? void 0 : _e[groupKey + "-marked-radius"]) == null ? void 0 : _f.value);
          if (markedRadius) style += "border-radius:" + markedRadius + ";";
          style += "padding:0.05em 0.3em;box-decoration-break:clone;-webkit-box-decoration-break:clone;";
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
        var _a, _b, _c, _d, _e, _f, _g;
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
          // colours per state as variables: CSS switches them on hover/active
          "--pw-btn-text": colorVal("element-button-text"),
          "--pw-btn-text-hover": colorVal("element-button-text-hover"),
          "--pw-btn-text-active": colorVal("element-button-text-active"),
          "--pw-btn-bg": colorVal("element-button-background"),
          "--pw-btn-bg-hover": colorVal("element-button-background-hover"),
          "--pw-btn-bg-active": colorVal("element-button-background-active"),
          "--pw-btn-border": colorVal("element-button-border"),
          "--pw-btn-border-hover": colorVal("element-button-border-hover"),
          "--pw-btn-border-active": colorVal("element-button-border-active"),
          "--pw-btn-icon": colorVal("element-button-icon") || "currentColor",
          "--pw-btn-icon-hover": colorVal("element-button-icon-hover") || "currentColor",
          "--pw-btn-icon-active": colorVal("element-button-icon-active") || "currentColor",
          borderWidth: this.getOverrideValue("button-border-width") || ((_g = (_f = (_e = this.elementDefaults.button) == null ? void 0 : _e.vars) == null ? void 0 : _f["button-border-width"]) == null ? void 0 : _g.value) || "1px",
          boxShadow: this.buttonShadow(),
          borderStyle: "solid",
          padding: Array.isArray(padding) ? padding.join(" ") : padding,
          borderRadius: { square: "0", round: "999px" }[this.buttonShape()] || (Array.isArray(radius) ? radius.join(" ") : radius)
        };
      },
      previewButtonIconStyle(theme, bp) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
        const groupKey = "button";
        const iconSizeOv = this.getResponsiveOverride("button-icon-size", bp);
        const iconGapOv = this.getResponsiveOverride("button-icon-gap", bp);
        const iconSizeDef = ((_c = (_b = (_a = this.elementDefaults[groupKey]) == null ? void 0 : _a.vars) == null ? void 0 : _b["button-icon-size"]) == null ? void 0 : _c[bp]) ?? ((_f = (_e = (_d = this.elementDefaults[groupKey]) == null ? void 0 : _d.vars) == null ? void 0 : _e["button-icon-size"]) == null ? void 0 : _f.default) ?? ((_i = (_h = (_g = this.elementDefaults[groupKey]) == null ? void 0 : _g.vars) == null ? void 0 : _h["button-icon-size"]) == null ? void 0 : _i.value) ?? "1em";
        const iconGapDef = ((_l = (_k = (_j = this.elementDefaults[groupKey]) == null ? void 0 : _j.vars) == null ? void 0 : _k["button-icon-gap"]) == null ? void 0 : _l[bp]) ?? ((_o = (_n = (_m = this.elementDefaults[groupKey]) == null ? void 0 : _m.vars) == null ? void 0 : _n["button-icon-gap"]) == null ? void 0 : _o.default) ?? ((_r = (_q = (_p = this.elementDefaults[groupKey]) == null ? void 0 : _p.vars) == null ? void 0 : _q["button-icon-gap"]) == null ? void 0 : _r.value) ?? "0.4em";
        return {
          fontSize: iconSizeOv || iconSizeDef,
          marginRight: iconGapOv || iconGapDef
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
      previewParagraphGap(groupKey) {
        const override = this.getOverrideValue(groupKey + "-paragraph-spacing");
        if (override) return override;
        const group = this.elementDefaults[groupKey];
        if (group && group.vars && group.vars[groupKey + "-paragraph-spacing"]) {
          return group.vars[groupKey + "-paragraph-spacing"].value || "";
        }
        return "";
      },
      previewStyle(groupKey, bp, theme, marked = false) {
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
          // headings have no base size: the "lg" step, as in the frontend
          fontSize: this.fontSizesForGroup(groupKey) && this.stepOf(groupKey) !== "normal" ? this.fontStepValue(groupKey, this.stepOf(groupKey), bp) : responsiveVal("font-size") || this.fontStepValue(groupKey, "lg", bp),
          lineHeight: marked && responsiveVal("marked-line-height") || responsiveVal("line-height"),
          // as in the frontend: the marked heading keeps the place of its first
          // line (half the extra line height up, the whole of it back below)
          ...marked && responsiveVal("marked-line-height") ? (() => {
            const extra = parseFloat(responsiveVal("marked-line-height")) - parseFloat(responsiveVal("line-height")) || 0;
            return { position: "relative", top: -extra / 2 + "em", marginBottom: -extra + "em" };
          })() : {},
          letterSpacing: responsiveVal("letter-spacing"),
          textTransform: get("text-transform") || defVal("text-transform", "value"),
          color: colorOverride || colorDefault
        };
      }
    }
  };
  var _sfc_render$7 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { directives: [{ name: "show", rawName: "v-show", value: _vm.isElementVisible(groupKey) && !_vm.isChildElement(groupKey), expression: "isElementVisible(groupKey) && !isChildElement(groupKey)" }], key: groupKey, staticClass: "pw-element-section" }, [_c("div", { staticClass: "pw-element-list" }, [_vm.previewText(groupKey) && !_vm.isChildElement(groupKey) ? _c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.previewActive && _vm.isElementVisible(groupKey), expression: "previewActive && isElementVisible(groupKey)" }], staticClass: "pw-element-preview-side" }, [_c("div", { staticClass: "pw-preview-switches" }, [_c("div", { staticClass: "pw-pill pw-preview-bp pw-preview-theme", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "pt-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.colorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.colorTheme = theme;
        } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0), _c("div", { staticClass: "pw-pill pw-guides-switch", attrs: { "role": "group" } }, [_c("button", { staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t("prw.preview.guides"), "aria-label": _vm.$t("prw.preview.guides"), "aria-pressed": _vm.guides ? "true" : "false" }, on: { "click": function($event) {
        return _vm.$emit("update:guides", !_vm.guides);
      } } }, [_c("k-icon", { attrs: { "type": "prw-guides" } })], 1)]), _c("pw-device-select", { model: { value: _vm.previewBp, callback: function($$v) {
        _vm.previewBp = $$v;
      }, expression: "previewBp" } })], 1), _c("div", { staticClass: "pw-element-preview", class: { "pw-element-preview-themed": _vm.previewThemed(groupKey), "has-guides": _vm.guides, "is-marked": groupKey === "heading" && _vm.previewMarked } }, [_vm._l([_vm.colorTheme], function(theme) {
        return _vm._l([_vm.previewBp], function(bp) {
          return _c("div", { key: theme + "-" + bp, staticClass: "pw-element-preview-col", style: { backgroundColor: _vm.blockBackground(theme) } }, [groupKey === "media" ? [_c("div", { staticClass: "pw-media-preview-img pw-media-preview-empty", style: _vm.mediaPreviewStyle(theme) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "stroke-width": "1", "opacity": "0.3" } }, [_c("rect", { attrs: { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" } }), _c("circle", { attrs: { "cx": "8.5", "cy": "8.5", "r": "1.5" } }), _c("path", { attrs: { "d": "M21 15l-5-5L5 21" } })])]), _c("div", { staticClass: "pw-media-preview-img pw-media-preview-photo", style: _vm.mediaPreviewStyle(theme) }, [_c("span", { staticClass: "pw-media-preview-zoom", style: { color: _vm.mediaColor(theme, "element-image-zoom"), backgroundColor: _vm.mediaColor(theme, "element-image-zoom-background") } }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" } }, [_c("circle", { attrs: { "cx": "11", "cy": "11", "r": "8" } }), _c("line", { attrs: { "x1": "21", "y1": "21", "x2": "16.65", "y2": "16.65" } })])])]), _c("div", { staticClass: "pw-media-preview-bullets" }, [_c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet") } }), _c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet-active") } }), _c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet") } })]), _vm.previewChildText(groupKey) ? [_c("span", { staticClass: "pw-element-preview-text", style: _vm.previewStyle(_vm.previewChildKey(groupKey), bp, theme) }, [_vm._v(_vm._s(_vm.previewChildText(groupKey)))])] : _vm._e()] : _vm.previewThemed(groupKey) ? [_c("span", { staticClass: "pw-element-preview-buttons", style: { columnGap: _vm.buttonGap(), rowGap: _vm.buttonGap("button-row-gap"), "--pw-button-gap": _vm.buttonGap() } }, [_c("span", { staticClass: "pw-element-preview-button", style: _vm.previewButtonStyle(groupKey, theme, bp) }, [_c("span", { staticClass: "pw-button-content" }, [groupKey === "button" ? _c("span", { staticClass: "pw-preview-link-icon", style: _vm.previewButtonIconStyle(theme, bp) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "currentColor", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" } })])]) : _vm._e(), _vm._v(_vm._s(_vm.previewText(groupKey)))])]), _c("span", { staticClass: "pw-element-preview-button pw-element-preview-button-second", style: _vm.previewButtonStyle(groupKey, theme, bp) }, [_c("span", { staticClass: "pw-button-content" }, [groupKey === "button" ? _c("span", { staticClass: "pw-preview-link-icon", style: _vm.previewButtonIconStyle(theme, bp) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "currentColor", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" } })])]) : _vm._e(), _vm._v(_vm._s(_vm.$t("prw.sample.button.2")))])]), _c("span", { staticClass: "pw-element-preview-buttons-row", style: { "--pw-button-row-gap": _vm.buttonGap("button-row-gap") } }, [_c("span", { staticClass: "pw-element-preview-button", style: _vm.previewButtonStyle(groupKey, theme, bp) }, [_c("span", { staticClass: "pw-button-content" }, [groupKey === "button" ? _c("span", { staticClass: "pw-preview-link-icon", style: _vm.previewButtonIconStyle(theme, bp) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "currentColor", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" } })])]) : _vm._e(), _vm._v(_vm._s(_vm.$t("prw.sample.button.3")))])])])])] : _vm.previewParagraphs(groupKey) ? [_c("div", { staticClass: "pw-element-preview-text pw-element-preview-paragraphs", style: _vm.previewStyle(groupKey, bp, theme) }, _vm._l(_vm.previewParagraphs(groupKey), function(para, pIdx) {
            return _c("p", { key: pIdx, style: pIdx > 0 ? { marginTop: _vm.previewParagraphGap(groupKey) } : {} }, [_vm._v(_vm._s(para))]);
          }), 0)] : [groupKey === "heading" && _vm.previewMarked ? _c("span", { staticClass: "pw-element-preview-text pw-element-preview-marked", style: _vm.previewStyle(groupKey, bp, theme, true), domProps: { "innerHTML": _vm._s(_vm.previewHtml(groupKey, theme)) } }) : _c("span", { staticClass: "pw-element-preview-text", style: _vm.previewStyle(groupKey, bp, theme), domProps: { "innerHTML": _vm._s(_vm.previewHtml(groupKey, theme, groupKey === "heading")) } }), groupKey === "heading" && _vm.previewFlourish ? _c("span", { staticClass: "pw-element-preview-flourish-box", style: _vm.flourishBoxStyle(bp, theme) }, [_c("span", { staticClass: "pw-element-preview-flourish", style: _vm.flourishStyle(bp, theme) })]) : _vm._e()], _vm.previewChildText(groupKey) && groupKey !== "media" ? [_c("span", { staticClass: "pw-element-preview-text", class: { "pw-element-preview-cite": _vm.previewChildKey(groupKey) === "cite" }, style: { ..._vm.previewStyle(_vm.previewChildKey(groupKey), bp, theme), ..._vm.citeGapStyle(_vm.previewChildKey(groupKey)) } }, [_vm._v(_vm._s(_vm.previewChildText(groupKey)))])] : _vm._e()], 2);
        });
      })], 2)])]) : _vm._e(), _vm._l(_vm.combinedSubtabs(groupKey), function(st) {
        return [_c("section", { key: "card-" + st.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(st.label))]), st.category === "flourish" ? _c("button", { staticClass: "pw-marked-switch", attrs: { "type": "button", "title": _vm.$t("prw.label.showInPreview"), "aria-label": _vm.$t("prw.label.showInPreview"), "aria-pressed": _vm.previewFlourish ? "true" : "false" }, on: { "click": function($event) {
          _vm.previewFlourish = !_vm.previewFlourish;
        } } }, [_c("k-icon", { attrs: { "type": _vm.previewFlourish ? "preview" : "hidden" } })], 1) : st.category === "marked" ? _c("button", { staticClass: "pw-marked-switch", attrs: { "type": "button", "title": _vm.$t("prw.label.showInPreview"), "aria-label": _vm.$t("prw.label.showInPreview"), "aria-pressed": _vm.previewMarked ? "true" : "false" }, on: { "click": function($event) {
          _vm.previewMarked = !_vm.previewMarked;
        } } }, [_c("k-icon", { attrs: { "type": _vm.previewMarked ? "preview" : "hidden" } })], 1) : _vm._e(), _vm.hasColorRows(st.category) && _vm.groupedColorFields(_vm.stInfo(st).group, st.category).length ? _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
          return _c("button", { key: "th-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.colorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
            _vm.colorTheme = theme;
          } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
        }), 0) : st.category === "sizes" && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) ? _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.sizeStepOptions(_vm.stInfo(st).elementKey), function(step) {
          return _c("button", { key: "fs-" + step, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.stepOf(_vm.stInfo(st).elementKey) === step ? "true" : "false" }, on: { "click": function($event) {
            _vm.$set(_vm.previewSteps, _vm.stInfo(st).elementKey, step);
          } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + step)))]);
        }), 0) : _vm._e()]), _c("div", { staticClass: "pw-card pw-field-table" }, [_vm.stInfo(st).category !== "colors" ? [_vm.stInfo(st).category === "sizes" && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) && _vm.stepOf(_vm.stInfo(st).elementKey) !== "normal" ? _vm._l(_vm.chosenStep(_vm.stInfo(st).elementKey), function(sizeEntry, sizeName) {
          return _c("div", { key: "sz-" + sizeName, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.prop.font-size")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_vm._l([_vm.previewBp], function(bp) {
            return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "text", "inputmode": "decimal", "step": sizeEntry.step || 0.1, "min": sizeEntry.min, "max": sizeEntry.max }, domProps: { "value": _vm.stripUnit(_vm.getFontSizeOverride(bp, sizeName) || sizeEntry[bp]) }, on: { "change": function($event) {
              return _vm.setFontSizeValue(bp, sizeName, $event.target.value, sizeEntry[bp], sizeEntry.unit);
            } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(sizeEntry.unit || "rem"))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getFontSizeOverride(bp, sizeName) || sizeEntry[bp], sizeEntry.unit || "rem")))])]);
          }), _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
            return _c("button", { key: "sw-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.bpLabel(b), "aria-label": _vm.bpLabel(b), "aria-pressed": _vm.previewBp === b ? "true" : "false" }, on: { "click": function($event) {
              _vm.previewBp = b;
            } } }, [_c("k-icon", { attrs: { "type": _vm.bpIcon(b) } })], 1);
          }), 0)], 2)])])]);
        }) : _vm._e(), st.elementKey === "media" && st.category === "shape" ? _c("div", { key: "media-shape-" + st.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.element.button-shape")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.mediaShape(), "options": [{ value: "square", text: _vm.$t("pw.option.square") }, { value: "custom", text: _vm.$t("pw.option.round") }], "grow": false, "required": true }, on: { "input": _vm.setMediaShape } })], 1)])])]) : _vm._e(), _vm._l(_vm.groupedVarFields(_vm.stInfo(st).group, _vm.stInfo(st).category), function(fieldGroup, gIdx) {
          return [fieldGroup.header && !_vm.isCornerGroup(fieldGroup) ? _c("div", { key: "vgh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
            return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.translateLabel(label)))])]);
          }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
            return [_vm.isSides(field.def) ? _vm._l([{ key: "h", label: "prw.label.leftRight", idx: [3, 1] }, { key: "v", label: "prw.label.topBottom", idx: [0, 2] }], function(axis) {
              return _c("div", { key: "ax-" + gIdx + "-" + fIdx + "-" + axis.key, staticClass: "pw-field-row", attrs: { "data-guide": _vm.guides ? "padding" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t(axis.label)))])]), _c("div", { staticClass: "pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid" }, _vm._l(axis.idx, function(idx) {
                return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || field.def.value[idx]) }, on: { "change": function($event) {
                  return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
                } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || field.def.value[idx], field.def.unit)))]) : _vm._e(), _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": ["grid-top", "grid-right", "grid-bottom", "grid-left"][idx] } })], 1);
              }), 0)])])]);
            }) : !(field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) && _vm.stepOf(_vm.stInfo(st).elementKey) !== "normal") && !(field.varName === "button-border-radius" && _vm.buttonShape() !== "custom") && !(field.varName === "media-radius" && _vm.mediaShape() !== "custom") ? _c("div", { key: "vf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: {
              "pw-dual-first": field.isFollowedByState,
              "pw-dual-next": field.isState
            }, attrs: { "data-guide": _vm.guideType(field.varName) } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(field.label) } })]), _c("div", { staticClass: "pw-field-row-options", class: [fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "", { "pw-corner-grid": _vm.isCorners(field.def) || _vm.isSides(field.def), "pw-side-grid": _vm.isSides(field.def) }] }, [field.def.type === "font-family" ? _c("select", { staticClass: "pw-element-input pw-font-select", domProps: { "value": _vm.fontSelectValue(field.varName, field.def.value) }, on: { "change": function($event) {
              return _vm.setValue(field.varName, $event.target.value, field.def.value);
            } } }, _vm._l(_vm.fontFamilyOptions, function(opt) {
              return _c("option", { key: opt.value, domProps: { "value": opt.value } }, [_vm._v(_vm._s(opt.text))]);
            }), 0) : field.def.options ? _c("k-toggles-input", { attrs: { "value": _vm.getOverrideValue(field.varName) || field.def.value, "options": _vm.filteredOptions(field.varName, field.def.options), "grow": false, "required": true }, on: { "input": function($event) {
              return _vm.setValue(field.varName, $event, field.def.value);
            } } }) : field.type === "multi-value" ? _vm._l(field.def.value, function(val, idx) {
              return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || val) }, on: { "change": function($event) {
                return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
              } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit)))]) : _vm._e(), _vm.isSides(field.def) ? _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": ["grid-top", "grid-right", "grid-bottom", "grid-left"][idx] } }) : _vm._e()], 1);
            }) : field.type === "responsive" ? [_vm._l([_vm.previewBp], function(bp) {
              return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "change": function($event) {
                return _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit);
              } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit)))]) : _vm._e()]);
            }), _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
              return _c("button", { key: "sw-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.bpLabel(b), "aria-label": _vm.bpLabel(b), "aria-pressed": _vm.previewBp === b ? "true" : "false" }, on: { "click": function($event) {
                _vm.previewBp = b;
              } } }, [_c("k-icon", { attrs: { "type": _vm.bpIcon(b) } })], 1);
            }), 0)] : field.def.unit !== void 0 ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(field.varName) || field.def.value) }, on: { "change": function($event) {
              return _vm.setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit);
            } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit)))]) : _vm._e()])] : _vm._e()], 2)])]), _vm.hasFieldOverride(field) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "title": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
              return _vm.resetField(field);
            } } }) : _vm._e()], 1) : _vm._e(), _vm.stInfo(st).category === "style" && field.varName === "button-border-width" ? _vm._l((_vm.groupedColorFields(_vm.stInfo(st).group, "style")[0] || {}).fields || [], function(colorField) {
              return _c("div", { key: "sc-" + colorField.varName, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(colorField.label) } })]), _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-state-grid" }, _vm._l(colorField.states, function(stateField) {
                return _c("span", { key: stateField.varName, staticClass: "pw-state-cell" }, [stateField.state !== "normal" ? _c("span", { staticClass: "pw-state-pill", class: "pw-state-" + stateField.state }, [_vm._v(":" + _vm._s(_vm.$t("prw.state." + stateField.state)))]) : _vm._e(), _c("pw-color-field-row", { attrs: { "group": _vm.colorTheme, "var-name": stateField.varName, "default-value": stateField.colorVal[_vm.colorTheme] || "", "override-value": _vm.getColorOverrideValue(_vm.colorTheme, stateField.varName) }, on: { "update:value": function($event) {
                  return _vm.setColorValue(_vm.colorTheme, stateField.varName, $event, stateField.colorVal[_vm.colorTheme] || "");
                } } })], 1);
              }), 0)])])])]);
            }) : _vm._e()];
          }), fieldGroup.header ? _c("div", { key: "vge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()];
        })] : _vm._e(), _vm.hasColorRows(_vm.stInfo(st).category) && (_vm.stInfo(st).category !== "style" || st.elementKey !== "button") ? [_vm._l(_vm.groupedColorFields(_vm.stInfo(st).group, _vm.stInfo(st).category), function(fieldGroup, gIdx) {
          return [fieldGroup.header && !_vm.isCornerGroup(fieldGroup) ? _c("div", { key: "gh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
            return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.translateLabel(label)))])]);
          }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
            return [_c("div", { key: "gf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: {
              "pw-dual-first": field.isFollowedByState || field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) && _vm.openSections[st.key + "-sizes"],
              "pw-dual-next": field.isState
            } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) ? [_c("button", { staticClass: "pw-sizes-toggle", attrs: { "type": "button" }, on: { "click": function($event) {
              $event.preventDefault();
              return _vm.$set(_vm.openSections, st.key + "-sizes", !_vm.openSections[st.key + "-sizes"]);
            } } }, [_c("k-icon", { staticClass: "pw-sizes-chevron", attrs: { "type": _vm.openSections[st.key + "-sizes"] ? "angle-down" : "angle-right" } }), _c("span", [_vm._v(_vm._s(field.label))])], 1)] : _c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(field.label) } })], 2), _c("div", { staticClass: "pw-field-row-options", class: [fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "", { "pw-corner-grid": _vm.isCorners(field.def) || _vm.isSides(field.def), "pw-side-grid": _vm.isSides(field.def) }] }, [field.def.type === "font-family" ? _c("select", { staticClass: "pw-element-input pw-font-select", domProps: { "value": _vm.fontSelectValue(field.varName, field.def.value) }, on: { "change": function($event) {
              return _vm.setValue(field.varName, $event.target.value, field.def.value);
            } } }, _vm._l(_vm.fontFamilyOptions, function(opt) {
              return _c("option", { key: opt.value, domProps: { "value": opt.value } }, [_vm._v(_vm._s(opt.text))]);
            }), 0) : field.def.options ? _c("k-toggles-input", { attrs: { "value": _vm.getOverrideValue(field.varName) || field.def.value, "options": _vm.filteredOptions(field.varName, field.def.options), "grow": false, "required": true }, on: { "input": function($event) {
              return _vm.setValue(field.varName, $event, field.def.value);
            } } }) : field.type === "multi-value" ? _vm._l(field.def.value, function(val, idx) {
              return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getQuadValue(field.varName, idx) }, attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || val) }, on: { "change": function($event) {
                return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
              } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit)))]) : _vm._e()]);
            }) : field.type === "responsive" ? [_vm._l([_vm.previewBp], function(bp) {
              return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getResponsiveOverride(field.varName, bp) }, attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "change": function($event) {
                return _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit);
              } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit)))]) : _vm._e()]);
            }), _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
              return _c("button", { key: "sw-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.bpLabel(b), "aria-label": _vm.bpLabel(b), "aria-pressed": _vm.previewBp === b ? "true" : "false" }, on: { "click": function($event) {
                _vm.previewBp = b;
              } } }, [_c("k-icon", { attrs: { "type": _vm.bpIcon(b) } })], 1);
            }), 0)] : field.type === "state-colors" ? [_c("span", { staticClass: "pw-state-grid" }, _vm._l(field.states, function(stateField) {
              return _c("span", { key: stateField.varName, staticClass: "pw-state-cell" }, [stateField.state !== "normal" ? _c("span", { staticClass: "pw-state-pill", class: "pw-state-" + stateField.state }, [_vm._v(":" + _vm._s(_vm.$t("prw.state." + stateField.state)))]) : _vm._e(), _c("pw-color-field-row", { attrs: { "group": _vm.colorTheme, "var-name": stateField.varName, "default-value": stateField.colorVal[_vm.colorTheme] || "", "override-value": _vm.getColorOverrideValue(_vm.colorTheme, stateField.varName) }, on: { "update:value": function($event) {
                return _vm.setColorValue(_vm.colorTheme, stateField.varName, $event, stateField.colorVal[_vm.colorTheme] || "");
              } } })], 1);
            }), 0)] : field.type === "theme-color" ? _vm._l([_vm.colorTheme], function(theme) {
              return _c("pw-color-field-row", { key: theme, attrs: { "group": theme, "var-name": field.varName, "default-value": field.colorVal[theme] || "", "override-value": _vm.getColorOverrideValue(theme, field.varName) }, on: { "update:value": function($event) {
                return _vm.setColorValue(theme, field.varName, $event, field.colorVal[theme] || "");
              } } });
            }) : field.def.unit !== void 0 ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(field.varName) }, attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(field.varName) || field.def.value) }, on: { "change": function($event) {
              return _vm.setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit);
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit)))]) : _vm._e()]), field.def.help ? _c("span", { staticClass: "pw-element-help" }, [_vm._v(_vm._s(_vm.helpText(field.def.help)))]) : _vm._e()] : [_c("input", { staticClass: "pw-element-input", attrs: { "type": "text", "placeholder": field.def.value }, domProps: { "value": _vm.getOverrideValue(field.varName) }, on: { "input": function($event) {
              return _vm.setValue(field.varName, $event.target.value, field.def.value);
            } } }), field.def.help ? _c("span", { staticClass: "pw-element-help" }, [_vm._v(_vm._s(_vm.helpText(field.def.help)))]) : _vm._e()]], 2)])]), _vm.hasFieldOverride(field) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "title": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
              return _vm.resetField(field);
            } } }) : _vm._e()], 1), field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) && _vm.openSections[st.key + "-sizes"] ? _vm._l(_vm.fontSizesForGroup(_vm.stInfo(st).elementKey).vars, function(sizeVal, sizeName) {
              return _c("div", { key: "size-" + sizeName, staticClass: "pw-field-row pw-dual-first pw-dual-next" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-sizes-label" }, [_vm._v(_vm._s(_vm.$t("pw.option." + sizeName.split("-").pop())))])]), _c("div", { staticClass: "pw-field-row-options pw-group-type-responsive" }, [_vm._l([_vm.previewBp], function(bp) {
                return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getFontSizeOverride(bp, sizeName) }, attrs: { "type": "text", "inputmode": "decimal", "step": _vm.fontSizesForGroup(_vm.stInfo(st).elementKey).step || 0.1, "min": "0.1", "max": "20" }, domProps: { "value": _vm.stripUnit(_vm.getFontSizeOverride(bp, sizeName) || sizeVal[bp]) }, on: { "change": function($event) {
                  return _vm.setFontSizeValue(bp, sizeName, $event.target.value, sizeVal[bp], "rem");
                } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getFontSizeOverride(bp, sizeName) || sizeVal[bp], "rem")))])]);
              }), _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
                return _c("button", { key: "sw-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.bpLabel(b), "aria-label": _vm.bpLabel(b), "aria-pressed": _vm.previewBp === b ? "true" : "false" }, on: { "click": function($event) {
                  _vm.previewBp = b;
                } } }, [_c("k-icon", { attrs: { "type": _vm.bpIcon(b) } })], 1);
              }), 0)], 2)])])]);
            }) : _vm._e()];
          }), fieldGroup.header ? _c("div", { key: "ge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()];
        })] : _vm._e()], 2)])];
      })], 2)]);
    }), 0);
  };
  var _sfc_staticRenderFns$7 = [];
  _sfc_render$7._withStripped = true;
  var __component__$7 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$7,
    _sfc_render$7,
    _sfc_staticRenderFns$7
  );
  __component__$7.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalElementStyles.vue";
  const GlobalElementStyles = __component__$7.exports;
  const _sfc_main$6 = {
    directives: { "pw-autosize": autosize },
    props: {
      // colour rows to show (null: all) / to leave out
      colorNames: {
        type: Array,
        default: null
      },
      hideColorNames: {
        type: Array,
        default: () => []
      },
      // rows marked with the cyan guide stripe (preview guides on)
      guideVars: {
        type: Array,
        default: () => []
      },
      // one theme (e.g. "variant"): the colour rows show only its value
      theme: {
        type: String,
        default: null
      },
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
      // show the filtered vars of a group without its colours (e.g. only the
      // page background from the "colors" group)
      varsOnly: {
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
              if (val.colors && this.varsOnly) {
                if (!filtered.vars || Object.keys(filtered.vars).length === 0) continue;
                delete filtered.colors;
              } else if (val.colors && this.showOnly && !this.showColors) continue;
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
        const options = hasBodyDefault ? [] : [{ value: "default", text: this.$t("prw.label.defaultFont", { font: this.bodyDefaultFont }) }];
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
      // four corner values (top-left, top-right, bottom-left, bottom-right):
      // shown as a 2×2 grid in the cell, like the corners themselves
      // corner values in the 2×2 grid carry their own glyphs: no column labels
      // hover/active colour of a base colour in the same group (shown in the
      // base colour's row)
      isStateColor(varName, colors) {
        const base = varName.replace(/-(hover|active)$/, "");
        return base !== varName && !!colors[base];
      },
      stateColors(varName, colors) {
        return ["", "-hover", "-active"].filter((suffix) => colors[varName + suffix]).map((suffix) => ({ varName: varName + suffix, colorVal: colors[varName + suffix], state: suffix ? suffix.slice(1) : "normal" }));
      },
      isCornerGroup(fieldGroup) {
        return (fieldGroup.fields || []).some((field) => this.isCorners(field.def));
      },
      isCorners(def) {
        const names = def && (def.suffixes || def.labels) || [];
        return Array.isArray(names) && names.length === 4 && names.some((n) => String(n).includes("top-left"));
      },
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
      colorShown(varName) {
        if (this.hideColorNames.includes(varName)) return false;
        return !this.colorNames || this.colorNames.includes(varName);
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
            this.$panel.notification.error(this.$t("prw.notify.svg.invalid"));
            return;
          }
          const dims = this.parseSvgDimensions(cleaned);
          if (!dims) {
            this.$panel.notification.error(this.$t("prw.notify.svg.dimensions"));
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
          if (varName.endsWith("text-transform")) {
            const icons = { none: "prw-case-none", uppercase: "prw-case-upper", lowercase: "prw-case-lower", capitalize: "prw-case-capitalize" };
            return options.map((o) => ({ value: String(o), icon: icons[o], text: o === "none" ? this.$t("prw.option.asTyped") : this.optionLabel(o) }));
          }
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
        const quadNum = parseFloat(String(value).replace(",", "."));
        current[index] = value === "" || isNaN(quadNum) ? def.value[index] : quadNum + (def.unit || "");
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
        const num = parseFloat(String(value).replace(",", "."));
        const withUnit = value === "" || isNaN(num) ? "" : num + (unit || "");
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
        const num = parseFloat(String(value).replace(",", "."));
        const withUnit = value === "" || isNaN(num) ? "" : num + (unit || "");
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
          for (const theme of ["default", "variant", "variant2", "variant3"]) {
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
          for (const theme of ["default", "variant", "variant2", "variant3"]) {
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
  var _sfc_render$6 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [!_vm.hideSectionHeaders ? _c("div", { staticClass: "pw-section-header" }, [_c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]) : _vm._e(), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.hideSectionHeaders || _vm.isOpen(groupKey), expression: "hideSectionHeaders || isOpen(groupKey)" }], staticClass: "pw-element-list" }, [groupKey === "desktop" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview-header" }, [_c("span", { staticClass: "pw-element-preview-header-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.desktop")))])]) : _vm._e(), groupKey === "desktop" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview pw-nav-preview", style: _vm.navPreviewBarStyle() }, [_vm.navPreviewLogo() ? _c("div", { staticClass: "pw-nav-preview-logo", style: _vm.navPreviewLogoStyle() }, [_c("div", { style: { height: _vm.navPreviewLogoSvgHeight() }, domProps: { "innerHTML": _vm._s(_vm.navPreviewLogo()) } })]) : _vm._e(), _c("div", { staticClass: "pw-nav-preview-items", style: _vm.navPreviewItemsWrapStyle() }, _vm._l([{ t: _vm.$t("prw.preview.nav.home"), fly: false, home: true }, { t: _vm.$t("prw.preview.nav.about"), fly: false }, { t: _vm.$t("prw.preview.nav.services"), fly: true, flyout: "services" }, { t: _vm.$t("prw.preview.nav.portfolio"), fly: true, flyout: "portfolio" }, { t: _vm.$t("prw.preview.nav.contact"), fly: false }], function(item, idx) {
        return !item.home || (_vm.navGet("home-desktop") || _vm.navDef("desktop", "home-desktop")) === "true" ? _c("span", { key: idx, staticClass: "pw-nav-preview-item", style: _vm.navPreviewItemStyle() }, [_c("span", { staticStyle: { "display": "flex", "align-items": "center", "gap": "var(--spacing-1)" } }, [_vm._v(_vm._s(item.t)), item.fly ? _c("span", { staticClass: "pw-nav-preview-flyout-icon", style: { color: _vm.navPreviewTextColor() }, domProps: { "innerHTML": _vm._s(_vm.navFlyoutIconPath()) } }) : _vm._e()]), item.flyout && _vm.showFlyout && item.flyout === "services" ? _c("div", { staticClass: "pw-nav-preview-flyout", style: _vm.navPreviewFlyoutStyle() }, [_c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v(_vm._s(_vm.$t("prw.preview.nav.submenu", { letter: "A" })))]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v(_vm._s(_vm.$t("prw.preview.nav.submenu", { letter: "B" })))]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v(_vm._s(_vm.$t("prw.preview.nav.submenu", { letter: "C" })))])]) : _vm._e()]) : _vm._e();
      }), 0)]) : _vm._e(), groupKey === "tablet" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview-header" }, [_c("span", { staticClass: "pw-element-preview-header-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.tablet")))])]) : _vm._e(), groupKey === "tablet" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview pw-nav-preview", style: _vm.navPreviewBarStyle("tablet") }, [_vm.navPreviewLogo("tablet") ? _c("div", { staticClass: "pw-nav-preview-logo", style: _vm.navPreviewLogoStyle("tablet") }, [_c("div", { style: { height: _vm.navPreviewLogoSvgHeight("tablet") }, domProps: { "innerHTML": _vm._s(_vm.navPreviewLogo("tablet")) } })]) : _vm._e(), _c("div", { staticClass: "pw-nav-preview-items", style: _vm.navPreviewItemsWrapStyle("tablet") }, _vm._l([{ t: _vm.$t("prw.preview.nav.home"), fly: false, home: true }, { t: _vm.$t("prw.preview.nav.about"), fly: false }, { t: _vm.$t("prw.preview.nav.services"), fly: true, flyout: "t-services" }, { t: _vm.$t("prw.preview.nav.portfolio"), fly: true, flyout: "t-portfolio" }, { t: _vm.$t("prw.preview.nav.contact"), fly: false }], function(item, idx) {
        return !item.home || (_vm.navGet("home-tablet") || _vm.navDef("tablet", "home-tablet")) === "true" ? _c("span", { key: idx, staticClass: "pw-nav-preview-item", style: _vm.navPreviewItemStyle("tablet") }, [_c("span", { staticStyle: { "cursor": "pointer", "display": "flex", "align-items": "center", "gap": "var(--spacing-1)" }, on: { "click": function($event) {
          $event.stopPropagation();
          _vm.openFlyout = _vm.openFlyout === item.flyout ? null : item.flyout;
        } } }, [_vm._v(_vm._s(item.t)), item.fly ? _c("span", { staticClass: "pw-nav-preview-flyout-icon", style: { color: _vm.navPreviewTextColor("tablet") }, domProps: { "innerHTML": _vm._s(_vm.navFlyoutIconPath()) } }) : _vm._e()]), item.flyout && _vm.openFlyout === item.flyout ? _c("div", { staticClass: "pw-nav-preview-flyout", style: _vm.navPreviewFlyoutStyle() }, [_c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v(_vm._s(_vm.$t("prw.preview.nav.submenu", { letter: "A" })))]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemHoverStyle() }, [_vm._v(_vm._s(_vm.$t("prw.preview.nav.submenu", { letter: "B" })))]), _c("div", { staticClass: "pw-nav-preview-flyout-item", style: _vm.navPreviewFlyoutItemStyle() }, [_vm._v(_vm._s(_vm.$t("prw.preview.nav.submenu", { letter: "C" })))])]) : _vm._e()]) : _vm._e();
      }), 0)]) : _vm._e(), groupKey === "mobile" && !_vm.hidePreview ? _c("div", { staticClass: "pw-element-preview-header" }, [_c("span", { staticClass: "pw-element-preview-header-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.mobile")))])]) : _vm._e(), groupKey === "mobile" && !_vm.hidePreview ? _c("div", { staticClass: "pw-nav-preview-mobile" }, [_c("div", { staticClass: "pw-nav-preview-mobile-bar", style: _vm.mobileBarStyle() }, [_vm.navPreviewLogo("mobile") ? _c("div", { style: { height: _vm.navPreviewLogoSvgHeight("mobile") }, domProps: { "innerHTML": _vm._s(_vm.navPreviewLogo("mobile")) } }) : _vm._e(), _c("svg", { style: { fill: _vm.mobileColorField("mobile-title-color", "mobile-title-textcolor") }, attrs: { "viewBox": "0 0 24 24", "width": "20", "height": "20" } }, [_c("path", { attrs: { "d": "M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" } })])]), _c("div", { staticClass: "pw-nav-preview-mobile-menu" }, _vm._l([{ t: _vm.$t("prw.preview.nav.home"), l2: false, active: false, home: true }, { t: _vm.$t("prw.preview.nav.about"), l2: false, active: false }, { t: _vm.$t("prw.preview.nav.services"), l2: true, active: true }, { t: _vm.$t("prw.preview.nav.portfolio"), l2: false, active: false }, { t: _vm.$t("prw.preview.nav.contact"), l2: false, active: false }], function(item, idx) {
        return !item.home || (_vm.navGet("home-mobile") || _vm.navDef("mobile", "home-mobile")) === "true" ? _c("div", { key: idx }, [_c("div", { staticClass: "pw-nav-preview-mobile-l1", class: { "pw-mobile-border": idx > 0 }, style: _vm.mobileL1Style(item.active) }, [_vm._v(" " + _vm._s(item.t) + " ")]), item.l2 ? _vm._l([{ t: _vm.$t("prw.preview.nav.submenu", { letter: "A" }), active: false }, { t: _vm.$t("prw.preview.nav.submenu", { letter: "B" }), active: true }, { t: _vm.$t("prw.preview.nav.submenu", { letter: "C" }), active: false }], function(sub, sIdx) {
          return _c("div", { key: "s" + sIdx, staticClass: "pw-nav-preview-mobile-l2", class: { "pw-mobile-border-l2": true }, style: _vm.mobileL2Style(sub.active) }, [_vm._v(" " + _vm._s(sub.t) + " ")]);
        }) : _vm._e()], 2) : _vm._e();
      }), 0)]) : _vm._e(), _vm._l(_vm.groupedFields(group), function(fieldGroup, gIdx) {
        return !_vm.showPreview ? [fieldGroup.isLabel ? _c("div", { key: "gl-" + gIdx, staticClass: "pw-nav-label" }, [_vm._v(" " + _vm._s(fieldGroup.labelText) + " ")]) : [fieldGroup.header && !_vm.isCornerGroup(fieldGroup) ? _c("div", { key: "gh-" + gIdx, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels", class: "pw-group-type-" + fieldGroup.fieldType }, _vm._l(fieldGroup.header, function(label) {
          return _c("span", { key: label, staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t(label) || label))])]);
        }), 0)]) : _vm._e(), _vm._l(fieldGroup.fields, function(field, fIdx) {
          return [_c("div", { key: "gf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: { "pw-dual-first": field.isTight, "pw-dual-next": field.isTightNext }, attrs: { "data-guide": _vm.guideVars.includes(field.varName) ? "margin" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(field.label) } })]), _c("div", { staticClass: "pw-field-row-options", class: [fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "", { "pw-corner-grid": _vm.isCorners(field.def) }] }, [field.def.type === "visibility" ? _c("button", { staticClass: "pw-tab-visibility", attrs: { "type": "button" }, on: { "click": function($event) {
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
            return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getQuadValue(field.varName, idx) }, attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || val) }, on: { "change": function($event) {
              return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit)))]) : _vm._e()]);
          }) : field.type === "responsive" ? _vm._l(["default", "lg", "xl"], function(bp) {
            return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getResponsiveOverride(field.varName, bp) }, attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "change": function($event) {
              return _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit);
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit)))]) : _vm._e()]);
          }) : field.def.unit !== void 0 ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(field.varName) }, attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(field.varName) || field.def.value) }, on: { "change": function($event) {
            return _vm.setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit);
          } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit)))]) : _vm._e()])] : field.def.type === "svg" ? [_vm.getOverrideValue(field.varName) ? [_c("label", { staticClass: "pw-svg-preview" }, [_c("div", { staticClass: "pw-svg-preview-checker", domProps: { "innerHTML": _vm._s(_vm.getOverrideValue(field.varName)) } }), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".svg" }, on: { "change": function($event) {
            return _vm.onSvgFileUpload(field.varName, $event, field.def.value);
          } } })]), _vm.dependentField(field.varName) ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-group-column-label", staticStyle: { "margin-right": "var(--spacing-2)" } }, [_vm._v(_vm._s(_vm.$t("pw.field.height.label")))]), _c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getOverrideValue(_vm.dependentField(field.varName).varName) }, attrs: { "type": "text", "inputmode": "decimal", "step": _vm.dependentField(field.varName).def.step || 0.1, "min": _vm.dependentField(field.varName).def.min, "max": _vm.dependentField(field.varName).def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(_vm.dependentField(field.varName).varName) || _vm.dependentField(field.varName).def.value) }, on: { "change": function($event) {
            _vm.setUnitValue(_vm.dependentField(field.varName).varName, $event.target.value, _vm.dependentField(field.varName).def.value, _vm.dependentField(field.varName).def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(_vm.dependentField(field.varName).def.unit))])]), _vm.dependentField(field.varName).def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(_vm.dependentField(field.varName).varName) || _vm.dependentField(field.varName).def.value, _vm.dependentField(field.varName).def.unit)))]) : _vm._e()])] : _vm._e()] : _c("label", { staticClass: "pw-svg-upload-btn" }, [_c("k-icon", { attrs: { "type": "upload" } }), _vm._v(" " + _vm._s(_vm.$t("prw.label.upload-svg")) + " "), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".svg" }, on: { "change": function($event) {
            return _vm.onSvgFileUpload(field.varName, $event, field.def.value);
          } } })], 1)] : _c("input", { staticClass: "pw-element-input", attrs: { "type": "text", "placeholder": field.def.value }, domProps: { "value": _vm.getOverrideValue(field.varName) }, on: { "input": function($event) {
            return _vm.setValue(field.varName, $event.target.value, field.def.value);
          } } })], 2)])]), field.def.type === "svg" && _vm.getOverrideValue(field.varName) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.remove"), "icon": "remove", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
            return _vm.removeSvg(field.varName);
          } } }) : field.def.type !== "svg" && _vm.hasFieldOverride(field.varName, false) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
            return _vm.resetNavField(field.varName, false, field.label);
          } } }) : _vm._e()], 1)];
        }), fieldGroup.header ? _c("div", { key: "ge-" + gIdx, staticClass: "pw-group-end" }) : _vm._e()]] : _vm._e();
      }), group.colors && !_vm.showPreview ? [_vm.hasColors(group) && !_vm.theme ? _c("div", { staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-theme-color" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.default")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant2")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant3")))])])])]) : _vm._e(), _vm._l(group.colors, function(colorVal, varName, index) {
        return _vm.colorShown(varName) && !(_vm.theme && _vm.isStateColor(varName, group.colors)) ? _c("div", { key: "color-" + varName, staticClass: "pw-field-row", class: {
          "pw-dual-first": _vm.isFollowedByColorState(group.colors, index),
          "pw-dual-next": varName.endsWith("-hover") || varName.endsWith("-active")
        } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(_vm.propLabel(varName)) } })]), _vm.theme && _vm.stateColors(varName, group.colors).length > 1 ? _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-state-grid" }, _vm._l(_vm.stateColors(varName, group.colors), function(stateColor) {
          return _c("span", { key: stateColor.varName, staticClass: "pw-state-cell" }, [stateColor.state !== "normal" ? _c("span", { staticClass: "pw-state-pill", class: "pw-state-" + stateColor.state }, [_vm._v(":" + _vm._s(_vm.$t("prw.state." + stateColor.state)))]) : _vm._e(), _c("pw-color-field-row", { attrs: { "group": _vm.theme, "var-name": stateColor.varName, "default-value": stateColor.colorVal[_vm.theme] || "", "override-value": _vm.getColorOverrideValue(_vm.theme, stateColor.varName) }, on: { "update:value": function($event) {
            return _vm.setColorValue(_vm.theme, stateColor.varName, $event, stateColor.colorVal[_vm.theme] || "");
          } } })], 1);
        }), 0)]) : _c("div", { staticClass: "pw-field-row-options", class: { "pw-group-type-theme-color": !_vm.theme } }, _vm._l(_vm.theme ? [_vm.theme] : ["default", "variant", "variant2", "variant3"], function(t) {
          return _c("pw-color-field-row", { key: t, attrs: { "group": t, "var-name": varName, "default-value": colorVal[t] || "", "override-value": _vm.getColorOverrideValue(t, varName) }, on: { "update:value": function($event) {
            return _vm.setColorValue(t, varName, $event, colorVal[t] || "");
          } } });
        }), 1)])]), _vm.hasFieldOverride(varName, true) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
          _vm.resetNavField(varName, true, _vm.propLabel(varName));
        } } }) : _vm._e()], 1) : _vm._e();
      }), _c("div", { staticClass: "pw-group-end" })] : _vm._e()], 2)])], 1);
    }), 0);
  };
  var _sfc_staticRenderFns$6 = [];
  _sfc_render$6._withStripped = true;
  var __component__$6 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$6,
    _sfc_render$6,
    _sfc_staticRenderFns$6
  );
  __component__$6.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalNavigation.vue";
  const GlobalNavigation = __component__$6.exports;
  const _sfc_main$5 = {
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
        const label = isLast ? this.$t("prw.fonts.delete.font", { family: font.family }) : this.$t("prw.fonts.delete.file", { file: file.src });
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
  var _sfc_render$5 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-font-manager" }, [_vm.mode === "all" || _vm.mode === "installed" ? _c("section", { staticClass: "pw-element-section" }, [_vm.mode === "all" ? _c("div", { staticClass: "pw-section-header pw-font-header" }, [_c("span", { staticClass: "pw-section-title" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.installed") || "Installed Fonts"))]), _c("k-button", { attrs: { "text": _vm.showAddForm ? _vm.$t("cancel") : _vm.$t("prw.fonts.add") || "Add Font", "icon": _vm.showAddForm ? "cancel" : "add", "size": "xs" }, on: { "click": function($event) {
      _vm.showAddForm = !_vm.showAddForm;
      if (!_vm.showAddForm) _vm.resetAddForm();
    } } })], 1) : _vm._e(), _c("div", { staticClass: "pw-element-list" }, [_vm._l(_vm.allFonts, function(font, key) {
      return _vm._l(font.files, function(file, fIdx) {
        return _c("div", { key: key + "-" + fIdx, staticClass: "pw-field-row", class: { "pw-dual-first": fIdx === 0 && font.files.length > 1, "pw-dual-next": fIdx > 0 } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-font-label-bold" }, [_vm._v(_vm._s(font.family))]), _c("span", { staticClass: "pw-quad-label" }, [_vm._v(_vm._s(_vm.categoryLabel(font.category)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-font-file-name" }, [_vm._v(_vm._s(file.src) + " "), _c("span", { staticClass: "pw-font-weight-label" }, [_vm._v(_vm._s(font.italic && font.files.length === 1 ? "normal, italic" : file.style) + ", " + _vm._s(_vm.formatWeight(file.weight)))])]), !font.builtin ? _c("button", { staticClass: "pw-font-delete", attrs: { "type": "button" }, on: { "click": function($event) {
          return _vm.deleteFontFile(key, fIdx, file);
        } } }, [_vm._v("×")]) : _vm._e()])])])]);
      });
    })], 2)]) : _vm._e(), _vm.mode === "add" || _vm.mode === "all" && _vm.showAddForm ? _c("section", { staticClass: "pw-element-section" }, [_vm.mode === "all" ? _c("div", { staticClass: "pw-section-header" }, [_c("span", { staticClass: "pw-section-toggle" }, [_c("span", [_vm._v(_vm._s(_vm.$t("prw.fonts.add") || "Add Font"))])])]) : _vm._e(), _c("div", { staticClass: "pw-element-list" }, [_c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.file")) + " *")])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("label", { staticClass: "pw-font-upload-btn" }, [_c("k-icon", { attrs: { "type": "upload" } }), _vm._v(" " + _vm._s(_vm.$t("prw.fonts.upload")) + " "), _c("input", { staticStyle: { "display": "none" }, attrs: { "type": "file", "accept": ".woff2" }, on: { "change": _vm.onFileSelect } })], 1), _vm.newFont.files.length ? _c("span", { staticClass: "pw-font-file-selected" }, [_vm._v(_vm._s(_vm.newFont.files[0].name))]) : _vm._e()])])])]), _c("div", { staticClass: "pw-font-help", domProps: { "innerHTML": _vm._s(_vm.$t("prw.fonts.uploadHelp")) } }), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.family")) + " *")])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.newFont.family, expression: "newFont.family" }], staticClass: "pw-element-input pw-font-name-input", attrs: { "type": "text", "placeholder": _vm.$t("prw.fonts.familyPlaceholder") }, domProps: { "value": _vm.newFont.family }, on: { "input": function($event) {
      if ($event.target.composing) return;
      _vm.$set(_vm.newFont, "family", $event.target.value);
    } } })])])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.nameHelp") || 'Enter the exact font family name as specified by the font provider (e.g. "Roboto", "Open Sans", "Playfair Display").') + " ")]), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.category")) + " *")])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.newFont.category, "options": _vm.categoryOptions, "grow": false, "required": true }, on: { "input": function($event) {
      _vm.newFont.category = $event;
    } } })], 1)])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.categoryHelp") || "Select the font category. This is used as CSS fallback (e.g. sans-serif, serif) when the font is not yet loaded.") + " ")]), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.italic")) + " *")])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.newFont.italic === null ? "" : _vm.newFont.italic ? "yes" : "no", "options": [{ value: "yes", text: _vm.$t("pw.option.yes") }, { value: "no", text: _vm.$t("pw.option.no") }], "grow": false, "required": true }, on: { "input": function($event) {
      _vm.newFont.italic = $event === "yes";
    } } }), _vm.newFont.italic === false ? [_c("span", { staticClass: "pw-font-inline-label" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.style")))]), _c("k-toggles-input", { attrs: { "value": _vm.newFont.style, "options": [{ value: "normal", text: _vm.$t("pw.option.normal") }, { value: "italic", text: _vm.$t("pw.option.italic") }], "grow": false, "required": true }, on: { "input": function($event) {
      _vm.newFont.style = $event;
    } } })] : _vm._e()], 2)])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.italicHelp") || "Enable if the font includes italic styles. Some variable fonts include italic in a separate file, others have it built-in.") + " ")]), _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.fonts.weight")) + " *")])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("div", { staticClass: "pw-weight-toggles" }, _vm._l(["100", "200", "300", "400", "500", "600", "700", "800", "900"], function(w) {
      return _c("button", { key: w, staticClass: "pw-weight-toggle", class: { "is-active": _vm.newFont.weights.includes(w), "is-in-range": _vm.isInWeightRange(w) }, attrs: { "type": "button" }, on: { "click": function($event) {
        return _vm.toggleWeight(w);
      } } }, [_vm._v(_vm._s(w))]);
    }), 0)])])])]), _c("div", { staticClass: "pw-font-help" }, [_vm._v(" " + _vm._s(_vm.$t("prw.fonts.weightHelp") || "Select one weight for static fonts, or multiple for variable fonts (e.g. 100–900).") + " ")]), _c("div", { staticClass: "pw-font-actions" }, [_c("k-button", { attrs: { "disabled": !_vm.canAddFont, "text": _vm.$t("prw.fonts.add"), "icon": "check", "theme": "positive", "variant": "filled", "size": "sm" }, on: { "click": _vm.addFont } })], 1)])]) : _vm._e()]);
  };
  var _sfc_staticRenderFns$5 = [];
  _sfc_render$5._withStripped = true;
  var __component__$5 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$5,
    _sfc_render$5,
    _sfc_staticRenderFns$5
  );
  __component__$5.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalFontManager.vue";
  const GlobalFontManager = __component__$5.exports;
  const _sfc_main$4 = {
    directives: { "pw-autosize": autosize },
    props: {
      defaults: { type: Object, default: () => ({}) },
      overrides: { type: Object, default: () => ({}) },
      groupLabels: { type: Object, default: null },
      hideSectionHeaders: { type: Boolean, default: false },
      showOnly: { type: Array, default: null },
      // own labels for some rows (varName → text), e.g. in a card that names the part
      labels: { type: Object, default: () => ({}) },
      // one theme (e.g. "variant"): the colour rows show only its value
      theme: { type: String, default: null },
      // one breakpoint (default / lg / xl): responsive rows show only its
      // value plus the device switch (.sync)
      bp: { type: String, default: null }
    },
    data() {
      return { open: {} };
    },
    computed: {
      groups() {
        const out = {};
        for (const [k, v] of Object.entries(this.defaults || {})) {
          if (!v || typeof v !== "object") continue;
          const hasVars = !!v.vars;
          const hasColors = !!v.colors;
          if (!hasVars && !hasColors) continue;
          let filteredVars = v.vars || {};
          let filteredColors = v.colors || {};
          if (Array.isArray(this.showOnly)) {
            filteredVars = {};
            for (const [vn, def] of Object.entries(v.vars || {})) {
              if (this.showOnly.includes(vn)) filteredVars[vn] = def;
            }
            filteredColors = {};
            for (const vn of this.showOnly) {
              if ((v.colors || {})[vn]) filteredColors[vn] = v.colors[vn];
            }
          }
          if (Object.keys(filteredVars).length === 0 && Object.keys(filteredColors).length === 0) continue;
          out[k] = { ...v, vars: filteredVars, colors: filteredColors };
        }
        return out;
      }
    },
    methods: {
      // four corner values (top-left, top-right, bottom-left, bottom-right):
      // shown as a 2×2 grid in the cell, like the corners themselves
      isCorners(def) {
        const names = def && (def.suffixes || def.labels) || [];
        return Array.isArray(names) && names.length === 4 && names.some((n) => String(n).includes("top-left"));
      },
      bpIcon(bp) {
        return { default: "mobile", lg: "tablet", xl: "display" }[bp];
      },
      bpLabel(bp) {
        return { default: this.$t("prw.label.mobile"), lg: this.$t("prw.label.tablet"), xl: this.$t("prw.label.desktop") }[bp];
      },
      visibleThemes(themes) {
        if (!this.theme) return themes;
        return this.theme in themes ? { [this.theme]: themes[this.theme] } : {};
      },
      toggle(key) {
        this.$set(this.open, key, !this.isOpen(key));
      },
      isOpen(key) {
        return this.open[key] !== false;
      },
      groupLabel(key) {
        if (this.groupLabels && this.groupLabels[key]) return this.groupLabels[key];
        const t = this.$t("prw.valuegroup." + key);
        if (t && t !== "prw.valuegroup." + key) return t;
        return key.charAt(0).toUpperCase() + key.slice(1);
      },
      varLabel(varName) {
        if (this.labels[varName]) return this.labels[varName];
        for (const group of Object.values(this.defaults || {})) {
          const def = group && (group.vars && group.vars[varName] || group.colors && group.colors[varName]);
          if (def && def.label) {
            const own = this.$t(def.label);
            if (own && own !== def.label) return own;
          }
        }
        const t = this.$t("prw.prop." + varName);
        if (t && t !== "prw.prop." + varName) return t;
        return varName.replace(/^item-/, "").replace(/-/g, " ");
      },
      stripUnit(val, unit) {
        if (val === void 0 || val === null || val === "") return "";
        const v = String(val);
        if (unit) return v.replace(new RegExp(unit + "$"), "");
        return v.replace(/(rem|em|px|%|s)$/, "");
      },
      parseNum(val) {
        const n = parseFloat(String(val).replace(",", "."));
        return isNaN(n) ? null : n;
      },
      // px of a value; a line height without unit is a factor of the row's
      // font size (e.g. item-title-line-height × item-title-size)
      toPx(val, unit, varName, bp) {
        if (!val) return "";
        const n = this.parseNum(val);
        if (n === null) return "";
        if (!unit && varName && varName.endsWith("-line-height")) {
          const size2 = this.fontSizePx(varName.replace(/line-height$/, ""), bp);
          return size2 ? Math.round(n * size2) + "px" : "";
        }
        const u = unit || (String(val).match(/(rem|em|px|%)$/) || [, ""])[1];
        if (u === "rem" || u === "em") return Math.round(n * 16) + "px";
        if (u === "px") return Math.round(n) + "px";
        return "";
      },
      // font size in px next to a line height ("item-title-" → item-title-size
      // or item-title-font-size), at the same breakpoint
      fontSizePx(prefix, bp) {
        for (const group of Object.values(this.defaults || {})) {
          const vars = group && group.vars || {};
          for (const name of [prefix + "size", prefix + "font-size"]) {
            const def = vars[name];
            if (!def) continue;
            const val = this.isResponsive(def) ? this.responsiveAt(name, bp || "default") || def[bp || "default"] : this.getOverride(name) || def.value;
            const px = this.toPx(val, def.unit, name, bp);
            return px ? parseFloat(px) : null;
          }
        }
        return null;
      },
      showCalculator(unit) {
        return unit !== "px";
      },
      getOverride(varName) {
        return this.overrides[varName];
      },
      overrideAt(varName, idx) {
        const v = this.overrides[varName];
        return Array.isArray(v) ? v[idx] : void 0;
      },
      getThemeOverride(theme, varName) {
        const t = this.overrides[theme];
        return t && typeof t === "object" ? t[varName] : void 0;
      },
      setThemeColor(theme, varName, value, defaultVal) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        if (!next[theme] || typeof next[theme] !== "object") next[theme] = {};
        if (value === "" || value === defaultVal) {
          delete next[theme][varName];
          if (Object.keys(next[theme]).length === 0) delete next[theme];
        } else {
          next[theme][varName] = value;
        }
        this.$emit("update:overrides", next);
      },
      setSingle(varName, value, defaultVal) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        if (value === "" || value === defaultVal) delete next[varName];
        else next[varName] = value;
        this.$emit("update:overrides", next);
      },
      setSingleUnit(varName, value, defaultVal, unit) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        if (value === "") {
          delete next[varName];
        } else {
          const num = this.parseNum(value);
          if (num === null) return;
          const composed = num + (unit || "");
          if (composed === defaultVal) delete next[varName];
          else next[varName] = composed;
        }
        this.$emit("update:overrides", next);
      },
      hasVarOverride(varName) {
        return this.overrides[varName] !== void 0;
      },
      hasColorOverride(varName) {
        for (const theme of ["default", "variant", "variant2", "variant3"]) {
          const t = this.overrides[theme];
          if (t && typeof t === "object" && t[varName] !== void 0) return true;
        }
        return false;
      },
      resetVar(varName) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        delete next[varName];
        this.$emit("update:overrides", next);
      },
      resetColor(varName) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        for (const theme of ["default", "variant", "variant2", "variant3"]) {
          if (next[theme] && typeof next[theme] === "object") {
            delete next[theme][varName];
            if (Object.keys(next[theme]).length === 0) delete next[theme];
          }
        }
        this.$emit("update:overrides", next);
      },
      isResponsive(def) {
        return !!def && typeof def === "object" && def.value === void 0 && def.default !== void 0 && def.lg !== void 0;
      },
      responsiveAt(varName, bp) {
        const v = this.overrides[varName];
        return v && typeof v === "object" && !Array.isArray(v) ? v[bp] : void 0;
      },
      setResponsive(varName, bp, value, def) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        const current = next[varName] && typeof next[varName] === "object" && !Array.isArray(next[varName]) ? next[varName] : {};
        if (value === "") {
          delete current[bp];
        } else {
          const num = this.parseNum(value);
          if (num === null) return;
          const composed = num + (def.unit || "");
          if (composed === def[bp]) delete current[bp];
          else current[bp] = composed;
        }
        if (Object.keys(current).length === 0) delete next[varName];
        else next[varName] = current;
        this.$emit("update:overrides", next);
      },
      setMulti(varName, idx, value, defaultArr, unit) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        const current = Array.isArray(next[varName]) ? [...next[varName]] : [...defaultArr];
        if (value === "") {
          current[idx] = defaultArr[idx];
        } else {
          const num = this.parseNum(value);
          if (num === null) return;
          current[idx] = num + (unit || "");
        }
        const allDefault = current.every((v, i) => v === defaultArr[i]);
        if (allDefault) delete next[varName];
        else next[varName] = current;
        this.$emit("update:overrides", next);
      }
    }
  };
  var _sfc_render$4 = function render() {
    var _vm = this, _c = _vm._self._c;
    return Object.keys(_vm.groups).length ? _c("div", _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [!_vm.hideSectionHeaders ? _c("div", { staticClass: "pw-section-header" }, [_c("span", { staticClass: "pw-tab-visibility pw-tab-visibility-static" }, [_c("k-icon", { attrs: { "type": "settings" } })], 1), _c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]) : _vm._e(), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isOpen(groupKey), expression: "isOpen(groupKey)" }], staticClass: "pw-element-list" }, [!_vm.theme && Object.keys(group.colors || {}).length ? _c("div", { staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-theme-color" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.default") || "Default"))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant") || "Variant"))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant2") || "Variant 2"))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant3") || "Variant 3"))])])])]) : _vm._e(), _vm._l(group.colors, function(themes, varName) {
        return _c("div", { key: "color-" + varName, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(_vm.varLabel(varName)) } })]), _c("div", { staticClass: "pw-field-row-options", class: { "pw-group-type-theme-color": !_vm.theme } }, _vm._l(_vm.visibleThemes(themes), function(themeValue, themeKey) {
          return _c("span", { key: themeKey, staticClass: "pw-element-field" }, [_c("pw-color-field-row", { attrs: { "group": "block-values-" + themeKey, "var-name": varName, "default-value": themeValue, "override-value": _vm.getThemeOverride(themeKey, varName) || "" }, on: { "update:value": function($event) {
            return _vm.setThemeColor(themeKey, varName, $event || "", themeValue);
          } } })], 1);
        }), 0)]), _vm.hasColorOverride(varName) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
          return _vm.resetColor(varName);
        } } }) : _vm._e()], 1)]);
      }), _vm._l(group.vars, function(def, varName) {
        return [_vm.isResponsive(def) && !_vm.bp ? _c("div", { key: "rh-" + varName, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-responsive" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.mobile")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.tablet")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.desktop")))])])])]) : _vm._e(), _c("div", { key: varName, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(_vm.varLabel(varName)) } })]), _c("div", { staticClass: "pw-field-row-options", class: { "pw-group-type-responsive": _vm.isResponsive(def) && !_vm.bp, "pw-corner-grid": _vm.isCorners(def) } }, [def.type === "color" ? [_c("pw-color-field-row", { attrs: { "group": "block-values", "var-name": varName, "default-value": def.value, "override-value": _vm.getOverride(varName) || "" }, on: { "update:value": function($event) {
          return _vm.setSingle(varName, $event || "", def.value);
        } } })] : _vm.isResponsive(def) ? [_vm._l(_vm.bp ? [_vm.bp] : ["default", "lg", "xl"], function(bp) {
          return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(def.unit), "is-default": !_vm.responsiveAt(varName, bp) }, attrs: { "type": "text", "inputmode": "decimal" }, domProps: { "value": _vm.stripUnit(_vm.responsiveAt(varName, bp) || def[bp], def.unit) }, on: { "change": function($event) {
            return _vm.setResponsive(varName, bp, $event.target.value, def);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))])]), _vm.showCalculator(def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.responsiveAt(varName, bp) || def[bp], def.unit, varName, bp)))]) : _vm._e()]);
        }), _vm.bp ? _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
          return _c("button", { key: "sw-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.bpLabel(b), "aria-label": _vm.bpLabel(b), "aria-pressed": _vm.bp === b ? "true" : "false" }, on: { "click": function($event) {
            return _vm.$emit("update:bp", b);
          } } }, [_c("k-icon", { attrs: { "type": _vm.bpIcon(b) } })], 1);
        }), 0) : _vm._e()] : Array.isArray(def.value) && def.suffixes ? _vm._l(def.suffixes, function(suffix, idx) {
          return _c("span", { key: suffix, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(def.unit), "is-default": !_vm.overrideAt(varName, idx) }, attrs: { "type": "text", "inputmode": "decimal" }, domProps: { "value": _vm.stripUnit(_vm.overrideAt(varName, idx) || def.value[idx], def.unit) }, on: { "change": function($event) {
            return _vm.setMulti(varName, idx, $event.target.value, def.value, def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))])]), _vm.showCalculator(def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.overrideAt(varName, idx) || def.value[idx], def.unit)))]) : _vm._e()]);
        }) : Array.isArray(def.value) ? _vm._l(def.value, function(_, idx) {
          return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(def.unit) }, attrs: { "type": "text", "inputmode": "decimal" }, domProps: { "value": _vm.stripUnit(_vm.overrideAt(varName, idx) || def.value[idx], def.unit) }, on: { "change": function($event) {
            return _vm.setMulti(varName, idx, $event.target.value, def.value, def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))])]), _vm.showCalculator(def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.overrideAt(varName, idx) || def.value[idx], def.unit)))]) : _vm._e()]);
        }) : [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(def.unit), "is-default": !_vm.getOverride(varName) }, attrs: { "type": "text", "inputmode": "decimal" }, domProps: { "value": _vm.stripUnit(_vm.getOverride(varName) || def.value, def.unit) }, on: { "change": function($event) {
          return _vm.setSingleUnit(varName, $event.target.value, def.value, def.unit);
        } } }), def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))]) : _vm._e()]), _vm.showCalculator(def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverride(varName) || def.value, def.unit, varName)))]) : _vm._e()])]], 2)]), _vm.hasVarOverride(varName) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
          return _vm.resetVar(varName);
        } } }) : _vm._e()], 1)])];
      })], 2)])], 1);
    }), 0) : _vm._e();
  };
  var _sfc_staticRenderFns$4 = [];
  _sfc_render$4._withStripped = true;
  var __component__$4 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$4,
    _sfc_render$4,
    _sfc_staticRenderFns$4
  );
  __component__$4.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BlockValues.vue";
  const BlockValues = __component__$4.exports;
  const _sfc_main$3 = {
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
        const stepsHtml = [
          "prw.setup.step.clean",
          "prw.setup.step.directories",
          "prw.setup.step.files",
          "prw.setup.step.projectbuilder",
          "prw.setup.step.npmBuild",
          "prw.setup.step.finalize"
        ].map((k) => "<li>" + (this.$t(k) || k) + "</li>").join("");
        this.$panel.dialog.open({
          component: "k-text-dialog",
          props: {
            text: '<div style="text-align:center;padding:var(--spacing-6)"><div class="pw-setup-spinner" style="width:32px;height:32px;border:3px solid var(--color-gray-300);border-top-color:var(--color-blue-600);border-radius:50%;animation:pw-spin 0.6s linear infinite;margin:0 auto var(--spacing-4)"></div><p style="margin-bottom:var(--spacing-2)">' + this.$t("prw.setup.step.running") + '</p><p style="color:var(--color-text-dimmed);font-size:var(--text-xs);margin-bottom:var(--spacing-4)">' + (this.$t("prw.setup.step.hint") || "This may take 30–60 seconds. Please don't close this tab.") + '</p><ul style="text-align:left;display:inline-block;color:var(--color-text-dimmed);font-size:var(--text-xs);list-style:disc;padding-left:var(--spacing-4);margin:0">' + stepsHtml + "</ul></div><style>@keyframes pw-spin{to{transform:rotate(360deg)}}</style>",
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
  var _sfc_render$3 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-panel-inside", { staticClass: "pw-wizard pw-setup" });
  };
  var _sfc_staticRenderFns$3 = [];
  _sfc_render$3._withStripped = true;
  var __component__$3 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$3,
    _sfc_render$3,
    _sfc_staticRenderFns$3
  );
  __component__$3.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/SetupWizard.vue";
  const SetupWizard = __component__$3.exports;
  const _sfc_main$2 = {
    props: {
      to: { type: String, required: true }
    },
    mounted() {
      var _a;
      (_a = document.querySelector(this.to)) == null ? void 0 : _a.appendChild(this.$el);
    },
    beforeDestroy() {
      this.$el.remove();
    }
  };
  var _sfc_render$2 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-portal" }, [_vm._t("default")], 2);
  };
  var _sfc_staticRenderFns$2 = [];
  _sfc_render$2._withStripped = true;
  var __component__$2 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$2,
    _sfc_render$2,
    _sfc_staticRenderFns$2
  );
  __component__$2.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/Portal.vue";
  const Portal = __component__$2.exports;
  const GAPS = {
    "tagline>items": "1rem",
    "heading>items": "1.2rem",
    "editor>items": "2rem",
    "tagline>heading": "0.5rem",
    "tagline>editor": "0.3rem",
    "tagline>buttons": "1rem",
    "heading>editor": "0.5rem",
    "heading>buttons": "1.2rem",
    "editor>buttons": "1.2rem"
  };
  const GRID_BP = { default: null, lg: "lg", xl: "xl" };
  const GRID_GAP = { lg: 48 / 1024 * 100 + "%", xl: 64 / 1280 * 100 + "%" };
  const _sfc_main$1 = {
    props: {
      // the block (pwtext, pwsteplist …): decides the parts after the fields
      blockType: { type: String, default: "" },
      config: { type: Object, default: () => ({}) },
      overrides: { type: Object, default: () => ({}) },
      elementDefaults: { type: Object, default: () => ({}) },
      elementOverrides: { type: Object, default: () => ({}) },
      globalDefaults: { type: Object, default: () => ({}) },
      globalOverrides: { type: Object, default: () => ({}) },
      fontDefaults: { type: Object, default: () => ({}) },
      fontOverrides: { type: Object, default: () => ({}) },
      fonts: { type: Object, default: () => ({}) },
      bodyDefaultFont: { type: String, default: "Inter" },
      bodyBackground: { type: String, default: "" },
      themes: { type: Array, default: () => ["default"] },
      // device shown: the one chosen in the rows (default / lg / xl)
      bp: { type: String, default: "default" },
      // guides on/off (shared with the settings rows, .sync)
      guides: { type: Boolean, default: false },
      // the block's own values (items: sizes, gaps, colours) and their overrides
      valueDefaults: { type: Object, default: () => ({}) },
      valueOverrides: { type: Object, default: () => ({}) },
      // steplist: the item style to show (chosen in the design tab)
      stepStyle: { type: String, default: "" },
      // variant shown, shared with the colour cards (.sync); empty: the block's preset
      variant: { type: String, default: "" }
    },
    computed: {
      // the chosen variant (here or in the colour cards), else the block's preset
      currentTheme() {
        const chosen = this.variant || this.setting("style", "theme") || "default";
        return this.themes.includes(chosen) ? chosen : "default";
      },
      // fields shown in the order of the snippet (steplist: its items last)
      fields() {
        const fields = ["tagline", "heading", "editor", "buttons"].filter((f) => this.hasField(f));
        return this.isSteplist ? [...fields, "items"] : fields;
      },
      isSteplist() {
        return this.blockType === "pwsteplist";
      },
      // steplist: item style (default, centered, connected, minimal), number
      // alignment, the items' grid and their parts as in its CSS
      // steps shown in the preview
      stepCount() {
        return 2;
      },
      currentStepStyle() {
        return this.stepStyle || this.setting("style", "item-style") || "default";
      },
      stepItemsStyle() {
        const gap = this.itemValue("item-gap");
        const style = { marginTop: this.gapBefore("items") };
        if (!this.hasGrid) return style;
        const cols = this.currentStepStyle === "connected" ? 1 : Number(this.setting("layout", "columns-" + GRID_BP[this.bp])) || 1;
        return { ...style, display: "grid", gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))", gap, marginBottom: gap };
      },
      // the number's alignment of the shown style (centered: always centre)
      stepAlign() {
        if (this.currentStepStyle === "centered") return "center";
        const key = "item-number-align" + (this.currentStepStyle === "default" ? "" : "-" + this.currentStepStyle);
        return this.setting("layout", key) || "center";
      },
      stepItemStyle() {
        const centered = this.currentStepStyle === "centered";
        const align = this.stepAlign;
        return {
          display: "flex",
          flexDirection: centered ? "column" : "row",
          alignItems: centered || align === "center" ? "center" : this.currentStepStyle === "minimal" ? "baseline" : "flex-start",
          textAlign: centered ? "center" : null,
          gap: this.stepValue("item-content-gap"),
          marginBottom: this.hasGrid ? 0 : this.itemValue("item-gap")
        };
      },
      stepNumberStyle() {
        const size2 = this.stepValue("item-number-size");
        if (this.currentStepStyle === "minimal") {
          return { color: this.itemColor("item-number-background"), fontSize: this.stepValue("item-number-size"), fontWeight: 700, translate: "0 " + this.stepOffset };
        }
        const shape = this.setting("layout", "item-shape") || "round";
        const r = this.itemValue("item-radius") || [];
        const custom = Array.isArray(r) && r.length === 4 ? [r[0], r[1], r[3], r[2]].join(" ") : 0;
        return {
          flexShrink: 0,
          width: size2,
          height: size2,
          fontSize: "calc(" + size2 + " * 0.4)",
          fontWeight: 700,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          backgroundColor: this.itemColor("item-number-background"),
          color: this.itemColor("item-number-text"),
          borderRadius: { round: "50%", square: 0 }[shape] ?? custom,
          translate: "0 " + this.stepOffset
        };
      },
      // the number's fine vertical offset
      stepOffset() {
        if (this.stepAlign !== "top") return "0rem";
        return this.stepValue("item-number-offset") || "0rem";
      },
      // item title and text: heading at its "lg" step, text like the editor
      stepHeadingStyle() {
        return { ...this.typography("heading"), fontSize: this.sizeStep("heading", "lg"), color: this.itemColor("item-heading-text") };
      },
      stepTextStyle() {
        return { ...this.typography("editor"), marginTop: "0.2rem", color: this.itemColor("item-editor-text") };
      },
      sectionStyle() {
        const layout = (key) => this.setting("layout", key);
        const radius = this.globalValue("global-") || [];
        const corner = (key, idx) => layout("radius-" + key) === true ? radius[idx] || 0 : 0;
        return {
          backgroundColor: this.globalColor("block-background"),
          // global- values: top-left, top-right, bottom-left, bottom-right
          borderRadius: [corner("top-left", 0), corner("top-right", 1), corner("bottom-right", 3), corner("bottom-left", 2)].join(" ")
        };
      },
      // outer spacing (settings: margin-top / margin-bottom) in page colour
      blockStyle() {
        const margin = (key, name) => this.setting("settings", key) === true ? this.globalValue(name) || "0px" : "0px";
        const top = margin("margin-top", "global-margin-top");
        const bottom = margin("margin-bottom", "global-margin-bottom");
        return { paddingTop: top, paddingBottom: bottom };
      },
      hasGrid() {
        return !!GRID_BP[this.bp];
      },
      gridStyle() {
        if (!this.hasGrid) return { display: "block" };
        return {
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          columnGap: GRID_GAP[this.bp]
        };
      },
      // the grid item: its columns and the block's paddings (as in the frontend)
      itemStyle() {
        const layout = (key) => this.setting("layout", key);
        const pair = (name, which) => {
          const v = this.globalValue(name);
          return Array.isArray(v) ? v[which === "large" ? 1 : 0] : v;
        };
        const top = layout("padding-top");
        const bottom = layout("padding-bottom");
        const style = {
          paddingTop: top === "small" || top === "large" ? pair("global-padding-top", top) : 0,
          paddingBottom: bottom === "small" || bottom === "large" ? pair("global-padding-bottom", bottom) : 0,
          paddingLeft: layout("padding-left") === true ? this.globalValue("global-padding-left") : 0,
          paddingRight: layout("padding-right") === true ? this.globalValue("global-padding-right") : 0
        };
        if (this.hasGrid) {
          const gbp = GRID_BP[this.bp];
          const size2 = Number(this.setting("grid", "grid-size-" + gbp)) || 12;
          const offset = Number(this.setting("grid", "grid-offset-" + gbp)) || 0;
          style.gridColumn = offset + 1 + " / span " + Math.min(size2, 12 - offset);
        }
        return style;
      },
      buttonsStyle() {
        const align = this.preset("buttons", "align") || "left";
        return {
          display: "flex",
          justifyContent: { left: "flex-start", center: "center", right: "flex-end" }[align] || "flex-start",
          marginTop: this.gapBefore("buttons")
        };
      },
      buttonStyle() {
        var _a, _b, _c, _d, _e, _f, _g;
        const vars = ((_a = this.elementDefaults.button) == null ? void 0 : _a.vars) || {};
        const quad = (name) => {
          var _a2;
          const ov = (this.elementOverrides.global || {})[name];
          const v = Array.isArray(ov) ? ov : ((_a2 = vars[name]) == null ? void 0 : _a2.value) || [];
          return Array.isArray(v) ? v.join(" ") : v;
        };
        const color = (name) => this.elementColor("button", name);
        return {
          ...this.typography("button"),
          color: color("element-button-text"),
          backgroundColor: color("element-button-background"),
          border: ((this.elementOverrides.global || {})["button-border-width"] || ((_b = vars["button-border-width"]) == null ? void 0 : _b.value) || "1px") + " solid " + color("element-button-border"),
          boxShadow: ((_f = (_d = (_c = vars["button-shadow"]) == null ? void 0 : _c.generates) == null ? void 0 : _d["button-shadow"]) == null ? void 0 : _f[(this.elementOverrides.global || {})["button-shadow"] || ((_e = vars["button-shadow"]) == null ? void 0 : _e.value)]) || "none",
          padding: quad("button-padding"),
          // corners: square, round or the custom radii (button-shape)
          borderRadius: { square: "0", round: "999px" }[(this.elementOverrides.global || {})["button-shape"] || ((_g = vars["button-shape"]) == null ? void 0 : _g.value)] || quad("button-border-radius"),
          display: "inline-block"
        };
      }
    },
    methods: {
      // steplist "connected": the line through all numbers, from the first
      // number's centre to the last one's
      stepConnectorStyle(n) {
        const size2 = this.stepValue("item-number-size");
        const width = this.itemValue("item-connector-width");
        const offset = this.stepOffset;
        const centre = this.stepAlign === "center" ? "calc(50% + " + offset + ")" : "calc(" + size2 + " / 2 + " + offset + ")";
        return {
          left: "calc(" + size2 + " / 2 - " + width + " / 2)",
          width,
          top: n === 1 ? centre : 0,
          bottom: n === this.stepCount ? "calc(100% - " + centre + ")" : "calc(" + this.itemValue("item-gap") + " * -1)",
          background: this.itemColor("item-connector")
        };
      },
      // a value of the shown item style ("default": the plain name)
      stepValue(name) {
        const style = this.currentStepStyle;
        return this.itemValue(style === "default" ? name : name + "-" + style);
      },
      // a value of the block's own (item-gap, item-radius …): override, else the plugin's
      itemValue(name) {
        const ov = (this.valueOverrides || {})[name];
        if (ov !== void 0 && ov !== "") return ov;
        for (const group of Object.values(this.valueDefaults || {})) {
          if (group && group.vars && group.vars[name]) return group.vars[name].value;
        }
        return void 0;
      },
      itemColor(name) {
        const ov = ((this.valueOverrides || {})[this.currentTheme] || {})[name];
        if (ov) return ov;
        for (const group of Object.values(this.valueDefaults || {})) {
          if (group && group.colors && group.colors[name]) return group.colors[name][this.currentTheme] || "";
        }
        return "";
      },
      toggleGuides() {
        this.$emit("update:guides", !this.guides);
      },
      nested(obj, path) {
        return path.split(".").reduce((o, k) => o && o[k] !== void 0 ? o[k] : void 0, obj);
      },
      // a block setting (category field) default: override, else the plugin's
      setting(category, key) {
        const path = "settings.fields." + category + "." + key + ".default";
        const ov = this.nested(this.overrides || {}, path);
        return ov !== void 0 ? ov : this.nested(this.config.defaults || {}, path);
      },
      // a content field preset (align, sizes, …)
      preset(field, prop) {
        const path = "settings.fields.content." + field + "." + prop + ".default";
        const ov = this.nested(this.overrides || {}, path);
        return ov !== void 0 ? ov : this.nested(this.config.defaults || {}, path);
      },
      // a content field of the block, unless hidden from the editors (then
      // nobody fills it in)
      hasField(field) {
        const content = this.nested(this.config.defaults || {}, "settings.fields.content") || {};
        const hidden = this.nested(this.overrides || {}, "settings.hidden");
        if (Array.isArray(hidden) && hidden.includes(field)) return false;
        return content[field] !== void 0 && content[field] !== false;
      },
      globalValue(name) {
        var _a, _b, _c;
        const ov = (this.globalOverrides.global || {})[name];
        if (ov !== void 0 && ov !== "") return ov;
        return (_c = (_b = (_a = this.globalDefaults.layout) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value;
      },
      globalColor(name) {
        var _a, _b, _c;
        return ((this.globalOverrides.global || {})[this.currentTheme] || {})[name] || ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b[name]) == null ? void 0 : _c[this.currentTheme]) || "";
      },
      elementColor(element, name) {
        var _a, _b, _c;
        return ((this.elementOverrides.global || {})[this.currentTheme] || {})[name] || ((_c = (_b = (_a = this.elementDefaults[element]) == null ? void 0 : _a.colors) == null ? void 0 : _b[name]) == null ? void 0 : _c[this.currentTheme]) || "";
      },
      // element value: responsive ones at the current device
      elementValue(element, prop) {
        var _a, _b;
        const name = element + "-" + prop;
        const def = (_b = (_a = this.elementDefaults[element]) == null ? void 0 : _a.vars) == null ? void 0 : _b[name];
        const ov = this.elementOverrides.global || {};
        if (def && def.default !== void 0) {
          return (ov[this.bp] || {})[name] || def[this.bp] || def.default;
        }
        return ov[name] || (def ? def.value : "") || "";
      },
      // size step (heading-size-lg, editor-size-xl …) at the current device
      sizeStep(element, size2) {
        var _a, _b;
        const name = element + "-size-" + size2;
        const def = (_b = (_a = this.fontDefaults[element]) == null ? void 0 : _a.vars) == null ? void 0 : _b[name];
        if (!def) return "";
        return ((this.fontOverrides.global || {})[this.bp] || {})[name] || def[this.bp] || def.default || "";
      },
      typography(element) {
        let family = this.elementValue(element, "font-family");
        if (!family || family === "default") family = this.bodyDefaultFont;
        const all = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        const font = Object.values(all).find((f) => f.family === family);
        return {
          fontFamily: "'" + family + "', " + (font && font.category || "sans-serif"),
          fontWeight: this.elementValue(element, "font-weight"),
          fontStyle: this.elementValue(element, "font-style"),
          fontSize: this.elementValue(element, "font-size"),
          lineHeight: this.elementValue(element, "line-height"),
          letterSpacing: this.elementValue(element, "letter-spacing"),
          textTransform: this.elementValue(element, "text-transform")
        };
      },
      gapBefore(field) {
        const idx = this.fields.indexOf(field);
        if (idx <= 0) return 0;
        return GAPS[this.fields[idx - 1] + ">" + field] || 0;
      },
      fieldStyle(field) {
        const style = {
          ...this.typography(field),
          color: this.elementColor(field, "element-" + field + "-text"),
          textAlign: this.preset(field, "align") || "left",
          margin: 0,
          marginTop: this.gapBefore(field)
        };
        const size2 = this.preset(field, "sizes") || (style.fontSize ? "" : "lg");
        if (size2 && size2 !== "normal") {
          const step = this.sizeStep(field, size2);
          if (step) style.fontSize = step;
        }
        return style;
      }
    }
  };
  var _sfc_render$1 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-element-preview-side pw-block-live-preview" }, [_c("div", { staticClass: "pw-preview-switches" }, [_c("div", { staticClass: "pw-pill pw-guides-switch", attrs: { "role": "group" } }, [_c("button", { staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t("prw.preview.guides"), "aria-label": _vm.$t("prw.preview.guides"), "aria-pressed": _vm.guides ? "true" : "false" }, on: { "click": _vm.toggleGuides } }, [_c("k-icon", { attrs: { "type": "prw-guides" } })], 1)]), _c("pw-device-select", { attrs: { "value": _vm.bp }, on: { "input": function($event) {
      return _vm.$emit("update:bp", $event);
    } } }), _c("div", { staticClass: "pw-pill pw-preview-bp pw-preview-theme", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "pt-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentTheme === t ? "true" : "false" }, on: { "click": function($event) {
        return _vm.$emit("update:variant", t);
      } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0)], 1), _c("div", { staticClass: "pw-block-live-body", style: { backgroundColor: _vm.bodyBackground } }, [_c("div", { staticClass: "pw-block-live-block", class: { "has-guide-top": _vm.guides && _vm.setting("settings", "margin-top") === true, "has-guide-bottom": _vm.guides && _vm.setting("settings", "margin-bottom") === true, "is-fullscreen": _vm.setting("settings", "block-size") === "fullscreen" }, style: _vm.blockStyle }, [_c("section", { staticClass: "pw-block-live-section", class: { "has-guides": _vm.guides }, style: _vm.sectionStyle }, [_c("div", { staticClass: "pw-block-live-grid", style: _vm.gridStyle }, [_c("div", { staticClass: "pw-block-live-item", style: _vm.itemStyle }, [_c("div", { staticClass: "pw-block-live-content" }, [_vm.hasField("tagline") ? _c("p", { style: _vm.fieldStyle("tagline") }, [_vm._v(_vm._s(_vm.$t("prw.preview.tagline")))]) : _vm._e(), _vm.hasField("heading") ? _c("div", { style: _vm.fieldStyle("heading") }, [_vm._v(_vm._s(_vm.$t("prw.preview.heading")))]) : _vm._e(), _vm.hasField("editor") ? _c("p", { style: _vm.fieldStyle("editor") }, [_vm._v(_vm._s(_vm.$t("prw.preview.text.before")) + " " + _vm._s(_vm.$t("prw.preview.text.link")) + _vm._s(_vm.$t("prw.preview.text.after")))]) : _vm._e(), _vm.hasField("buttons") ? _c("div", { style: _vm.buttonsStyle }, [_c("span", { style: _vm.buttonStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.button")))])]) : _vm._e(), _vm.isSteplist ? _c("div", { staticClass: "pw-steplist-items", style: _vm.stepItemsStyle }, _vm._l(_vm.stepCount, function(n) {
      return _c("div", { key: "step-" + n, staticClass: "pw-steplist-item", class: { "is-connected": _vm.currentStepStyle === "connected" }, style: _vm.stepItemStyle }, [_vm.currentStepStyle === "connected" ? _c("span", { staticClass: "pw-steplist-connector", style: _vm.stepConnectorStyle(n) }) : _vm._e(), _c("div", { staticClass: "pw-steplist-number", style: _vm.stepNumberStyle }, [_vm._v(_vm._s(n))]), _c("div", { staticClass: "pw-steplist-content" }, [_c("div", { style: _vm.stepHeadingStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.step.title")) + " " + _vm._s(n))]), _c("div", { style: _vm.stepTextStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.step.text")))])])]);
    }), 0) : _vm._e()])])])])])])]);
  };
  var _sfc_staticRenderFns$1 = [];
  _sfc_render$1._withStripped = true;
  var __component__$1 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$1,
    _sfc_render$1,
    _sfc_staticRenderFns$1
  );
  __component__$1.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BlockPreview.vue";
  const BlockPreview = __component__$1.exports;
  const _sfc_main = {
    props: {
      // default (mobile), lg (tablet) or xl (desktop)
      value: { type: String, default: "default" }
    },
    methods: {
      icon(bp) {
        return { default: "mobile", lg: "tablet", xl: "display" }[bp];
      },
      label(bp) {
        return { default: this.$t("prw.label.mobile"), lg: this.$t("prw.label.tablet"), xl: this.$t("prw.label.desktop") }[bp];
      }
    }
  };
  var _sfc_render = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-pill pw-device-select", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool", attrs: { "type": "button", "aria-haspopup": "menu", "title": _vm.label(_vm.value), "aria-label": _vm.label(_vm.value) }, on: { "click": function($event) {
      return _vm.$refs.menu.toggle();
    } } }, [_c("k-icon", { attrs: { "type": _vm.icon(_vm.value) } }), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "menu", attrs: { "align-x": "end" } }, [_c("nav", { staticClass: "k-navigate" }, _vm._l(["default", "lg", "xl"], function(bp) {
      return _c("button", { key: bp, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.value === bp ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.menu.close();
        _vm.$emit("input", bp);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": _vm.icon(bp) } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(_vm.label(bp)))])]);
    }), 0)])], 1)]);
  };
  var _sfc_staticRenderFns = [];
  _sfc_render._withStripped = true;
  var __component__ = /* @__PURE__ */ normalizeComponent(
    _sfc_main,
    _sfc_render,
    _sfc_staticRenderFns
  );
  __component__.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/DeviceSelect.vue";
  const DeviceSelect = __component__.exports;
  panel.plugin("kirbydesk/kirby-projectwizard", {
    icons: {
      // text transform: glyphs instead of names (as in design tools)
      "prw-case-none": '<rect x="6" y="11" width="12" height="2.2" rx="1.1"/>',
      "prw-case-upper": '<text x="12" y="17.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600">AA</text>',
      "prw-case-lower": '<text x="12" y="17" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600">aa</text>',
      "prw-case-capitalize": '<text x="12" y="17.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15.5" font-weight="600">Aa</text>',
      "prw-step-large": '<path d="M18.2072 9.0428 12.0001 2.83569 5.793 9.0428 7.20721 10.457 12.0001 5.66412 16.793 10.457 18.2072 9.0428ZM5.79285 14.9572 12 21.1643 18.2071 14.9572 16.7928 13.543 12 18.3359 7.20706 13.543 5.79285 14.9572Z"></path>',
      "prw-step-small": '<path d="M5.79285 5.20718 12 11.4143 18.2071 5.20718 16.7928 3.79297 12 8.58586 7.20706 3.79297 5.79285 5.20718ZM18.2072 18.7928 12.0001 12.5857 5.793 18.7928 7.20721 20.207 12.0001 15.4141 16.793 20.207 18.2072 18.7928Z"></path>',
      "prw-guides": '<path d="M8 8V16H16V8H8ZM6 6H18V18H6V6ZM6 2H8V5H6V2ZM6 19H8V22H6V19ZM2 6H5V8H2V6ZM2 16H5V18H2V16ZM19 6H22V8H19V6ZM19 16H22V18H19V16ZM16 2H18V5H16V2ZM16 19H18V22H16V19Z"></path>',
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
      "pw-block-values": BlockValues,
      "pw-wizard-setup": SetupWizard,
      "pw-portal": Portal,
      "pw-block-preview": BlockPreview,
      "pw-device-select": DeviceSelect
    }
  });
})();
