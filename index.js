(function() {
  "use strict";
  const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
  function withoutPatched(own, patch) {
    if (!isObject(own) || !isObject(patch)) return own;
    const out = { ...own };
    for (const [key, value] of Object.entries(patch)) {
      if (!(key in out)) continue;
      if (isObject(value) && isObject(out[key])) {
        out[key] = withoutPatched(out[key], value);
        if (!Object.keys(out[key]).length) delete out[key];
      } else {
        delete out[key];
      }
    }
    return out;
  }
  function withoutPatchedValues(own, patch) {
    const out = JSON.parse(JSON.stringify(own || {}));
    for (const group of Object.values(patch || {})) {
      if (!isObject(group)) continue;
      for (const [name, v] of Object.entries(group.vars || {})) {
        if (isObject(v) && "value" in v) delete out[name];
      }
      for (const [name, variants] of Object.entries(group.colors || {})) {
        if (!isObject(variants)) continue;
        for (const variant of Object.keys(variants)) {
          if (isObject(out[variant])) delete out[variant][name];
        }
      }
    }
    return out;
  }
  function injectFontFaces(fontsData) {
    const id = "pw-panel-fontfaces";
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    const base = (window.panel && window.panel.urls && window.panel.urls.site || "").replace(/\/$/, "");
    const allFonts = { ...(fontsData || {}).builtin || {}, ...(fontsData || {}).project || {} };
    const rules = [];
    for (const font of Object.values(allFonts)) {
      for (const file of font.files || []) {
        rules.push(
          "@font-face { font-family: '" + font.family + "'; src: url('" + base + "/assets/fonts/" + file.src + "') format('woff2'); font-weight: " + (file.weight || "400") + "; font-style: " + (file.style || "normal") + "; font-display: swap; }"
        );
      }
    }
    style.textContent = rules.join("\n");
  }
  const DEVICE_KEY = "pw-panel-device";
  const PANEL_SIZES = ["default", "sm", "md", "lg", "xl"];
  const readDevice = () => {
    try {
      const d = window.localStorage.getItem(DEVICE_KEY);
      return PANEL_SIZES.includes(d) ? d : null;
    } catch (e) {
      return null;
    }
  };
  const GRID_KEY = "pw-panel-grid";
  const readGrid = () => {
    try {
      return window.localStorage.getItem(GRID_KEY) === "1";
    } catch (e) {
      return false;
    }
  };
  const state = window.Vue.observable({ data: null, error: null, version: 0, device: readDevice(), windowDevice: null, gridLines: readGrid() });
  function setGridLines(on) {
    state.gridLines = !!on;
    try {
      if (state.gridLines) window.localStorage.setItem(GRID_KEY, "1");
      else window.localStorage.removeItem(GRID_KEY);
    } catch (e) {
    }
  }
  function windowDevice() {
    const w = window.innerWidth;
    if (w >= 1280) return "xl";
    if (w >= 1024) return "lg";
    if (w >= 768) return "md";
    if (w >= 640) return "sm";
    return "default";
  }
  let lastWindowDevice = windowDevice();
  state.windowDevice = lastWindowDevice;
  window.addEventListener("resize", () => {
    const now = windowDevice();
    if (now === lastWindowDevice) return;
    lastWindowDevice = now;
    state.windowDevice = now;
    if (state.device) setPreviewDevice(null);
    markShownDevice();
  });
  const RANK = { default: 0, sm: 1, md: 2, lg: 3, xl: 4 };
  function deviceFits(device) {
    return RANK[device] <= RANK[state.windowDevice || "xl"];
  }
  function shownDevice() {
    return state.device && deviceFits(state.device) ? state.device : state.windowDevice || "xl";
  }
  function markShownDevice() {
    try {
      document.documentElement.dataset.pwDevice = shownDevice();
    } catch (e) {
    }
  }
  function setPreviewDevice(device) {
    state.device = PANEL_SIZES.includes(device) ? device : null;
    markShownDevice();
    try {
      if (state.device) window.localStorage.setItem(DEVICE_KEY, state.device);
      else window.localStorage.removeItem(DEVICE_KEY);
    } catch (e) {
    }
  }
  let loading = null;
  const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
  function previewState() {
    return state;
  }
  function ensurePreviewData(api) {
    if (state.data || loading) return loading || Promise.resolve(state.data);
    loading = api.get("projectwizard/preview").then((res) => {
      const blocks = {};
      for (const [type, b] of Object.entries(obj(res.blocks))) {
        blocks[type] = {
          config: b.config || { defaults: {} },
          overrides: obj(b.overrides),
          valueDefaults: obj(b.valueDefaults),
          valueOverrides: obj(b.valueOverrides)
        };
      }
      state.data = {
        variants: res.variants || [],
        global: { defaults: obj(res.global && res.global.defaults), overrides: obj(res.global && res.global.overrides) },
        elements: { defaults: obj(res.elements && res.elements.defaults), overrides: obj(res.elements && res.elements.overrides) },
        fontsizes: { defaults: obj(res.fontsizes && res.fontsizes.defaults), overrides: obj(res.fontsizes && res.fontsizes.overrides) },
        fonts: obj(res.fonts),
        blocks
      };
      state.error = null;
      injectFontFaces(state.data.fonts);
      return state.data;
    }).catch((e) => {
      state.error = e && e.message ? e.message : String(e);
      return null;
    }).finally(() => {
      loading = null;
    });
    return loading;
  }
  function invalidatePreviewData() {
    state.data = null;
    state.version++;
  }
  let channel = null;
  try {
    channel = new BroadcastChannel("pw-preview");
    channel.onmessage = (e) => {
      if (e.data === "saved") invalidatePreviewData();
    };
  } catch (e) {
  }
  function announcePreviewSaved() {
    invalidatePreviewData();
    try {
      channel && channel.postMessage("saved");
    } catch (e) {
    }
  }
  markShownDevice();
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
  const clamp = (el, number) => {
    const min = parseFloat(el.getAttribute("min"));
    const max = parseFloat(el.getAttribute("max"));
    if (!Number.isNaN(min)) number = Math.max(min, number);
    if (!Number.isNaN(max)) number = Math.min(max, number);
    return number;
  };
  const stepBy = (el, direction, big) => {
    const current = parseFloat(String(el.value).replace(",", "."));
    if (Number.isNaN(current)) return;
    const step = (parseFloat(el.getAttribute("step")) || 0.1) * (big ? 10 : 1);
    const places = Math.max(decimals(step), decimals(current));
    el.value = String(clamp(el, Number((current + direction * step).toFixed(places))));
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
      el.addEventListener("change", () => {
        const typed = parseFloat(String(el.value).replace(",", "."));
        if (Number.isNaN(typed)) return;
        const kept = clamp(el, typed);
        if (kept !== typed) el.value = String(kept);
      }, true);
      el.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        el.pwTyping = false;
        stepBy(el, event.key === "ArrowUp" ? 1 : -1, event.shiftKey);
      });
      const wrap = el.parentNode;
      if (wrap) {
        wrap.addEventListener("mousedown", (event) => {
          if (event.target === el || event.target.closest("select, button")) return;
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
  const KEY = "pw-preview-bp";
  const SCREEN_HEIGHTS = { default: 800, sm: 800, md: 1024, lg: 768, xl: 900 };
  const DEVICES = ["default", "lg", "xl"];
  function readPreviewBp() {
    try {
      const bp = window.localStorage.getItem(KEY);
      return DEVICES.includes(bp) ? bp : "xl";
    } catch (e) {
      return "xl";
    }
  }
  function savePreviewBp(bp) {
    try {
      if (DEVICES.includes(bp)) window.localStorage.setItem(KEY, bp);
    } catch (e) {
    }
  }
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
  const _sfc_main$n = {
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
            return t || "welcome";
          } catch (e) {
            return "welcome";
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
        // featurelist: the layout its preview shows (stacked / split), a view
        featurePreviewLayout: {},
        // faq: the style its preview shows (lines / cards), a view
        faqPreviewStyle: {},
        // hero: the height its preview shows (small … fullscreen), a view
        heroPreviewHeight: {},
        startHeroHeights: {},
        // cardlets: the display shown in the design tab, the start value last seen
        cardPreviewDisplay: {},
        startCardDisplays: {},
        // the drawer tab shown in each block's start values
        startDrawerTab: {},
        startSectionLayouts: {},
        // the value whose row the pointer is over: its area tinted in the preview
        hoveredVar: null,
        // theme shown in the items' colour card
        itemColorTheme: "default",
        // each block's theme start value (to notice a change)
        startThemes: {},
        // steplist: each block's item style start value (to notice a change)
        startItemStyles: {},
        // guides in the block preview (and the matching stripes in the rows)
        previewGuides: (() => {
          try {
            return localStorage.getItem("pw-wizard-guides") === "on";
          } catch (e) {
            return false;
          }
        })(),
        // breakpoint shown in the items' responsive rows
        // device of the preview: the last one chosen (see helpers/preview-bp.js)
        itemBp: readPreviewBp(),
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
        // exceptions (Project › Exceptions): the JSON as text, its check
        patchesText: "",
        patchesTree: {},
        // the path at the editor's cursor: the tree opens and marks it
        patchesFocus: null,
        // the start page's figures: the site's pages (loaded with the wizard)
        sitePageCount: null,
        // saving everything at once: the single saves stay quiet
        savingAll: false,
        originalPatchesText: "",
        patchesError: "",
        patchesUnknown: [],
        aiForm: null,
        aiValues: {},
        originalAiValues: {},
        // Settings › Translation (translatewizard): the tree of the text
        // fields, which are translated ("owner.field" → on), DeepL's usage
        // the start page's slogan, typed: letters shown so far, the caret
        sloganTyped: 0,
        sloganCaret: false,
        // the figures below it: faded in after the typing
        statsShown: false,
        translateTree: null,
        // the tree: all entries opened (true) or shut (false) at once
        translateExpanded: false,
        // the stored keys checked with their services (env → true / false / null)
        aiSecretValid: {},
        aiSecretTypes: {},
        translateValues: {},
        originalTranslateValues: {},
        deeplUsage: null,
        // translating several pages (Settings › Translation)
        batch: { languages: [], pages: [], lang: null, mode: "missing", running: false, stop: false, done: 0, total: 0, current: "", result: null },
        // its dialog: { step: ask | run | done, lang, mode, pages, chars }
        batchDialog: null,
        aiSecrets: null,
        aiSecretsWritable: true,
        aiSecretInputs: {}
      };
    },
    // the saved exceptions for the block settings (their locked rows) and the
    // way to them (the lock's click)
    provide() {
      return {
        pwPatches: () => this.savedPatches,
        pwOpenPatches: () => this.openGlobal("patches")
      };
    },
    computed: {
      // the exceptions as saved (what applies; not the text being edited)
      savedPatches() {
        try {
          const data = JSON.parse(this.originalPatchesText || "{}");
          return data && typeof data === "object" && !Array.isArray(data) ? data : {};
        } catch (e) {
          return {};
        }
      },
      // tabs of the current view (global or block) for the header
      // top-level elements for the header dropdown (child elements like cite/caption
      // are edited together with their parent) — available on every view
      elementOptions() {
        const children = ["cite", "caption"];
        return Object.entries(this.elementDefaults || {}).filter(([key, val]) => val && typeof val === "object" && (val.vars || val.colors) && !children.includes(key)).map(([key]) => {
          const tKey = "prw.elementgroup." + key;
          const text = this.$t(tKey);
          const icons = { heading: "title", tagline: "tag", editor: "text", quote: "quote", button: "url", breadcrumb: "angle-right", media: "images", item: "prw-entries", list: "prw-list" };
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
      globalPageIntro() {
        if (this.globalActiveTab === "blocks") return this.$t("prw.intro.global.blocks");
        if (this.globalActiveTab === "elements" && this.selectedElement) {
          const key = this.selectedElement === "item" ? "prw.hint.itemElement" : "prw.intro.element." + this.selectedElement;
          const text = this.$t(key);
          return text && text !== key ? text : "";
        }
        return "";
      },
      // the icon before a global page's title: an element's (as in the
      // elements menu), else the page's (as in its menu)
      globalPageIcon() {
        if (this.globalActiveTab === "elements") {
          const element = this.elementOptions.find((o) => o.value === this.selectedElement);
          return element ? element.icon : null;
        }
        const tab = this.globalTabs.find((t) => t.key === this.globalActiveTab);
        return tab ? tab.icon : null;
      },
      globalPageTitle() {
        if (this.globalActiveTab === "elements") {
          const element = this.elementOptions.find((o) => o.value === this.selectedElement);
          if (element) return element.text;
        }
        if (this.globalActiveTab === "patches") return this.$t("prw.page.patches");
        return this.$t("prw.tab." + this.globalActiveTab);
      },
      projectMenuTabs() {
        return ["site", "header", "footer", "blocks", "fonts"];
      },
      // the settings menu: the project, the settings (variants), AI (with
      // kirby-contentwizard) and the exceptions
      configMenuTabs() {
        return [...this.hasTranslateTab ? ["translate"] : [], ...this.hasGeneratorTab ? ["generator"] : [], "patches"];
      },
      // the AI pages: translation with the translatewizard's keys, the page
      // generator with the contentwizard's settings and keys
      // unsaved changes per page (how many values differ from the saved
      // ones): block:<type>, element:<group>, site, header, footer, blocks,
      // fonts, translate, generator, patches
      pendingCounts() {
        const out = {};
        const add = (key, n = 1) => {
          if (n) out[key] = (out[key] || 0) + n;
        };
        for (const block of this.blocks) {
          const bt = block.blockType;
          add("block:" + bt, this.diffPaths(this.blockOverrides[bt] || {}, this.originalOverrides[bt] || {}).length + this.diffPaths(this.blockValueOverrides[bt] || {}, this.originalBlockValueOverrides[bt] || {}).length);
        }
        for (const path of this.diffPaths(this.globalOverrides, this.originalGlobalOverrides)) {
          const name = String(path[path.length - 1]);
          add(name === "body-background" ? "site" : name.startsWith("font-") ? "fonts" : "blocks");
        }
        const changed = (a, b) => a.filter((x) => !b.includes(x)).length + b.filter((x) => !a.includes(x)).length;
        add("blocks", changed(this.activeBlocks, this.originalActiveBlocks) + changed(this.activeVariants, this.originalActiveVariants));
        for (const path of [...this.diffPaths(this.elementOverrides, this.originalElementOverrides), ...this.diffPaths(this.fontOverrides, this.originalFontOverrides)]) {
          add("element:" + this.elementGroupOf(String(path[path.length - 1])));
        }
        add("header", this.diffPaths(this.navOverrides, this.originalNavOverrides).length);
        add("footer", this.diffPaths(this.footerOverrides, this.originalFooterOverrides).length);
        add("generator", this.diffPaths(this.aiValues, this.originalAiValues).length);
        add("translate", this.diffPaths(this.translateValues, this.originalTranslateValues).length);
        for (const [env, value] of Object.entries(this.aiSecretInputs || {})) {
          if (!value || !value.trim()) continue;
          const secret = (this.aiSecrets || []).find((sc) => sc.env === env);
          add(secret && secret.plugin === "kirbydesk.kirby-translatewizard" ? "translate" : "generator");
        }
        if (this.patchesText !== this.originalPatchesText) add("patches");
        return out;
      },
      // the batch dialog's buttons per step
      batchDialogCancel() {
        var _a, _b;
        const step = (_a = this.batchDialog) == null ? void 0 : _a.step;
        if (step === "ask") return this.$t("cancel");
        if (step === "done" && ((_b = this.batch.result) == null ? void 0 : _b.stopped)) return this.$t("cancel");
        if (step === "run") {
          return this.batch.stop ? { text: this.$t("prw.translate.batch.stopping"), icon: "loader", disabled: true } : { text: this.$t("prw.translate.batch.stop"), icon: "cancel" };
        }
        return false;
      },
      // more characters than the usage has left (a dry run sends none)
      batchOverQuota() {
        const d = this.batchDialog;
        return !!(d && this.deeplUsage && d.chars > this.deeplUsage.limit - this.deeplUsage.count);
      },
      batchDialogSubmit() {
        var _a, _b;
        const step = (_a = this.batchDialog) == null ? void 0 : _a.step;
        if (step === "ask") {
          if (this.batchOverQuota) return false;
          return { text: this.$t("prw.translate.batch.start", { count: this.batchDialog.pages.length }), icon: "translatewizard-translate", theme: "positive" };
        }
        if (step === "done" && ((_b = this.batch.result) == null ? void 0 : _b.stopped)) {
          return { text: this.$t("prw.translate.batch.resume"), icon: "play", theme: "positive" };
        }
        if (step === "done") return { text: this.$t("prw.translate.batch.close"), icon: "check" };
        return false;
      },
      // the start page's figures: the blocks used on all pages together
      blockUsageTotal() {
        const counts = Object.values(this.blockUsage || {});
        return counts.length ? counts.reduce((sum, n) => sum + (Number(n) || 0), 0) : null;
      },
      pendingPageCount() {
        return Object.keys(this.pendingCounts).length;
      },
      // pages without the preview column: the AI pages over the full width
      fullWidthPage() {
        return this.activeTab === "global" && ["welcome", "translate", "generator"].includes(this.globalActiveTab);
      },
      patchesHighlighted() {
        return this.patchesHighlightedFor(this.patchesText);
      },
      hasTranslateTab() {
        return (this.aiSecrets || []).some((s) => s.plugin === "kirbydesk.kirby-translatewizard");
      },
      hasGeneratorTab() {
        return !!this.aiForm || (this.aiSecrets || []).some((s) => s.plugin === "kirbydesk.kirby-contentwizard");
      },
      aiPageSecrets() {
        const plugin = { translate: "kirbydesk.kirby-translatewizard", generator: "kirbydesk.kirby-contentwizard" }[this.globalActiveTab];
        return (this.aiSecrets || []).filter((s) => s.plugin === plugin);
      },
      // activated blocks with their own settings view (pw* blocks), for the blocks dropdown
      // tabs of a block view: design (only with values), start values, restrictions
      blockViewTabs() {
        const views = [
          ...this.hasDesignView(this.activeTab) ? ["design"] : [],
          ...this.hasElementsView(this.activeTab) ? ["elements"] : [],
          "defaults",
          "presets"
        ];
        const icons = { design: "prw-design", elements: "layers", defaults: "edit-line", presets: "hidden" };
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
          { key: "site", icon: "template" },
          { key: "blocks", icon: "box" },
          { key: "elements", icon: "layers" },
          { key: "fonts", icon: "title" },
          { key: "header", icon: "prw-header" },
          { key: "footer", icon: "prw-footer" }
        ];
        if (this.hasTranslateTab) tabs.push({ key: "translate", icon: "translatewizard-translate" });
        if (this.hasGeneratorTab) tabs.push({ key: "generator", icon: "ai" });
        tabs.push({ key: "patches", icon: "code" });
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
      // the media's corner radii (Elements › Media › Form): override, else the plugin's
      mediaRadiusValues() {
        var _a, _b, _c;
        const ov = (this.elementOverrides.global || {})["media-radius"];
        return Array.isArray(ov) ? ov : ((_c = (_b = (_a = this.elementDefaults.media) == null ? void 0 : _a.vars) == null ? void 0 : _b["media-radius"]) == null ? void 0 : _c.value) || [];
      },
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
          if (tab === "blocks") return !!this.dirtyTabs["global-settings"] || !!this.dirtyTabs["global"];
          if (["site", "fonts"].includes(tab)) return !!this.dirtyTabs["global-settings"];
          if (tab === "translate" || tab === "generator") return !!this.dirtyTabs["ai"];
          return !!this.dirtyTabs[tab];
        }
        return !!this.dirtyTabs[this.activeTab];
      }
    },
    watch: {
      // remembered for the next visit
      itemBp(bp) {
        savePreviewBp(bp);
      },
      // the configuration's field grows with its content (also on inserting
      // from the tree, loading, discarding, opening the page)
      patchesText() {
        this.$nextTick(this.fitPatchesInput);
      },
      // (the text arrives while the loading view still stands, e.g. coming
      // from a block: measured once the page is there)
      loading(now) {
        if (!now) this.$nextTick(this.fitPatchesInput);
        if (!now) this.$nextTick(this.fitTopbar);
        if (!now && !this.sloganTyped) this.typeSlogan();
      },
      // (the save buttons come and go)
      pendingPageCount() {
        this.$nextTick(this.fitTopbar);
      },
      // the unsaved changes written along (a draft in the browser, see saveDraft)
      pendingCounts() {
        clearTimeout(this._draftTimer);
        this._draftTimer = setTimeout(() => this.saveDraft(), 400);
      },
      // the blocks page: how often each block is used (for its row)
      globalActiveTab: {
        immediate: true,
        handler(tab) {
          if (tab === "blocks") this.loadBlockUsage();
          if (tab === "translate" && this.hasTranslateTab) {
            this.loadDeeplUsage();
            this.loadBatch();
          }
          if (tab === "patches") {
            this.$nextTick(this.fitPatchesInput);
            this.loadPatchesTree();
          }
        }
      },
      // another block: start on its first tab
      activeTab(tab) {
        this.blockViewTab = null;
        this.showStartTheme();
        if (tab === "global") this.$nextTick(this.fitPatchesInput);
      },
      // each load of the global view (Kirby sets a new timestamp, also for the
      // same address, e.g. its menu entry): the page chosen in a wizard menu
      // (openGlobal), else the start page – as Kirby's own entries lead to
      // their overview
      "$panel.view.timestamp"() {
        if (this.blockType) return;
        const tab = this._pendingTab;
        this._pendingTab = null;
        try {
          sessionStorage.removeItem("pw-wizard-tab");
        } catch (e) {
        }
        this.globalActiveTab = tab || "welcome";
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
      this.restoreDraft();
      this.showStartTheme();
      this._onKeydown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          if (this.pendingPageCount) this.saveAll();
        }
      };
      window.addEventListener("keydown", this._onKeydown);
    },
    mounted() {
      if (typeof ResizeObserver !== "undefined" && this.$refs.topbar) {
        this._topbarObserver = new ResizeObserver(() => this.fitTopbar());
        this._topbarObserver.observe(this.$refs.topbar);
      }
    },
    beforeDestroy() {
      window.removeEventListener("keydown", this._onKeydown);
      if (this._topbarObserver) this._topbarObserver.disconnect();
      if (this._patchesObserver) this._patchesObserver.disconnect();
    },
    methods: {
      async load() {
        try {
          const res = await this.$api.get("projectwizard/blocks");
          this.blocks = res.blocks || [];
          this.blocks = this.blocks.slice().sort((a, b) => this.blockLabel(a.blockType).localeCompare(this.blockLabel(b.blockType), this.$panel.translation.code));
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
            {
              try {
                const valuesRes = await this.$api.get("projectwizard/values/" + block.blockType);
                const defaults = valuesRes.defaults && !Array.isArray(valuesRes.defaults) ? valuesRes.defaults : {};
                if (!Object.keys(defaults).length) throw new Error("no values");
                this.$set(this.blockValueDefaults, block.blockType, defaults);
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
            this.sitePageCount = (await this.$api.get("projectwizard/stats")).pages;
          } catch (e) {
          }
          this.loadBlockUsage();
          const patches = await this.$api.get("projectwizard/patches");
          this.patchesText = patches.text || "";
          this.originalPatchesText = this.patchesText;
          this.patchesUnknown = patches.unknown || [];
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
          if (this.hasTranslateTab) await this.loadTranslateFields();
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
        if (block && block.name) return block.name;
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
      // featurelist: the layout shown (chosen in the gaps card, else the start value)
      currentFeatureLayout(blockType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        if (this.featurePreviewLayout[blockType]) return this.featurePreviewLayout[blockType];
        const ov = (_e = (_d = (_c = (_b = (_a = this.blockOverrides[blockType]) == null ? void 0 : _a.settings) == null ? void 0 : _b.fields) == null ? void 0 : _c.style) == null ? void 0 : _d["section-layout"]) == null ? void 0 : _e.default;
        return ov || ((_k = (_j = (_i = (_h = (_g = (_f = this.blockConfigs[blockType]) == null ? void 0 : _f.defaults) == null ? void 0 : _g.settings) == null ? void 0 : _h.fields) == null ? void 0 : _i.style) == null ? void 0 : _j["section-layout"]) == null ? void 0 : _k.default) || "stacked";
      },
      // the screen height of a device (px), as the preview assumes it
      screenHeight(bp) {
        return SCREEN_HEIGHTS[bp] || SCREEN_HEIGHTS.default;
      },
      // a rem value in px (16px root), as the px cells
      remToPx(val) {
        const n = parseFloat(val);
        return isNaN(n) ? "" : Math.round(n * 16) + "px";
      },
      // the block's text allows lists: its editor (with the exceptions) has a
      // list among some "nodes" – no "nodes" at all is Kirby's writer, lists
      // included
      allowsLists(blockType) {
        var _a;
        const editor = (_a = this.blocks.find((b) => b.blockType === blockType)) == null ? void 0 : _a.editor;
        const lists = [];
        const walk = (o) => {
          if (!o || typeof o !== "object" || Array.isArray(o)) return;
          if (Array.isArray(o.nodes)) lists.push(o.nodes);
          Object.values(o).forEach(walk);
        };
        walk(editor);
        return !lists.length || lists.some((n) => n.includes("bulletList") || n.includes("orderedList"));
      },
      // a block that brings values for its own space below (tagline, heading, text)
      hasOwnSpacing(blockType) {
        return this.ownSpacingElements(blockType).length > 0;
      },
      // its elements with such a value (the heading block: only the tagline),
      // without those hidden under Visibility (they are not in the block)
      // the elements whose space below the block has values for: always all,
      // in a fixed order – used or not, hidden or not (each applies, also
      // below the intro's last one; a block may enlarge that one)
      ownSpacingElements(blockType) {
        const groups = Object.values(this.blockValueDefaults[blockType] || {});
        return ["tagline", "heading", "editor", "list", "quote", "media", "button"].filter((el) => groups.some((g) => g && g.vars && g.vars[el + "-spacing"]));
      },
      // multicolumn: the columns side by side at the device shown (then the
      // gap between them counts, else the one below each other); mobile always
      // stacked, as in the preview
      mcColumnsSide(blockType) {
        var _a;
        const key = { lg: "columns-lg", xl: "columns-xl" }[this.itemBp];
        if (!key) return false;
        const path = ["settings", "fields", "layout", key, "default"];
        const get = (o) => path.reduce((a, k) => a && a[k] !== void 0 ? a[k] : void 0, o);
        const dist = get(this.blockOverrides[blockType]) ?? get((_a = this.blockConfigs[blockType]) == null ? void 0 : _a.defaults);
        return /^dist-\d-\d$/.test(dist || "");
      },
      // the guide colour of an element's space below (as its band in the preview)
      spaceGuide(el) {
        return { tagline: "margin", heading: "row", editor: "text", list: "gap-4", quote: "gap-5", media: "overhang", button: "gap-6" }[el];
      },
      // the global elements' space below (Elements page: override, else default)
      globalElementSpacing(el) {
        var _a, _b, _c;
        const name = el + "-spacing";
        return (this.elementOverrides.global || {})[name] || ((_c = (_b = (_a = this.elementDefaults[el]) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value) || "";
      },
      // a block whose entries take Elements › Items (with own values to switch on)
      hasEntry(blockType) {
        return Object.values(this.blockValueDefaults[blockType] || {}).some((g) => g && g.vars && g.vars["item-title-font-size"]);
      },
      // featurelist entries: the rows of their values (title in the text:
      // only the description's size, which then is the size of both)
      entryRows(blockType) {
        const inline = this.itemLayoutDefault(blockType, "item-title-style") === "inline";
        if (inline) return ["item-text-font-size"];
        if (blockType === "pwfaq") return ["item-title-font-size", "item-title-line-height", "item-text-font-size"];
        return ["item-title-font-size", "item-title-line-height", "item-text-font-size", "item-title-spacing"];
      },
      // the entries' two cards: the title (its size, line height, gap to the
      // description) and the description (its size)
      entryParts(blockType) {
        const rows = this.entryRows(blockType);
        return [
          { key: "title", heading: "prw.headline.entryTitle", rows: rows.filter((n) => n.startsWith("item-title-")) },
          { key: "text", heading: "prw.headline.entryText", rows: rows.filter((n) => n.startsWith("item-text-")) }
        ].filter((p) => p.rows.length > 0);
      },
      entryLabel(blockType, name) {
        const short = { "item-title-font-size": "prw.prop.font-size", "item-title-line-height": "prw.prop.line-height", "item-text-font-size": "prw.prop.font-size", "item-title-spacing": "prw.element.item-title-spacing" }[name];
        if (short) return this.$t(short);
        if (name === "item-text-font-size" && this.itemLayoutDefault(blockType, "item-title-style") === "inline") return this.$t("prw.prop.font-size");
        return this.$t("prw.prop." + name);
      },
      // a value of the global items (Elements › Items) at the shown device
      globalItemValue(name) {
        var _a, _b;
        const def = (_b = (_a = this.elementDefaults.item) == null ? void 0 : _a.vars) == null ? void 0 : _b[name];
        if (!def) return "";
        const ov = this.elementOverrides.global || {};
        if (def.default !== void 0) return (ov[this.itemBp] || {})[name] || def[this.itemBp] || def.default;
        return ov[name] || def.value;
      },
      // own values of the entries switched on: values not set yet take the
      // global items' (responsive ones per device)
      seedOwnEntry(blockType, part) {
        var _a, _b;
        const ov = JSON.parse(JSON.stringify(this.blockValueOverrides[blockType] || {}));
        const ownVars = {};
        for (const g of Object.values(this.blockValueDefaults[blockType] || {})) Object.assign(ownVars, g && g.vars || {});
        const eo = this.elementOverrides.global || {};
        let changed = false;
        for (const name of ["item-title-font-size", "item-title-line-height", "item-text-font-size", "item-title-spacing"]) {
          if (part && (name.startsWith("item-text-") ? "text" : "title") !== part) continue;
          const def = (_b = (_a = this.elementDefaults.item) == null ? void 0 : _a.vars) == null ? void 0 : _b[name];
          if (!ownVars[name] || !def || ov[name] !== void 0) continue;
          if (def.default !== void 0) {
            ov[name] = Object.fromEntries(["default", "lg", "xl"].map((bp) => [bp, (eo[bp] || {})[name] || def[bp] || def.default]));
          } else {
            ov[name] = eo[name] || def.value;
          }
          changed = true;
        }
        if (changed) this.onBlockValueOverridesUpdate(blockType, ov);
      },
      // own space below (tagline, heading, text): values not set yet take the
      // elements' current (global) ones, so the block starts where it was
      seedOwnSpacing(blockType) {
        var _a, _b, _c;
        const ov = JSON.parse(JSON.stringify(this.blockValueOverrides[blockType] || {}));
        let changed = false;
        for (const el of ["tagline", "heading", "editor", "list", "quote", "media", "button"]) {
          const name = el + "-spacing";
          const own = Object.values(this.blockValueDefaults[blockType] || {}).some((g) => g && g.vars && g.vars[name]);
          if (!own || ov[name] !== void 0) continue;
          const global = (this.elementOverrides.global || {})[name] || ((_c = (_b = (_a = this.elementDefaults[el]) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value);
          if (global) {
            ov[name] = global;
            changed = true;
          }
        }
        if (changed) this.onBlockValueOverridesUpdate(blockType, ov);
      },
      // hero: the height shown (chosen in the height card, else the start value)
      currentHeroHeight(blockType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        if (this.heroPreviewHeight[blockType]) return this.heroPreviewHeight[blockType];
        const ov = (_e = (_d = (_c = (_b = (_a = this.blockOverrides[blockType]) == null ? void 0 : _a.settings) == null ? void 0 : _b.fields) == null ? void 0 : _c.style) == null ? void 0 : _d.height) == null ? void 0 : _e.default;
        const h = ov || ((_k = (_j = (_i = (_h = (_g = (_f = this.blockConfigs[blockType]) == null ? void 0 : _f.defaults) == null ? void 0 : _g.settings) == null ? void 0 : _h.fields) == null ? void 0 : _i.style) == null ? void 0 : _j.height) == null ? void 0 : _k.default);
        return ["small", "medium", "large", "fullscreen"].includes(h) ? h : "small";
      },
      // cardlets: the display shown (chosen in the padding card, else the start value)
      currentCardDisplay(blockType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        if (this.cardPreviewDisplay[blockType]) return this.cardPreviewDisplay[blockType];
        const ov = (_e = (_d = (_c = (_b = (_a = this.blockOverrides[blockType]) == null ? void 0 : _a.settings) == null ? void 0 : _b.fields) == null ? void 0 : _c.style) == null ? void 0 : _d["card-display"]) == null ? void 0 : _e.default;
        return ov || ((_k = (_j = (_i = (_h = (_g = (_f = this.blockConfigs[blockType]) == null ? void 0 : _f.defaults) == null ? void 0 : _g.settings) == null ? void 0 : _h.fields) == null ? void 0 : _i.style) == null ? void 0 : _j["card-display"]) == null ? void 0 : _k.default) || "stacked";
      },
      // faq: the style shown (chosen in the questions card, else the start value)
      currentFaqStyle(blockType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        if (this.faqPreviewStyle[blockType]) return this.faqPreviewStyle[blockType];
        const ov = (_e = (_d = (_c = (_b = (_a = this.blockOverrides[blockType]) == null ? void 0 : _a.settings) == null ? void 0 : _b.fields) == null ? void 0 : _c.style) == null ? void 0 : _d["faq-style"]) == null ? void 0 : _e.default;
        return ov || ((_k = (_j = (_i = (_h = (_g = (_f = this.blockConfigs[blockType]) == null ? void 0 : _f.defaults) == null ? void 0 : _g.settings) == null ? void 0 : _h.fields) == null ? void 0 : _i.style) == null ? void 0 : _j["faq-style"]) == null ? void 0 : _k.default) || "lines";
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
      // a block with values of its own (the items' CSS variables, the hero's
      // heights and gaps)
      hasDesign(blockType) {
        return !!this.blockValueDefaults[blockType];
      },
      // the design tab: values of its own beyond those of the elements tab
      // (the entries' type, the space below)
      hasDesignView(blockType) {
        if (!this.hasDesign(blockType)) return false;
        const elementValues = [
          "tagline-spacing",
          "heading-spacing",
          "editor-spacing",
          "list-spacing",
          "quote-spacing",
          "media-spacing",
          "button-spacing",
          "item-title-font-size",
          "item-title-line-height",
          "item-text-font-size",
          "item-title-spacing"
        ];
        return Object.values(this.blockValueDefaults[blockType] || {}).some((g) => g && (Object.keys(g.colors || {}).length > 0 || Object.keys(g.vars || {}).some((name) => !elementValues.includes(name))));
      },
      // the elements tab: the entries' type or the space below, the global
      // elements' or the block's own
      hasElementsView(blockType) {
        return this.hasEntry(blockType) || this.hasOwnSpacing(blockType);
      },
      hasItemDefaultFields(blockType) {
        const cfg = this.blockConfigs[blockType];
        const layout = cfg && cfg.defaults && cfg.defaults.settings && cfg.defaults.settings.fields && cfg.defaults.settings.fields.layout || {};
        for (const key of Object.keys(layout)) {
          if (key.startsWith("item-radius-")) return true;
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
      // the slogan letter by letter (at once where motion is reduced); the
      // caret blinks a moment longer, then goes
      typeSlogan() {
        const length = this.$t("prw.welcome.slogan").length;
        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) {
          this.sloganTyped = length;
          this.sloganCaret = false;
          this.statsShown = true;
          return;
        }
        this.sloganCaret = true;
        const step = () => {
          if (this.sloganTyped >= length) {
            setTimeout(() => {
              this.statsShown = true;
            }, 400);
            setTimeout(() => {
              this.sloganCaret = false;
            }, 5e3);
            return;
          }
          this.sloganTyped++;
          setTimeout(step, 55 + Math.random() * 60);
        };
        setTimeout(step, 250);
      },
      // the translated fields: the tree and its values (a flat map)
      setTranslateTree(tree) {
        const values = {};
        const walk = (node) => {
          for (const f of node.fields || []) values[f.key] = !!f.value;
          (node.children || []).forEach(walk);
        };
        (tree || []).forEach(walk);
        this.translateTree = tree || null;
        this.translateValues = values;
        this.originalTranslateValues = JSON.parse(JSON.stringify(values));
      },
      onTranslateToggle({ key, value }) {
        this.$set(this.translateValues, key, value);
        this.updateAiDirty();
      },
      async loadTranslateFields() {
        try {
          this.setTranslateTree((await this.$api.get("translatewizard/fields")).tree);
        } catch (e) {
          this.translateTree = null;
        }
      },
      // the pages of a mode: without translation in the chosen language, or all
      batchPagesOf(mode, lang = this.batch.lang) {
        return this.batch.pages.filter((p) => mode === "all" || !(p.translated || {})[lang]);
      },
      async loadBatch() {
        try {
          const res = await this.$api.get("translatewizard/batch");
          this.batch.languages = res.languages || [];
          this.batch.pages = res.pages || [];
          if (!this.batch.languages.some((l) => l.code === this.batch.lang)) {
            this.batch.lang = this.batch.languages[0] ? this.batch.languages[0].code : null;
          }
        } catch (e) {
          this.batch.languages = [];
        }
      },
      // the dialog: asked first
      openBatch(lang, mode) {
        const pages = this.batchPagesOf(mode, lang.code);
        if (!pages.length) return;
        const chars = pages.reduce((sum, p) => sum + (p.chars || 0), 0);
        this.batch.result = null;
        this.batchDialog = { step: "ask", lang, mode, pages, chars };
        this.$panel.dialog.open({
          component: "pw-batch-dialog",
          props: { host: this },
          on: { close: () => this.onBatchClosed() }
        });
      },
      onBatchSubmit() {
        var _a, _b;
        const step = (_a = this.batchDialog) == null ? void 0 : _a.step;
        if (step === "ask") this.runBatch();
        else if (step === "done" && ((_b = this.batch.result) == null ? void 0 : _b.stopped)) this.runBatch(true);
        else this.$panel.dialog.close();
      },
      // cancel: before the start closes, while running stops after the
      // current page (the dialog stays until then)
      onBatchCancel() {
        var _a;
        if (((_a = this.batchDialog) == null ? void 0 : _a.step) === "run") this.batch.stop = true;
        else this.$panel.dialog.close();
      },
      // closed another way (Esc, outside): a run stops after its page
      onBatchClosed() {
        if (this.batch.running) this.batch.stop = true;
        this.batchDialog = null;
      },
      // one page after the other (each its own request: no time limit hit);
      // stoppable between two pages – and to be continued from there
      async runBatch(resume = false) {
        const { lang, mode, pages } = this.batchDialog;
        const from = resume ? this.batch.done : 0;
        const errors = resume && this.batch.result ? [...this.batch.result.errors] : [];
        Object.assign(this.batch, { lang: lang.code, mode, running: true, stop: false, done: from, total: pages.length, current: "", result: null });
        this.batchDialog = { ...this.batchDialog, step: "run" };
        for (const page of pages.slice(from)) {
          if (this.batch.stop) break;
          this.batch.current = page.title;
          try {
            await this.$api.post(page.path + "/translatewizard/translate", { to: lang.code });
          } catch (e) {
            errors.push({ path: page.path, title: page.title, message: e.message || String(e) });
          }
          this.batch.done++;
        }
        const chars = (list) => list.reduce((sum, p) => sum + (p.chars || 0), 0);
        const failed = errors.map((e) => e.path);
        this.batch.result = {
          done: this.batch.done - errors.length,
          doneChars: chars(pages.slice(0, this.batch.done).filter((p) => !failed.includes(p.path))),
          errors,
          stopped: this.batch.done < pages.length,
          left: pages.length - this.batch.done,
          leftChars: chars(pages.slice(this.batch.done))
        };
        this.batch.running = false;
        if (this.batchDialog) this.batchDialog = { ...this.batchDialog, step: "done" };
        this.loadDeeplUsage();
        this.loadBatch();
      },
      async loadDeeplUsage() {
        try {
          this.deeplUsage = (await this.$api.get("translatewizard/usage")).usage || null;
        } catch (e) {
          this.deeplUsage = null;
        }
      },
      onAiInput(values) {
        this.aiValues = values;
        this.updateAiDirty();
      },
      setAiSecrets(res) {
        this.aiSecrets = res.secrets || [];
        this.aiSecretsWritable = res.writable !== false;
        this.aiSecretInputs = {};
        this.checkAiSecrets();
      },
      // (not awaited: the services may take a moment)
      async checkAiSecrets() {
        try {
          const res = await this.$api.get("pagewizard/secrets/check");
          this.aiSecretValid = res.valid || {};
          this.aiSecretTypes = res.types || {};
        } catch (e) {
          this.aiSecretValid = {};
          this.aiSecretTypes = {};
        }
      },
      onSecretInput(env, value) {
        this.$set(this.aiSecretInputs, env, value);
        this.updateAiDirty();
      },
      updateAiDirty() {
        const settingsDirty = !!this.aiForm && JSON.stringify(this.aiValues) !== this.snapshots["ai"];
        const keysDirty = Object.values(this.aiSecretInputs).some((v) => v && v.trim() !== "");
        const fieldsDirty = JSON.stringify(this.translateValues) !== JSON.stringify(this.originalTranslateValues);
        this.$set(this.dirtyTabs, "ai", settingsDirty || keysDirty || fieldsDirty);
      },
      async removeSecret(secret) {
        if (!window.confirm(this.$t("prw.ai.keys.confirm", { label: secret.label }))) return;
        try {
          this.setAiSecrets(await this.$api.post("pagewizard/secrets", { remove: [secret.env] }));
          this.updateAiDirty();
          this.notifySaved(this.$t("prw.notify.ai.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.ai.error"));
        }
      },
      // --- Global: Exceptions ---
      // the tree follows the editor: the entry at the cursor opened and marked
      focusPatchesTree() {
        const input = this.$refs.patchesInput;
        if (!input) return;
        const path = this.patchesPathAt(this.patchesText, input.selectionStart);
        this.patchesFocus = path.length ? path : null;
      },
      // the JSON path at a position of the text (keys, list positions), read
      // as far as it goes – the text need not be complete or valid
      patchesPathAt(text, pos) {
        const stack = [];
        let lastString = null;
        let i = 0;
        const stringEnd = (start) => {
          let j = start + 1;
          while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
          return j;
        };
        while (i < text.length) {
          const ch = text[i];
          if (ch === '"') {
            const end = stringEnd(i);
            let str;
            try {
              str = JSON.parse(text.slice(i, end + 1));
            } catch (e) {
              str = text.slice(i + 1, end);
            }
            if (pos > i && pos <= end) {
              let k = end + 1;
              while (/\s/.test(text[k] || "")) k++;
              const top2 = stack[stack.length - 1];
              if (text[k] === ":" && top2 && !top2.list) top2.key = str;
              break;
            }
            if (i >= pos) break;
            lastString = str;
            i = end + 1;
            continue;
          }
          if (i >= pos) break;
          const top = stack[stack.length - 1];
          if (ch === ":" && top && !top.list) top.key = lastString;
          else if (ch === "{") stack.push({ list: false, key: null, index: 0 });
          else if (ch === "[") stack.push({ list: true, key: null, index: 0 });
          else if (ch === "}" || ch === "]") stack.pop();
          else if (ch === "," && top) {
            if (top.list) top.index++;
            else top.key = null;
          }
          i++;
        }
        const path = [];
        for (const entry of stack) {
          if (entry.list) path.push(String(entry.index));
          else if (entry.key !== null) path.push(entry.key);
          else break;
        }
        return path;
      },
      onPatchesInput() {
        this.patchesError = this.patchesCheck(this.patchesText);
        this.$set(this.dirtyTabs, "patches", this.patchesText !== this.originalPatchesText);
      },
      // the JSON's error with its line ('' when valid or empty)
      patchesCheck(text) {
        if (!text.trim()) return "";
        try {
          const data = JSON.parse(text);
          if (!data || typeof data !== "object" || Array.isArray(data)) return this.$t("prw.patches.object");
          return "";
        } catch (e) {
          const pos = Number((String(e.message).match(/position (\d+)/) || [])[1]);
          const line = isNaN(pos) ? null : text.slice(0, pos).split("\n").length;
          return this.$t("prw.patches.invalid") + (line ? " " + this.$t("prw.patches.line") + " " + line : "") + ": " + e.message;
        }
      },
      // the JSON coloured as in a code editor: keys, strings, numbers,
      // true/false/null, punctuation (escaped; a trailing line break so the
      // last line keeps its height)
      patchesHighlightedFor(text) {
        const esc2 = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],:])/g;
        let out = "";
        let last = 0;
        let m;
        while (m = re.exec(text)) {
          out += esc2(text.slice(last, m.index));
          if (m[1]) out += m[2] ? '<span class="is-key">' + esc2(m[1]) + '</span><span class="is-punct">' + esc2(m[2]) + "</span>" : '<span class="is-string">' + esc2(m[1]) + "</span>";
          else if (m[3]) out += '<span class="is-' + (m[3] === "null" ? "null" : "boolean") + '">' + m[3] + "</span>";
          else if (m[4]) out += '<span class="is-number">' + m[4] + "</span>";
          else out += '<span class="is-punct">' + esc2(m[5]) + "</span>";
          last = re.lastIndex;
        }
        return out + esc2(text.slice(last)) + "\n";
      },
      fitPatchesInput() {
        this.observePatchesWidth();
        const el = this.$refs.patchesInput;
        if (!el || !el.offsetParent) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      },
      // the topbar too narrow for the menus and the save buttons with their
      // texts: the buttons show their icon only (texts as tooltips)
      fitTopbar() {
        const bar = this.$refs.topbar;
        if (!bar) return;
        const fits = () => bar.scrollWidth <= bar.clientWidth + 1;
        bar.removeAttribute("data-compact");
        for (let step = 1; step <= 3 && !fits(); step++) {
          bar.setAttribute("data-compact", String(step));
        }
      },
      // the lines wrap anew with every other width (window, preview column,
      // panel menu) and the field is measured only while visible: measured
      // again whenever its width changes, also from hidden to shown
      observePatchesWidth() {
        const box = this.$refs.patchesCode;
        if (!box || this._patchesObserved === box || typeof ResizeObserver === "undefined") return;
        if (this._patchesObserver) this._patchesObserver.disconnect();
        let width = -1;
        this._patchesObserver = new ResizeObserver(([entry]) => {
          const w = Math.round(entry.contentRect.width);
          if (w === width) return;
          width = w;
          this.fitPatchesInput();
        });
        this._patchesObserver.observe(box);
        this._patchesObserved = box;
      },
      // the paths of the values that differ between two stored states
      // (objects compared key by key, lists and plain values as a whole)
      diffPaths(a, b, path = []) {
        const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
        if (isObj(a) || isObj(b)) {
          const x = isObj(a) ? a : {};
          const y = isObj(b) ? b : {};
          const keys = /* @__PURE__ */ new Set([...Object.keys(x), ...Object.keys(y)]);
          return [...keys].flatMap((k) => this.diffPaths(x[k], y[k], [...path, k]));
        }
        const empty = (v) => v === void 0 || v === null || v === "";
        if (empty(a) && empty(b)) return [];
        return JSON.stringify(a) === JSON.stringify(b) ? [] : [path];
      },
      // the element a value belongs to (element-heading-text → heading,
      // cite-spacing → quote, element-image-zoom → media …)
      elementGroupOf(name) {
        const key = name.replace(/^element-/, "").split("-")[0];
        return { cite: "quote", caption: "media", image: "media", slideshow: "media", video: "media", editor: "editor" }[key] || key;
      },
      // a menu's badge: how many of its pages have changes
      groupPending(group) {
        const keys = Object.keys(this.pendingCounts);
        if (group === "project") return keys.filter((k) => ["site", "header", "footer", "blocks", "fonts"].includes(k)).length;
        if (group === "elements") return keys.filter((k) => k.startsWith("element:")).length;
        if (group === "blocks") return keys.filter((k) => k.startsWith("block:")).length;
        return keys.filter((k) => ["translate", "generator", "patches"].includes(k)).length;
      },
      // the editable state (what a draft keeps; not the typed API keys)
      draftState() {
        return {
          blockOverrides: this.blockOverrides,
          blockValueOverrides: this.blockValueOverrides,
          globalOverrides: this.globalOverrides,
          elementOverrides: this.elementOverrides,
          fontOverrides: this.fontOverrides,
          navOverrides: this.navOverrides,
          footerOverrides: this.footerOverrides,
          aiValues: this.aiValues,
          translateValues: this.translateValues,
          activeBlocks: this.activeBlocks,
          activeVariants: this.activeVariants,
          patchesText: this.patchesText
        };
      },
      // the saved state the changes build on (a draft only fits it)
      draftBase() {
        return JSON.stringify({
          blockOverrides: this.originalOverrides,
          blockValueOverrides: this.originalBlockValueOverrides,
          globalOverrides: this.originalGlobalOverrides,
          elementOverrides: this.originalElementOverrides,
          fontOverrides: this.originalFontOverrides,
          navOverrides: this.originalNavOverrides,
          footerOverrides: this.originalFooterOverrides,
          aiValues: this.originalAiValues,
          translateValues: this.originalTranslateValues,
          activeBlocks: this.originalActiveBlocks,
          activeVariants: this.originalActiveVariants,
          patchesText: this.originalPatchesText
        });
      },
      // unsaved changes into the browser (removed once all is saved or discarded)
      saveDraft() {
        if (this.loading) return;
        try {
          const hasAny = Object.keys(this.pendingCounts).some((k) => !(k === "translate" || k === "generator")) || this.diffPaths(this.aiValues, this.originalAiValues).length || this.diffPaths(this.translateValues, this.originalTranslateValues).length;
          if (!hasAny) {
            localStorage.removeItem("pw-wizard-draft");
            return;
          }
          localStorage.setItem("pw-wizard-draft", JSON.stringify({ base: this.draftBase(), state: this.draftState() }));
        } catch (e) {
        }
      },
      // a draft of an earlier visit: back in place when it builds on the same
      // saved state (else saved in the meantime: the draft is dropped)
      restoreDraft() {
        let draft = null;
        try {
          draft = JSON.parse(localStorage.getItem("pw-wizard-draft") || "null");
        } catch (e) {
        }
        if (!draft || !draft.state) return;
        if (draft.base !== this.draftBase()) {
          try {
            localStorage.removeItem("pw-wizard-draft");
          } catch (e) {
          }
          return;
        }
        const st = draft.state;
        const copy = (v) => JSON.parse(JSON.stringify(v));
        for (const [bt, ov] of Object.entries(st.blockOverrides || {})) this.$set(this.blockOverrides, bt, copy(ov));
        for (const [bt, ov] of Object.entries(st.blockValueOverrides || {})) this.$set(this.blockValueOverrides, bt, copy(ov));
        for (const key of ["globalOverrides", "elementOverrides", "fontOverrides", "navOverrides", "footerOverrides", "aiValues", "translateValues"]) {
          if (st[key]) this[key] = copy(st[key]);
        }
        if (Array.isArray(st.activeBlocks)) {
          this.activeBlocks = [...st.activeBlocks];
          for (const block of this.blocks) block.active = this.activeBlocks.includes(block.blockType);
        }
        if (Array.isArray(st.activeVariants)) this.activeVariants = [...st.activeVariants];
        if (typeof st.patchesText === "string") this.patchesText = st.patchesText;
        this.discardKey++;
      },
      // a single save's success message: none while everything is saved at once
      notifySaved(message) {
        if (!this.savingAll) this.$panel.notification.success(message);
      },
      // save the changes of every page, one summary message
      async saveAll() {
        const pending = { ...this.pendingCounts };
        const pages = Object.keys(pending).length;
        if (!pages || this.savingAll) return;
        const cssBefore = await this.frontendCssVersion();
        const activation = this.globalSnapshot() !== this.snapshots["global"];
        this.savingAll = true;
        try {
          for (const key of Object.keys(pending).filter((k) => k.startsWith("block:"))) await this.saveBlock(key.slice(6));
          if (Object.keys(pending).some((k) => k.startsWith("element:"))) await this.saveElements();
          if (pending.header) await this.saveNavigation();
          if (pending.footer) await this.saveFooter();
          if (this.diffPaths(this.globalOverrides, this.originalGlobalOverrides).length) await this.saveGlobalSettings();
          if (pending.translate || pending.generator) await this.saveAi();
          if (pending.patches) await this.savePatches();
        } finally {
          this.savingAll = false;
        }
        const left = Object.keys(this.pendingCounts).length - (activation ? 1 : 0);
        if (left <= 0) this.$panel.notification.success(this.$t("prw.notify.saveAll", { count: pages }));
        if (activation) {
          await this.saveGlobal();
          return;
        }
        try {
          await fetch(window.location.origin, { cache: "no-store" });
        } catch (e) {
        }
        this.reloadFrontend(cssBefore);
      },
      confirmDiscardAll() {
        this.$panel.dialog.open({
          component: "k-text-dialog",
          props: {
            text: this.$t("prw.discardAll.confirm", { count: this.pendingPageCount }),
            submitButton: { text: this.$t("prw.discardAll"), icon: "undo", theme: "negative" }
          },
          on: {
            submit: () => {
              this.$panel.dialog.close();
              this.discardAll();
            }
          }
        });
      },
      // every page back to its saved state
      discardAll() {
        const copy = (v) => JSON.parse(JSON.stringify(v || {}));
        this.activeBlocks = [...this.originalActiveBlocks];
        this.activeVariants = [...this.originalActiveVariants];
        for (const block of this.blocks) {
          block.active = this.activeBlocks.includes(block.blockType);
          this.$set(this.blockOverrides, block.blockType, copy(this.originalOverrides[block.blockType]));
          if (this.blockValueOverrides[block.blockType] !== void 0) {
            this.$set(this.blockValueOverrides, block.blockType, copy(this.originalBlockValueOverrides[block.blockType]));
          }
        }
        this.globalOverrides = copy(this.originalGlobalOverrides);
        this.elementOverrides = copy(this.originalElementOverrides);
        this.fontOverrides = copy(this.originalFontOverrides);
        this.navOverrides = copy(this.originalNavOverrides);
        this.footerOverrides = copy(this.originalFooterOverrides);
        this.aiValues = copy(this.originalAiValues);
        this.translateValues = copy(this.originalTranslateValues);
        this.aiSecretInputs = {};
        this.patchesText = this.originalPatchesText;
        this.patchesError = "";
        for (const key of Object.keys(this.dirtyTabs)) this.$set(this.dirtyTabs, key, false);
        this.discardKey++;
      },
      // an entry of the tree into the JSON: its path with its current value
      // (nested objects; what the JSON holds there already is replaced)
      // the blocks' plugin settings with the exceptions anew (after saving
      // them): options, start values and values in the block pages follow at
      // once; the unsaved changes (blockOverrides) stay untouched
      async reloadBlockDefaults() {
        try {
          const res = await this.$api.get("projectwizard/blocks");
          const byType = Object.fromEntries((res.blocks || []).map((b) => [b.blockType, b]));
          this.blocks = this.blocks.map((b) => byType[b.blockType] ? { ...b, settings: byType[b.blockType].settings, editor: byType[b.blockType].editor } : b);
        } catch (e) {
        }
        await Promise.all(this.blocks.map(async (block) => {
          const type = block.blockType;
          try {
            this.$set(this.blockConfigs, type, await this.$api.get("projectwizard/block/" + type));
          } catch (e) {
          }
          if (!this.blockValueDefaults[type]) return;
          try {
            const values = await this.$api.get("projectwizard/values/" + type);
            if (values.defaults && !Array.isArray(values.defaults)) this.$set(this.blockValueDefaults, type, values.defaults);
          } catch (e) {
          }
        }));
      },
      // the preview: the own settings and values without those the exceptions
      // set (these apply, as in the pagewizard)
      shownOverrides(blockType) {
        const own = this.blockOverrides[blockType] || {};
        const patch = { ...this.savedPatches[blockType] || {} };
        delete patch.editor;
        delete patch.values;
        if (!own.settings) return own;
        return { ...own, settings: withoutPatched(own.settings, patch) || {} };
      },
      shownValueOverrides(blockType) {
        return withoutPatchedValues(this.blockValueOverrides[blockType] || {}, this.valuesPatch(blockType));
      },
      // a block's values the exceptions set (values › group › vars / colors)
      valuesPatch(blockType) {
        var _a;
        const values = (_a = this.savedPatches[blockType]) == null ? void 0 : _a.values;
        return values && typeof values === "object" ? values : null;
      },
      // what currently applies per block (plugin, exceptions, wizard settings),
      // fresh on each visit of the page and after saving the exceptions
      async loadPatchesTree() {
        try {
          this.patchesTree = await this.$api.get("projectwizard/patches/tree");
        } catch (e) {
        }
      },
      takePatch({ path, value }) {
        let data = {};
        if (this.patchesText.trim()) {
          try {
            data = JSON.parse(this.patchesText);
          } catch (e) {
            this.$panel.notification.error(this.patchesCheck(this.patchesText));
            return;
          }
        }
        let node = data;
        path.slice(0, -1).forEach((key) => {
          if (!node[key] || typeof node[key] !== "object" || Array.isArray(node[key])) node[key] = {};
          node = node[key];
        });
        node[path[path.length - 1]] = JSON.parse(JSON.stringify(value));
        this.patchesText = JSON.stringify(data, null, 2) + "\n";
        this.onPatchesInput();
        this.$nextTick(() => this.jumpToPatch(path));
      },
      // to the entry just taken: its key selected in the field, scrolled into
      // view (its place measured in the coloured copy, so wrapped lines count)
      jumpToPatch(path) {
        const text = this.patchesText;
        let pos = 0;
        for (const key of path) {
          if (typeof key === "number" || /^\d+$/.test(String(key))) continue;
          const at = text.indexOf('"' + key + '":', pos);
          if (at < 0) break;
          pos = at;
        }
        const lastKey = String(path[path.length - 1]);
        const input = this.$refs.patchesInput;
        const hl = this.$refs.patchesHl;
        if (!input || !hl) return;
        this.fitPatchesInput();
        input.focus({ preventScroll: true });
        input.setSelectionRange(pos, pos + lastKey.length + 2);
        let rest = pos;
        const walker = document.createTreeWalker(hl, NodeFilter.SHOW_TEXT);
        let nodeAt = null;
        while (walker.nextNode()) {
          const len = walker.currentNode.nodeValue.length;
          if (rest <= len) {
            nodeAt = walker.currentNode;
            break;
          }
          rest -= len;
        }
        if (!nodeAt) return;
        const range = document.createRange();
        range.setStart(nodeAt, rest);
        range.setEnd(nodeAt, rest);
        const rect = range.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: "smooth" });
      },
      async savePatches() {
        this.patchesError = this.patchesCheck(this.patchesText);
        if (this.patchesError) {
          this.$panel.notification.error(this.patchesError);
          return;
        }
        try {
          const res = await this.$api.post("projectwizard/patches", { text: this.patchesText });
          this.originalPatchesText = this.patchesText;
          this.patchesUnknown = res.unknown || [];
          this.$set(this.dirtyTabs, "patches", false);
          this.loadPatchesTree();
          this.reloadBlockDefaults();
          this.notifySaved(this.$t("prw.notify.patches.success"));
        } catch (e) {
          this.patchesError = e.message || String(e);
          this.$panel.notification.error(this.$t("prw.notify.patches.error"));
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
            if (set.DEEPL_API_KEY) this.loadDeeplUsage();
          }
          if (this.translateTree && JSON.stringify(this.translateValues) !== JSON.stringify(this.originalTranslateValues)) {
            this.setTranslateTree((await this.$api.post("translatewizard/fields", { fields: this.translateValues })).tree);
          }
          this.updateAiDirty();
          this.notifySaved(this.$t("prw.notify.ai.success"));
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
          this.notifySaved(this.$t("prw.notify.footer.success"));
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
          this.notifySaved(this.$t("prw.notify.elements.success"));
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
      // a variant's block background (override, else the plugin's)
      variantBackground(theme) {
        var _a, _b, _c;
        return ((this.globalOverrides.global || {})[theme] || {})["block-background"] || ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b["block-background"]) == null ? void 0 : _c[theme]) || "#ffffff";
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
      blockPreviewLinkStyle(theme, state2) {
        var _a, _b, _c;
        const key = "block-link" + (state2 || "");
        const colorOv = ((this.globalOverrides.global || {})[theme] || {})[key];
        const colorDef = ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b[key]) == null ? void 0 : _c[theme]) || "#1D548B";
        const decoration = this.globalLayoutValue("block-link-decoration") || "none";
        return {
          color: colorOv || colorDef,
          textDecorationLine: decoration === "always" ? "underline" : "none",
          fontWeight: this.globalLayoutValue("block-link-weight") === "bold" ? 700 : null,
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
      blockPreviewLinkColor(theme, state2) {
        var _a, _b, _c;
        const key = "block-link" + (state2 || "");
        const colorOv = ((this.globalOverrides.global || {})[theme] || {})[key];
        return colorOv || ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b[key]) == null ? void 0 : _c[theme]) || "#1D548B";
      },
      // (shared with the panel's block previews)
      injectFontFaces() {
        injectFontFaces(this.fontsData);
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
          this.notifySaved(this.$t("prw.notify.header.success"));
        } catch (e) {
          this.$panel.notification.error(this.$t("prw.notify.header.error"));
        }
      },
      // --- Block overrides ---
      // a block opened: the preview (and the colour cards) start with the
      // variant a new block of it starts with
      showStartTheme() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
        const blockType = this.activeTab;
        if (!blockType || blockType === "global" || !this.blockConfigs[blockType]) return;
        this.itemColorTheme = ((_e = (_d = (_c = (_b = (_a = this.blockOverrides[blockType]) == null ? void 0 : _a.settings) == null ? void 0 : _b.fields) == null ? void 0 : _c.style) == null ? void 0 : _d.theme) == null ? void 0 : _e.default) || ((_k = (_j = (_i = (_h = (_g = (_f = this.blockConfigs[blockType]) == null ? void 0 : _f.defaults) == null ? void 0 : _g.settings) == null ? void 0 : _h.fields) == null ? void 0 : _i.style) == null ? void 0 : _j.theme) == null ? void 0 : _k.default) || "default";
        this.$delete(this.stepPreviewStyle, blockType);
      },
      onBlockOverridesUpdate(blockType, overrides) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H;
        overrides = JSON.parse(JSON.stringify(overrides || {}));
        this.$set(this.blockOverrides, blockType, overrides);
        const theme = ((_d = (_c = (_b = (_a = overrides == null ? void 0 : overrides.settings) == null ? void 0 : _a.fields) == null ? void 0 : _b.style) == null ? void 0 : _c.theme) == null ? void 0 : _d.default) || ((_j = (_i = (_h = (_g = (_f = (_e = this.blockConfigs[blockType]) == null ? void 0 : _e.defaults) == null ? void 0 : _f.settings) == null ? void 0 : _g.fields) == null ? void 0 : _h.style) == null ? void 0 : _i.theme) == null ? void 0 : _j.default) || "default";
        if (this.startThemes[blockType] !== void 0 && this.startThemes[blockType] !== theme) {
          this.itemColorTheme = theme;
        }
        this.$set(this.startThemes, blockType, theme);
        const itemStyle = (_n = (_m = (_l = (_k = overrides == null ? void 0 : overrides.settings) == null ? void 0 : _k.fields) == null ? void 0 : _l.style) == null ? void 0 : _m["item-style"]) == null ? void 0 : _n.default;
        if (blockType in this.startItemStyles && this.startItemStyles[blockType] !== itemStyle) {
          this.$delete(this.stepPreviewStyle, blockType);
        }
        this.$set(this.startItemStyles, blockType, itemStyle);
        const sectionLayout = (_r = (_q = (_p = (_o = overrides == null ? void 0 : overrides.settings) == null ? void 0 : _o.fields) == null ? void 0 : _p.style) == null ? void 0 : _q["section-layout"]) == null ? void 0 : _r.default;
        if (blockType in this.startSectionLayouts && this.startSectionLayouts[blockType] !== sectionLayout) {
          this.$delete(this.featurePreviewLayout, blockType);
        }
        this.$set(this.startSectionLayouts, blockType, sectionLayout);
        const heroHeight = (_v = (_u = (_t = (_s = overrides == null ? void 0 : overrides.settings) == null ? void 0 : _s.fields) == null ? void 0 : _t.style) == null ? void 0 : _u.height) == null ? void 0 : _v.default;
        if (blockType in this.startHeroHeights && this.startHeroHeights[blockType] !== heroHeight) {
          this.$delete(this.heroPreviewHeight, blockType);
        }
        this.$set(this.startHeroHeights, blockType, heroHeight);
        const cardDisplay = (_z = (_y = (_x = (_w = overrides == null ? void 0 : overrides.settings) == null ? void 0 : _w.fields) == null ? void 0 : _x.style) == null ? void 0 : _y["card-display"]) == null ? void 0 : _z.default;
        if (blockType in this.startCardDisplays && this.startCardDisplays[blockType] !== cardDisplay) {
          this.$delete(this.cardPreviewDisplay, blockType);
        }
        this.$set(this.startCardDisplays, blockType, cardDisplay);
        const spacing = (_D = (_C = (_B = (_A = overrides == null ? void 0 : overrides.settings) == null ? void 0 : _A.fields) == null ? void 0 : _B.layout) == null ? void 0 : _C["item-spacing"]) == null ? void 0 : _D.default;
        if (spacing === "own" && this.blockValueDefaults[blockType]) this.seedOwnSpacing(blockType);
        for (const part of ["title", "text"]) {
          const entry = (_H = (_G = (_F = (_E = overrides == null ? void 0 : overrides.settings) == null ? void 0 : _E.fields) == null ? void 0 : _F.layout) == null ? void 0 : _G["item-entry-" + part]) == null ? void 0 : _H.default;
          if (entry === "own" && this.blockValueDefaults[blockType]) this.seedOwnEntry(blockType, part);
        }
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
        this._pendingTab = tab;
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
          if (tab === "blocks") {
            if (this.dirtyTabs["global-settings"]) await this.saveGlobalSettings();
            if (this.dirtyTabs["global"]) await this.saveGlobal();
          } else if (["site", "fonts"].includes(tab)) {
            await this.saveGlobalSettings();
          } else if (tab === "elements") {
            await this.saveElements();
          } else if (tab === "header") {
            await this.saveNavigation();
          } else if (tab === "footer") {
            await this.saveFooter();
          } else if (tab === "translate" || tab === "generator") {
            await this.saveAi();
          } else if (tab === "patches") {
            await this.savePatches();
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
        announcePreviewSaved();
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
          if (tab === "blocks") {
            this.activeBlocks = [...this.originalActiveBlocks];
            this.activeVariants = [...this.originalActiveVariants];
            for (const block of this.blocks) {
              block.active = this.activeBlocks.includes(block.blockType);
            }
            this.$set(this.dirtyTabs, "global", false);
          }
          if (["site", "blocks", "fonts"].includes(tab)) {
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
          } else if (tab === "patches") {
            this.patchesText = this.originalPatchesText;
            this.patchesError = "";
            this.$set(this.dirtyTabs, "patches", false);
          } else if (tab === "translate" || tab === "generator") {
            this.aiValues = JSON.parse(JSON.stringify(this.originalAiValues));
            this.translateValues = JSON.parse(JSON.stringify(this.originalTranslateValues));
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
          this.notifySaved(this.$t("prw.notify.blocks.success"));
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
          this.notifySaved(this.$t("prw.notify.global.success"));
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
          if (this.hasDesign(blockType)) {
            const valuesRes = await this.$api.post(
              "projectwizard/values/" + blockType,
              this.blockValueOverrides[blockType] || {}
            );
            const ov = valuesRes.overrides && !Array.isArray(valuesRes.overrides) ? valuesRes.overrides : {};
            this.$set(this.blockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
            this.$set(this.originalBlockValueOverrides, blockType, JSON.parse(JSON.stringify(ov)));
            this.$set(this.snapshots, blockType + ":values", JSON.stringify(ov));
          }
          this.notifySaved(this.$t("prw.notify.block.success", { block: this.blockLabel(blockType) }));
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
  var _sfc_render$n = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-panel-inside", { staticClass: "pw-wizard", style: { "--pw-body-background": _vm.bodyBackgroundColor }, attrs: { "data-preview": _vm.showPreview ? "on" : "off", "data-full": _vm.fullWidthPage ? "true" : null } }, [_c("pw-portal", { attrs: { "to": ".pw-wizard .k-topbar" } }, [_c("div", { ref: "topbar", staticClass: "pw-topbar" }, [!_vm.loading ? _c("div", { staticClass: "pw-pill pw-tabs", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "title": _vm.$t("prw.tab.project"), "aria-haspopup": "menu", "aria-pressed": _vm.isGlobalTab(..._vm.projectMenuTabs) ? "true" : "false" }, on: { "click": function($event) {
      return _vm.$refs.settingsMenu.toggle();
    } } }, [_c("k-icon", { attrs: { "type": "sitemap" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.project")))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } }), _vm.groupPending("project") ? _c("span", { staticClass: "pw-change-badge" }, [_vm._v(_vm._s(_vm.groupPending("project")))]) : _vm._e()], 1), _c("k-dropdown-content", { ref: "settingsMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, [_vm._l(_vm.projectMenuTabs.map((key) => _vm.globalTabs.find((t) => t.key === key)).filter(Boolean), function(tab, idx) {
      return [_c("button", { key: tab.key, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.isGlobalTab(tab.key) ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.settingsMenu.close();
        _vm.openGlobal(tab.key);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": tab.icon } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab." + tab.key))), _vm.pendingCounts[tab.key] ? _c("span", { staticClass: "pw-change-count" }, [_vm._v(_vm._s(_vm.pendingCounts[tab.key]))]) : _vm._e()])])];
    })], 2)])], 1)]) : _vm._e(), !_vm.loading ? _c("div", { staticClass: "pw-pill pw-tabs", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "title": _vm.$t("prw.tab.elements"), "aria-haspopup": "menu", "aria-pressed": _vm.isGlobalTab("elements") ? "true" : "false" }, on: { "click": function($event) {
      return _vm.$refs.elementsMenu.toggle();
    } } }, [_c("k-icon", { attrs: { "type": "layers" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.elements")))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } }), _vm.groupPending("elements") ? _c("span", { staticClass: "pw-change-badge" }, [_vm._v(_vm._s(_vm.groupPending("elements")))]) : _vm._e()], 1), _c("k-dropdown-content", { ref: "elementsMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, _vm._l(_vm.elementOptions, function(option) {
      return _c("button", { key: option.value, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.isGlobalTab("elements") && _vm.selectedElement === option.value ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.elementsMenu.close();
        _vm.selectedElement = option.value;
        _vm.openGlobal("elements", option.value);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": option.icon } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(option.text)), _vm.pendingCounts["element:" + option.value] ? _c("span", { staticClass: "pw-change-count" }, [_vm._v(_vm._s(_vm.pendingCounts["element:" + option.value]))]) : _vm._e()])]);
    }), 0)])], 1)]) : _vm._e(), !_vm.loading ? _c("div", { staticClass: "pw-pill", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "title": _vm.$t("prw.tab.blocks"), "aria-haspopup": "menu", "aria-pressed": _vm.activeTab !== "global" ? "true" : "false" }, on: { "click": function($event) {
      _vm.$refs.blocksMenu.toggle();
      _vm.loadBlockUsage();
    } } }, [_c("k-icon", { attrs: { "type": "box" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.blocks")))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } }), _vm.groupPending("blocks") ? _c("span", { staticClass: "pw-change-badge" }, [_vm._v(_vm._s(_vm.groupPending("blocks")))]) : _vm._e()], 1), _c("k-dropdown-content", { ref: "blocksMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, [_vm.activeBlockEntries.length ? _vm._l(_vm.activeBlockEntries, function(entry) {
      return _c("button", { key: entry.blockType, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.activeTab === entry.blockType ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.blocksMenu.close();
        _vm.$go("projectwizard/block/" + entry.blockType);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": entry.icon || "box" } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(" " + _vm._s(_vm.blockLabel(entry.blockType))), _vm.pendingCounts["block:" + entry.blockType] ? _c("span", { staticClass: "pw-change-count" }, [_vm._v(_vm._s(_vm.pendingCounts["block:" + entry.blockType]))]) : _vm._e(), _vm.blockUsage[entry.blockType] !== void 0 ? _c("span", { staticClass: "pw-menu-count" }, [_vm._v(_vm._s(_vm.blockUsage[entry.blockType]))]) : _vm._e()])]);
    }) : _vm._e()], 2)])], 1)]) : _vm._e(), !_vm.loading ? _c("div", { staticClass: "pw-pill pw-tabs", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "title": _vm.$t("prw.tab.config"), "aria-haspopup": "menu", "aria-pressed": _vm.isGlobalTab(..._vm.configMenuTabs) ? "true" : "false" }, on: { "click": function($event) {
      return _vm.$refs.configMenu.toggle();
    } } }, [_c("k-icon", { attrs: { "type": "cog" } }), _c("span", { staticClass: "pw-tab-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab.config")))]), _c("k-icon", { staticClass: "pw-tab-menu-chevron", attrs: { "type": "angle-down" } }), _vm.groupPending("config") ? _c("span", { staticClass: "pw-change-badge" }, [_vm._v(_vm._s(_vm.groupPending("config")))]) : _vm._e()], 1), _c("k-dropdown-content", { ref: "configMenu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, _vm._l(_vm.configMenuTabs.map((key) => _vm.globalTabs.find((t) => t.key === key)).filter(Boolean), function(tab) {
      return _c("button", { key: tab.key, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "data-has-icon": "true", "aria-current": _vm.isGlobalTab(tab.key) ? "true" : void 0 }, on: { "click": function($event) {
        _vm.$refs.configMenu.close();
        _vm.openGlobal(tab.key);
      } } }, [_c("span", { staticClass: "k-button-icon" }, [_c("k-icon", { attrs: { "type": tab.icon } })], 1), _c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.tab." + tab.key))), _vm.pendingCounts[tab.key] ? _c("span", { staticClass: "pw-change-count" }, [_vm._v(_vm._s(_vm.pendingCounts[tab.key]))]) : _vm._e()])]);
    }), 0)])], 1)]) : _vm._e(), _vm.pendingPageCount ? _c("div", { staticClass: "k-form-controls pw-topbar-controls" }, [_c("div", { staticClass: "k-button-group", attrs: { "data-layout": "collapsed" } }, [_c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": _vm.$t("discard"), "title": _vm.$t("discard"), "icon": "undo", "theme": "notice", "variant": "filled", "size": "sm" }, on: { "click": _vm.confirmDiscardAll } }), _c("k-button", { staticClass: "k-form-controls-button", attrs: { "text": _vm.$t("save"), "title": _vm.$t("save"), "icon": "check", "theme": "notice", "variant": "filled", "size": "sm", "disabled": _vm.savingAll }, on: { "click": _vm.saveAll } })], 1)]) : _vm._e()])]), _vm.loading ? _c("div", { staticClass: "pw-welcome pw-wizard-loading" }, [_c("k-icon", { staticClass: "pw-welcome-icon", attrs: { "type": "loader" } }), _c("div", { staticClass: "pw-welcome-text" }, [_c("h1", { staticClass: "pw-welcome-title" }, [_vm._v(_vm._s(_vm.$t("prw.area.title")))]), _c("p", { staticClass: "pw-welcome-slogan", attrs: { "aria-label": _vm.$t("prw.welcome.slogan") } }, [_c("span", { attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(_vm.$t("prw.welcome.slogan").slice(0, _vm.sloganTyped)))]), _c("span", { staticClass: "pw-typewriter-caret", class: { "is-done": !_vm.sloganCaret }, attrs: { "aria-hidden": "true" } }), _c("span", { staticClass: "pw-typewriter-rest", attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(_vm.$t("prw.welcome.slogan").slice(_vm.sloganTyped)))])]), _c("p", { staticClass: "pw-welcome-stats", staticStyle: { "visibility": "hidden" }, attrs: { "aria-hidden": "true" } }, [_vm._v("·")])])], 1) : _c("div", { staticClass: "pw-wizard-columns" }, [_c("div", { staticClass: "pw-wizard-content" }, [!_vm.loading && _vm.activeTab === "global" && _vm.globalActiveTab !== "welcome" ? _c("div", { staticClass: "pw-page-title-row", class: { "has-intro": _vm.globalPageIntro } }, [_vm.globalPageIcon ? _c("k-icon", { staticClass: "pw-page-title-icon", attrs: { "type": _vm.globalPageIcon } }) : _vm._e(), _c("h1", { staticClass: "pw-page-title" }, [_vm._v(_vm._s(_vm.globalPageTitle))]), _vm.globalActiveTab === "translate" && _vm.batch.languages.length ? _c("div", { staticClass: "pw-tab-menu pw-ai-batch-menu" }, [_c("k-button", { attrs: { "icon": "translatewizard-translate", "text": _vm.$t("prw.translate.batch"), "dropdown": true, "variant": "filled", "size": "sm", "disabled": !!_vm.dirtyTabs["ai"] || _vm.batch.running, "title": _vm.dirtyTabs["ai"] ? _vm.$t("prw.translate.batch.unsaved") : null }, on: { "click": function($event) {
      return _vm.$refs.batchMenu.toggle();
    } } }), _c("k-dropdown-content", { ref: "batchMenu", attrs: { "align-x": "end" } }, [_c("nav", { staticClass: "k-navigate" }, [_vm._l(_vm.batch.languages, function(lang, i) {
      return [i ? _c("hr", { key: "sep-" + lang.code }) : _vm._e(), _c("p", { key: "head-" + lang.code, staticClass: "pw-menu-heading" }, [_vm._v(_vm._s(lang.name))]), _vm._l(["missing", "all"], function(mode) {
        return _c("button", { key: lang.code + "-" + mode, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "disabled": !_vm.batchPagesOf(mode, lang.code).length }, on: { "click": function($event) {
          _vm.$refs.batchMenu.close();
          _vm.openBatch(lang, mode);
        } } }, [_c("span", { staticClass: "k-button-text" }, [_vm._v(" " + _vm._s(_vm.$t("prw.translate.batch." + mode)) + " "), _c("span", { staticClass: "pw-menu-count" }, [_vm._v(_vm._s(_vm.batchPagesOf(mode, lang.code).length))])])]);
      })];
    })], 2)])], 1) : _vm._e()], 1) : _vm._e(), !_vm.loading && _vm.activeTab === "global" && _vm.globalPageIntro ? _c("p", { staticClass: "pw-block-view-intro", domProps: { "innerHTML": _vm._s(_vm.globalPageIntro) } }) : _vm._e(), !_vm.loading && _vm.activeTab !== "global" ? [_c("div", { staticClass: "pw-page-title-row pw-page-title-row-tabs" }, [_c("k-icon", { staticClass: "pw-page-title-icon", attrs: { "type": (_vm.activeBlockEntries.find((e) => e.blockType === _vm.activeTab) || {}).icon || "box" } }), _c("h1", { staticClass: "pw-page-title" }, [_vm._v(_vm._s(_vm.blockLabel(_vm.activeTab)))]), _c("k-tabs", { staticClass: "pw-block-view-tabs", attrs: { "tab": _vm.currentBlockView, "tabs": _vm.blockViewTabs } })], 1), _c("p", { staticClass: "pw-block-view-intro" }, [_vm._v(_vm._s(_vm.$t("prw.view." + _vm.currentBlockView + ".intro")))])] : _vm._e(), _vm.activeTab === "global" ? _c("div", { staticClass: "pw-wizard-panel" }, [_vm.globalActiveTab === "welcome" ? _c("div", { staticClass: "pw-welcome" }, [_c("span", { staticClass: "pw-welcome-wand" }, [_c("k-icon", { staticClass: "pw-welcome-icon", attrs: { "type": "wand" } }), _vm._l(5, function(n) {
      return _c("svg", { key: "star-" + n, staticClass: "pw-welcome-star", class: "is-" + n, attrs: { "viewBox": "0 0 24 24", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" } })]);
    })], 2), _c("div", { staticClass: "pw-welcome-text" }, [_c("h1", { staticClass: "pw-welcome-title" }, [_vm._v(_vm._s(_vm.$t("prw.area.title")))]), _c("p", { staticClass: "pw-welcome-slogan", attrs: { "aria-label": _vm.$t("prw.welcome.slogan") } }, [_c("span", { attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(_vm.$t("prw.welcome.slogan").slice(0, _vm.sloganTyped)))]), _c("span", { staticClass: "pw-typewriter-caret", class: { "is-done": !_vm.sloganCaret }, attrs: { "aria-hidden": "true" } }), _c("span", { staticClass: "pw-typewriter-rest", attrs: { "aria-hidden": "true" } }, [_vm._v(_vm._s(_vm.$t("prw.welcome.slogan").slice(_vm.sloganTyped)))])]), _c("p", { staticClass: "pw-welcome-stats", class: { "is-shown": _vm.statsShown } }, [_vm._v(_vm._s(_vm.$t("prw.welcome.stats", { blocks: _vm.blockUsageTotal === null ? "…" : _vm.blockUsageTotal, pages: _vm.sitePageCount === null ? "…" : _vm.sitePageCount, variants: _vm.activeVariants.length + 1 })))])])]) : _vm._e(), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "site", expression: "globalActiveTab === 'site'" }], staticClass: "pw-wizard-global-content" }, [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-only": ["body-background"], "vars-only": true, "hide-section-headers": true }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1)])]), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "blocks", expression: "globalActiveTab === 'blocks'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === "global" && _vm.globalActiveTab === "blocks", expression: "activeTab === 'global' && globalActiveTab === 'blocks'" }], staticClass: "pw-element-preview-side" }, [_c("div", { staticClass: "pw-preview-switches" }, [_c("div", { staticClass: "pw-pill pw-preview-bp pw-preview-theme", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "bpt-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentBlocksColorTheme === t ? "true" : "false" }, on: { "click": function($event) {
        _vm.blocksColorTheme = t;
      } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0), _c("div", { staticClass: "pw-pill pw-guides-switch", attrs: { "role": "group" } }, [_c("button", { staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t("prw.preview.guides"), "aria-label": _vm.$t("prw.preview.guides"), "aria-pressed": _vm.previewGuides ? "true" : "false" }, on: { "click": function($event) {
      _vm.previewGuides = !_vm.previewGuides;
    } } }, [_c("k-icon", { attrs: { "type": "prw-guides" } })], 1)]), _c("pw-device-select", { model: { value: _vm.blocksPreviewBp, callback: function($$v) {
      _vm.blocksPreviewBp = $$v;
    }, expression: "blocksPreviewBp" } })], 1), _c("div", { staticClass: "pw-block-preview-body", style: _vm.blockPreviewBodyStyle }, [_c("div", { staticClass: "pw-block-preview-row pw-block-preview-spaced", class: { "has-guides": _vm.previewGuides }, style: _vm.blockPreviewMarginStyle }, _vm._l([_vm.currentBlocksColorTheme], function(theme) {
      return _c("div", { key: theme, staticClass: "pw-block-preview", class: { "has-guides": _vm.previewGuides }, style: _vm.blockPreviewStyle(theme, true) }, [_c("div", { staticClass: "pw-block-preview-content pw-block-preview-text" }, [_c("p", { style: _vm.blockPreviewElementStyle("editor", theme, _vm.blocksPreviewBp) }, [_vm._v(_vm._s(_vm.$t("prw.preview.text.before")) + " "), _c("a", { class: "pw-preview-link-" + theme, style: _vm.blockPreviewLinkStyle(theme, "") }, [_vm._v(_vm._s(_vm.$t("prw.preview.text.link")))]), _vm._v(_vm._s(_vm.$t("prw.preview.text.after")))]), _c("p", { style: { ..._vm.blockPreviewElementStyle("editor", theme, _vm.blocksPreviewBp), marginTop: _vm.blockPreviewParagraphSpacing() } }, [_vm._v(_vm._s(_vm.$t("prw.sample.editor.2")))])])]);
    }), 0)])])]), _c("div", { staticClass: "pw-blocks-active" }, [_c("pw-global-elements", { attrs: { "blocks": _vm.blocks, "usage": _vm.blockUsage }, on: { "toggle": function($event) {
      return _vm.toggleBlock($event.blockType, $event.checked);
    } } }), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.label.variants")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(["variant", "variant2", "variant3"], function(variant) {
      return _c("div", { key: variant, staticClass: "pw-field-row pw-active-row", class: { "is-inactive": !_vm.activeVariants.includes(variant) } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-active-label" }, [_c("span", { staticClass: "pw-variant-dot", style: { backgroundColor: _vm.variantBackground(variant) } }), _c("span", [_vm._v(_vm._s(_vm.$t("pw.option." + variant)))])])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggle-input", { attrs: { "value": _vm.activeVariants.includes(variant) }, on: { "input": function($event) {
        return _vm.toggleVariant(variant, $event);
      } } })], 1)])])]);
    }), 0), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.variants") } })], 1)], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.paddings")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("div", { staticClass: "pw-field-row", attrs: { "data-guide": _vm.previewGuides ? "padding" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.leftRight")))])]), _c("div", { staticClass: "pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid" }, _vm._l(_vm.paddingSides.filter((sd) => !sd.pair), function(side) {
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
    }), 0)])])])]), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.blocksPaddings") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.margins")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("div", { staticClass: "pw-field-row", attrs: { "data-guide": _vm.previewGuides ? "margin" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.topBottom")))])]), _c("div", { staticClass: "pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid" }, _vm._l(_vm.marginSides, function(side) {
      return _c("span", { key: side.key, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", attrs: { "type": "text", "inputmode": "decimal", "step": "0.1", "min": "0", "max": "20" }, domProps: { "value": parseFloat(_vm.paddingValue(side)) || 0 }, on: { "change": function($event) {
        return _vm.setPadding(side, $event.target.value);
      } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("rem")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(Math.round((parseFloat(_vm.paddingValue(side)) || 0) * 16)) + "px")]), _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": "grid-" + side.key } })], 1);
    }), 0)])])])]), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.blocksMargins") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.shape")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.element.button-shape")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.radiusShape, "options": [{ value: "square", text: _vm.$t("pw.option.square") }, { value: "custom", text: _vm.$t("pw.option.round") }], "grow": false, "required": true }, on: { "input": _vm.setRadiusShape } })], 1)])])]), _vm.radiusShape === "custom" ? _c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": ["global-"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } }) : _vm._e()], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.blocksShape") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "bt-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentBlocksColorTheme === t ? "true" : "false" }, on: { "click": function($event) {
        _vm.blocksColorTheme = t;
      } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(t) } }), _vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": [], "show-colors": true, "theme": _vm.currentBlocksColorTheme, "hide-color-names": ["block-link"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.blocksColors") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.links")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "lk-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentBlocksColorTheme === t ? "true" : "false" }, on: { "click": function($event) {
        _vm.blocksColorTheme = t;
      } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(t) } }), _vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": ["block-link-decoration", "block-link-weight", "block-link-thickness", "block-link-offset"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } }), _c("pw-global-navigation", { attrs: { "nav-defaults": _vm.globalDefaults, "nav-overrides": _vm.globalOverrides, "saved-overrides": _vm.originalGlobalOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "hide-section-headers": true, "show-only": [], "show-colors": true, "theme": _vm.currentBlocksColorTheme, "color-names": ["block-link"] }, on: { "update:overrides": _vm.onGlobalOverridesUpdate } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.blocksLinks") } })], 1)], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "fonts", expression: "globalActiveTab === 'fonts'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === "global" && _vm.globalActiveTab === "fonts", expression: "activeTab === 'global' && globalActiveTab === 'fonts'" }] }, [_c("div", { staticClass: "pw-preview-switches" }, [_c("div", { staticClass: "pw-pill pw-font-preview-select", attrs: { "role": "group" } }, [_c("div", { staticClass: "pw-tab-menu" }, [_c("button", { staticClass: "pw-tool pw-tab", attrs: { "type": "button", "aria-haspopup": "menu" }, on: { "click": function($event) {
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
    }), 0), _c("pw-global-navigation", { attrs: { "nav-defaults": _vm.navDefaults, "nav-overrides": _vm.navOverrides, "saved-overrides": _vm.originalNavOverrides, "discard-key": _vm.discardKey, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "show-group": _vm.headerPill, "show-only": _vm.headerNavShowOnly, "show-colors": true, "hide-section-headers": true, "hide-preview": true }, on: { "update:overrides": _vm.onNavOverridesUpdate } })] : _vm._e()], 2), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "footer", expression: "globalActiveTab === 'footer'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-global-navigation", { attrs: { "nav-defaults": _vm.footerDefaults, "nav-overrides": _vm.footerOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont }, on: { "update:overrides": _vm.onFooterOverridesUpdate } })], 1), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.globalActiveTab === "patches", expression: "globalActiveTab === 'patches'" }], staticClass: "pw-wizard-global-content" }, [_c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === "global" && _vm.globalActiveTab === "patches", expression: "activeTab === 'global' && globalActiveTab === 'patches'" }], staticClass: "pw-patches-tree" }, [_c("k-text", { staticClass: "k-help pw-patches-intro", attrs: { "html": _vm.$t("prw.patches.tree", { plus: '<span class="pw-json-add pw-json-add-inline" aria-hidden="true"><svg class="k-icon" viewBox="0 0 24 24"><use href="#icon-add"></use></svg></span>' }) } }), _c("ul", { staticClass: "pw-json-children pw-json-root" }, _vm._l(_vm.blocks, function(block) {
      return _c("pw-json-node", { key: "pt-" + block.blockType, attrs: { "node-key": block.blockType, "label": _vm.blockLabel(block.blockType), "icon": block.icon || "box", "value": _vm.patchesTree[block.blockType] || { ...block.settings || {}, editor: block.editor || {} }, "path": [block.blockType], "focus-path": _vm.patchesFocus }, on: { "take": _vm.takePatch } });
    }), 1)], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { ref: "patchesCode", staticClass: "pw-code" }, [_c("pre", { ref: "patchesHl", staticClass: "pw-code-hl", attrs: { "aria-hidden": "true" }, domProps: { "innerHTML": _vm._s(_vm.patchesHighlighted) } }), _c("textarea", { directives: [{ name: "model", rawName: "v-model", value: _vm.patchesText, expression: "patchesText" }], key: "patches-" + _vm.discardKey, ref: "patchesInput", staticClass: "pw-patches-input", attrs: { "spellcheck": "false", "placeholder": '{\n  "pwhero": { … }\n}' }, domProps: { "value": _vm.patchesText }, on: { "input": [function($event) {
      if ($event.target.composing) return;
      _vm.patchesText = $event.target.value;
    }, _vm.onPatchesInput], "click": _vm.focusPatchesTree, "keyup": function($event) {
      /^(Arrow|Home|End|Page)/.test($event.key) && _vm.focusPatchesTree();
    }, "scroll": function($event) {
      _vm.$refs.patchesHl.scrollTop = $event.target.scrollTop;
      _vm.$refs.patchesHl.scrollLeft = $event.target.scrollLeft;
    } } })]), _vm.patchesError ? _c("k-box", { staticClass: "pw-patches-note", attrs: { "theme": "negative", "text": _vm.patchesError } }) : _vm.patchesUnknown.length ? _c("k-box", { staticClass: "pw-patches-note", attrs: { "theme": "notice", "text": _vm.$t("prw.patches.unknown") + " " + _vm.patchesUnknown.join(", ") } }) : _vm._e(), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.patches") } })], 1)], 1), _vm.hasAiTab ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: ["translate", "generator"].includes(_vm.globalActiveTab), expression: "['translate', 'generator'].includes(globalActiveTab)" }], staticClass: "pw-wizard-global-content pw-ai-settings", class: { "pw-ai-single": !(_vm.globalActiveTab === "generator" && _vm.aiForm || _vm.globalActiveTab === "translate" && _vm.translateTree) || !_vm.aiPageSecrets.length } }, [_vm.translateTree && _vm.globalActiveTab === "translate" ? _c("div", { staticClass: "pw-ai-main" }, [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h2", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.translate.fields")))]), _c("k-button", { attrs: { "icon": _vm.translateExpanded ? "prw-collapse" : "prw-expand", "text": _vm.$t(_vm.translateExpanded ? "prw.translate.collapse" : "prw.translate.expand"), "size": "xs", "variant": "filled" }, on: { "click": function($event) {
      _vm.translateExpanded = !_vm.translateExpanded;
    } } })], 1), _c("div", { staticClass: "pw-card pw-translate-tree" }, [_c("ul", { staticClass: "pw-json-children pw-json-root" }, _vm._l(_vm.translateTree, function(node) {
      return _c("pw-translate-node", { key: "tr-" + node.key, attrs: { "node": node, "values": _vm.translateValues, "expanded": _vm.translateExpanded }, on: { "toggle": _vm.onTranslateToggle } });
    }), 1)]), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.translate.fields.help") } })], 1)]) : _vm._e(), _vm.aiForm && _vm.globalActiveTab === "generator" ? _c("div", { staticClass: "pw-ai-main" }, [_vm.aiForm ? _c("k-form", { key: "ai-" + _vm.discardKey, attrs: { "fields": _vm.aiForm.fields, "value": _vm.aiValues }, on: { "input": _vm.onAiInput } }) : _vm._e()], 1) : _vm._e(), _vm.aiPageSecrets.length ? _c("aside", { staticClass: "pw-ai-aside" }, [_c("section", { staticClass: "pw-ai-secrets" }, [_c("h2", { staticClass: "k-label pw-ai-secrets-title" }, [_vm._v(_vm._s(_vm.$t("prw.ai.keys")))]), _c("k-text", { staticClass: "pw-ai-secrets-help pw-ai-secrets-intro", attrs: { "html": _vm.$t("prw.ai.keys.intro." + _vm.globalActiveTab) } }), !_vm.aiSecretsWritable ? _c("k-box", { attrs: { "theme": "negative", "text": _vm.$t("prw.ai.keys.readonly") } }) : _vm._e(), _vm._l(_vm.aiPageSecrets, function(secret) {
      return _c("div", { key: secret.env, staticClass: "pw-ai-secret" }, [_c("label", { staticClass: "k-label", attrs: { "for": "pw-secret-" + secret.env } }, [_vm._v(_vm._s(secret.label)), _vm.aiSecretValid[secret.env] && _vm.aiSecretTypes[secret.env] ? [_vm._v(" · " + _vm._s(_vm.aiSecretTypes[secret.env]))] : _vm._e()], 2), _c("div", { staticClass: "pw-ai-secret-row" }, [_c("span", { staticClass: "pw-ai-secret-field" }, [_c("input", { staticClass: "pw-ai-secret-input", attrs: { "id": "pw-secret-" + secret.env, "type": "password", "autocomplete": "new-password", "disabled": !_vm.aiSecretsWritable || secret.source === "config", "placeholder": secret.masked ? secret.masked : _vm.$t("prw.ai.keys.empty") }, domProps: { "value": _vm.aiSecretInputs[secret.env] || "" }, on: { "input": function($event) {
        return _vm.onSecretInput(secret.env, $event.target.value);
      } } }), secret.source && _vm.aiSecretValid[secret.env] !== void 0 && _vm.aiSecretValid[secret.env] !== null && !_vm.aiSecretInputs[secret.env] ? _c("k-icon", { staticClass: "pw-ai-secret-state", class: _vm.aiSecretValid[secret.env] ? "is-valid" : "is-invalid", attrs: { "type": _vm.aiSecretValid[secret.env] ? "check" : "alert", "title": _vm.$t(_vm.aiSecretValid[secret.env] ? "prw.ai.keys.valid" : "prw.ai.keys.invalid") } }) : _vm._e()], 1), secret.source === "env" && _vm.aiSecretsWritable ? _c("k-button", { attrs: { "icon": "trash", "size": "sm", "variant": "filled", "title": _vm.$t("prw.ai.keys.remove") }, on: { "click": function($event) {
        return _vm.removeSecret(secret);
      } } }) : _vm._e()], 1), secret.source !== "env" ? _c("p", { staticClass: "pw-ai-secret-status" }, [secret.source === "config" ? [_vm._v(_vm._s(_vm.$t("prw.ai.keys.config")))] : [_vm._v(_vm._s(_vm.$t("prw.ai.keys.notset")))], secret.help && !secret.source ? [_vm._v(" · " + _vm._s(secret.help))] : _vm._e()], 2) : _vm._e()]);
    })], 2), _vm.globalActiveTab === "translate" && _vm.deeplUsage ? _c("section", { staticClass: "pw-ai-secrets pw-ai-usage" }, [_c("h3", { staticClass: "k-label" }, [_vm._v(_vm._s(_vm.$t("prw.translate.usage")))]), _c("div", { staticClass: "pw-usage-bar", class: { "is-high": _vm.deeplUsage.count / _vm.deeplUsage.limit > 0.9 } }, [_c("span", { style: { width: Math.min(100, _vm.deeplUsage.count / _vm.deeplUsage.limit * 100) + "%" } })]), _c("p", { staticClass: "pw-ai-secrets-help pw-ai-usage-figures" }, [_vm._v(_vm._s(_vm.$t("prw.translate.usage.text", { count: _vm.deeplUsage.count.toLocaleString(), limit: _vm.deeplUsage.limit.toLocaleString() })))])]) : _vm._e()]) : _vm._e()]) : _vm._e()]) : _vm._e(), _vm._l(_vm.blocks, function(block) {
      return _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === block.blockType, expression: "activeTab === block.blockType" }], key: block.blockType, staticClass: "pw-wizard-panel" }, [["pwtext", "pwheading", "pwsteplist", "pwquote", "pwmedia", "pwlogocloud", "pwfeaturelist", "pwhero", "pwcardlets", "pwmulticolumn", "pwfaq"].includes(block.blockType) && _vm.blockConfigs[block.blockType] ? _c("pw-portal", { attrs: { "to": ".pw-wizard .pw-preview-column" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.activeTab === block.blockType, expression: "activeTab === block.blockType" }] }, [_c("pw-block-preview", { attrs: { "block-type": block.blockType, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.shownOverrides(block.blockType), "element-defaults": _vm.elementDefaults, "element-overrides": _vm.elementOverrides, "global-defaults": _vm.globalDefaults, "global-overrides": _vm.globalOverrides, "font-defaults": _vm.fontDefaults, "font-overrides": _vm.fontOverrides, "fonts": _vm.fontsData, "body-default-font": _vm.bodyDefaultFont, "body-background": _vm.bodyBackgroundColor, "themes": _vm.themes, "guides": _vm.previewGuides, "with-block-guides": _vm.currentBlockView !== "design", "bp": _vm.itemBp, "value-defaults": _vm.blockValueDefaults[block.blockType] || {}, "value-overrides": _vm.shownValueOverrides(block.blockType), "step-style": block.blockType === "pwsteplist" && _vm.currentBlockView === "design" ? _vm.currentStepStyle(block.blockType) : "", "feature-layout": ["pwfeaturelist", "pwfaq"].includes(block.blockType) && _vm.currentBlockView === "design" ? _vm.currentFeatureLayout(block.blockType) : "", "faq-style": block.blockType === "pwfaq" && _vm.currentBlockView === "design" ? _vm.currentFaqStyle(block.blockType) : "", "hero-height": block.blockType === "pwhero" && _vm.currentBlockView === "design" ? _vm.currentHeroHeight(block.blockType) : "", "card-display": block.blockType === "pwcardlets" && _vm.currentBlockView === "design" ? _vm.currentCardDisplay(block.blockType) : "", "design-view": _vm.currentBlockView === "design", "highlight": _vm.hoveredVar, "variant": _vm.currentItemColorTheme }, on: { "update:guides": function($event) {
        _vm.previewGuides = $event;
      }, "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:variant": function($event) {
        _vm.itemColorTheme = $event;
      } } })], 1)]) : _vm._e(), _vm.blockConfigs[block.blockType] ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.currentBlockView === "defaults", expression: "currentBlockView === 'defaults'" }] }, [_c("pw-block-settings", { attrs: { "view": "defaults", "variants": _vm.activeVariants, "global-values": _vm.globalLayoutValues, "media-radius": _vm.mediaRadiusValues, "guides": _vm.previewGuides, "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "hover-var": function($event) {
        _vm.hoveredVar = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      }, "drawer-tab": function($event) {
        return _vm.$set(_vm.startDrawerTab, block.blockType, $event);
      } } }), _vm.hasItemFields(block.blockType) && _vm.hasItemDefaultFields(block.blockType) && _vm.startDrawerTab[block.blockType] === "layout" ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.tab.items")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-defaults", "item-radius": _vm.itemRadiusValues(block.blockType), "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.itemCorners") } })], 1)] : _vm._e()], 2) : _vm._e(), _vm.blockConfigs[block.blockType] ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.currentBlockView === "presets", expression: "currentBlockView === 'presets'" }] }, [_c("pw-block-settings", { attrs: { "view": "presets", "variants": _vm.activeVariants, "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1) : _vm._e(), _vm.blockConfigs[block.blockType] && _vm.hasElementsView(block.blockType) ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.currentBlockView === "elements", expression: "currentBlockView === 'elements'" }] }, [_vm.hasOwnSpacing(block.blockType) ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t(block.blockType === "pwmulticolumn" ? "prw.headline.elementsColumns" : "prw.headline.elementsIntro")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-spacing"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.itemLayoutDefault(block.blockType, "item-spacing") !== "own" ? _vm._l(_vm.ownSpacingElements(block.blockType), function(el) {
        return _c("div", { key: "gs-" + el, staticClass: "pw-field-row is-readonly", attrs: { "data-guide": _vm.previewGuides ? _vm.spaceGuide(el) : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.prop." + el + "-spacing")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-readonly-value" }, [_vm._v(_vm._s(_vm.globalElementSpacing(el).replace(/r?em$/, ""))), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s((_vm.globalElementSpacing(el).match(/r?em$/) || ["rem"])[0]))])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.remToPx(_vm.globalElementSpacing(el))))])])])])])]);
      }) : _vm._l(_vm.ownSpacingElements(block.blockType), function(el) {
        return _c("pw-block-values", { key: "os-" + el, attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [el + "-spacing"], "labels": { [el + "-spacing"]: _vm.$t("prw.prop." + el + "-spacing") }, "guides": _vm.previewGuides ? { [el + "-spacing"]: _vm.spaceGuide(el) } : null, "hints": { [el + "-spacing"]: _vm.globalElementSpacing(el) }, "hint-title": _vm.$t("prw.hint.globalValue"), "hide-section-headers": true }, on: { "update:bp": function($event) {
          _vm.itemBp = $event;
        }, "update:overrides": function($event) {
          return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
        }, "hover-var": function($event) {
          _vm.hoveredVar = $event;
        } } });
      })], 2), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.elementSpacing") } })], 1)] : _vm._e(), _vm.hasEntry(block.blockType) ? _vm._l(_vm.entryParts(block.blockType), function(part) {
        return _c("section", { key: "entry-" + part.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t(part.heading)))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-entry-" + part.key] }, on: { "update:overrides": function($event) {
          return _vm.onBlockOverridesUpdate(block.blockType, $event);
        }, "update:writer-active": function($event) {
          return _vm.$set(_vm.writerActive, block.blockType, $event);
        } } }), _vm.itemLayoutDefault(block.blockType, "item-entry-" + part.key) !== "own" ? _vm._l(part.rows, function(name) {
          return _c("div", { key: "ge-" + name, staticClass: "pw-field-row is-readonly", attrs: { "data-guide": _vm.previewGuides && name === "item-title-spacing" ? "gap-4" : null } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.entryLabel(block.blockType, name)))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-readonly-value" }, [_vm._v(_vm._s(String(_vm.globalItemValue(name)).replace(/(rem|em)$/, ""))), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s((String(_vm.globalItemValue(name)).match(/(rem|em)$/) || [""])[0]))])]), /rem$/.test(_vm.globalItemValue(name)) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.remToPx(_vm.globalItemValue(name))))]) : _vm._e()])])])])]);
        }) : _vm._l(part.rows, function(name) {
          return _c("pw-block-values", { key: "oe-" + name, attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [name], "labels": { [name]: _vm.entryLabel(block.blockType, name) }, "guides": _vm.previewGuides && name === "item-title-spacing" ? { "item-title-spacing": "gap-4" } : null, "hints": { [name]: _vm.globalItemValue(name) }, "hint-title": _vm.$t("prw.hint.globalValue"), "hide-section-headers": true }, on: { "update:bp": function($event) {
            _vm.itemBp = $event;
          }, "update:overrides": function($event) {
            return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
          }, "hover-var": function($event) {
            _vm.hoveredVar = $event;
          } } });
        })], 2), part.key === "text" ? _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.featureText") } }) : _vm._e()], 1);
      }) : _vm._e()], 2) : _vm._e(), _vm.blockConfigs[block.blockType] && _vm.hasDesign(block.blockType) ? _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.currentBlockView === "design", expression: "currentBlockView === 'design'" }] }, [block.blockType === "pwsteplist" && _vm.blockValueDefaults[block.blockType] ? _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.numbering")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.stepStyleOptions(block.blockType), function(st) {
        return _c("button", { key: "st-" + st, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentStepStyle(block.blockType) === st ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$set(_vm.stepPreviewStyle, block.blockType, st);
        } } }, [_vm._v(_vm._s(_vm.$t("kirbyblock-steplist.item-style." + st)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [_vm.stepValueKey(block.blockType, "item-number-size")], "labels": { [_vm.stepValueKey(block.blockType, "item-number-size")]: _vm.$t(_vm.currentStepStyle(block.blockType) === "minimal" ? "prw.prop.font-size" : "prw.label.size") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _vm.currentStepStyle(block.blockType) !== "minimal" ? [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shape"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemRadiusVisible(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()] : _vm._e(), _vm.currentStepStyle(block.blockType) !== "centered" ? _c("pw-block-settings", { key: "align-" + _vm.currentStepStyle(block.blockType), attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": [_vm.stepValueKey(block.blockType, "item-number-align")] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.currentStepStyle(block.blockType) !== "centered" && _vm.stepAlign(block.blockType) === "top" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [_vm.stepValueKey(block.blockType, "item-number-offset")], "labels": { [_vm.stepValueKey(block.blockType, "item-number-offset")]: _vm.$t("prw.label.offset") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [_vm.stepValueKey(block.blockType, "item-content-gap")], "guides": _vm.previewGuides ? { [_vm.stepValueKey(block.blockType, "item-content-gap")]: "row" } : null, "labels": { [_vm.stepValueKey(block.blockType, "item-content-gap")]: _vm.$t(_vm.currentStepStyle(block.blockType) === "centered" ? "prw.label.gapVertical" : "prw.label.gapHorizontal") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _vm.currentStepStyle(block.blockType) === "connected" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-connector-width"], "labels": { "item-connector-width": _vm.$t("prw.prop.item-connector") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()], 2), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.steplistNumbering") } })], 1) : _vm._e(), block.blockType === "pwsteplist" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "sth-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "labels": _vm.stepColorLabels(block.blockType), "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": _vm.itemColorsShowOnly(block.blockType), "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.steplistColors") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.spacing")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "labels": { "item-gap": _vm.$t("prw.label.betweenSteps") }, "guides": _vm.previewGuides ? { "item-gap": "margin", "item-text-gap": "text" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-gap", "item-text-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.steplistSpacing") } })], 1)] : _vm._e(), block.blockType === "pwlogocloud" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.layout")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-format"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "labels": _vm.itemLayoutDefault(block.blockType, "item-format") === "flexible" ? { "item-size": _vm.$t("prw.label.height") } : {}, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-size"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.logocloudLayout") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.shape")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shape"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemRadiusVisible(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.logocloudShape") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.padding")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "labels": { "item-padding": _vm.$t("prw.label.leftRight"), "item-padding-y": _vm.$t("prw.label.topBottom") }, "guides": _vm.previewGuides ? { "item-padding": "padding", "item-padding-y": "padding-y" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-padding", "item-padding-y"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.logocloudPadding") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "lth-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "labels": { "item-background": _vm.$t("prw.label.backgroundColor") }, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-background"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.logocloudColors") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.spacing")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-gap": "margin" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-row-gap": "row" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-row-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-text-gap": "text" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-text-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.logocloudSpacing") } })], 1)] : _vm._e(), block.blockType === "pwfeaturelist" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.entryTitle")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-title-style"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.icon")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-icon-position"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.itemLayoutDefault(block.blockType, "item-icon-position") !== "none" ? [_vm.itemLayoutDefault(block.blockType, "item-icon-position") === "left" ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-icon-align"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.itemLayoutDefault(block.blockType, "item-icon-position") === "left" && _vm.itemLayoutDefault(block.blockType, "item-icon-align") !== "center" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-offset"], "labels": { "item-icon-offset": _vm.$t("prw.label.offset") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-size"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-icon-gap": "row" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-icon-style"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })] : _vm._e()], 2), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.featureIcons") } })], 1), _vm.itemLayoutDefault(block.blockType, "item-icon-position") !== "none" && _vm.itemLayoutDefault(block.blockType, "item-icon-style") === "tile" ? _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.tile")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shape"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemRadiusVisible(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-icon-tile-padding": "padding" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-tile-padding"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.featureTile") } })], 1) : _vm._e(), _vm.itemLayoutDefault(block.blockType, "item-icon-position") !== "none" ? _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "fth-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-fill"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _vm.itemLayoutDefault(block.blockType, "item-icon-style") === "tile" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-tile-background"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.featureColors") } })], 1) : _vm._e(), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.spacing")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(["stacked", "split"], function(lay) {
        return _c("button", { key: "fl-" + lay, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentFeatureLayout(block.blockType) === lay ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$set(_vm.featurePreviewLayout, block.blockType, lay);
        } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + lay)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-gap": "margin" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-gap"], "labels": { "item-gap": _vm.$t("prw.label.betweenItems") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _vm.currentFeatureLayout(block.blockType) === "split" && _vm.itemBp !== "default" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-offset-gap"], "guides": _vm.previewGuides ? { "item-offset-gap": "text" } : null, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.currentFeatureLayout(block.blockType) === "split" && _vm.itemBp !== "default" ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-offset-align"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.currentFeatureLayout(block.blockType) !== "split" || _vm.itemBp === "default" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-text-gap": "text" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-text-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.featureSpacing") } })], 1)] : _vm._e(), block.blockType === "pwfaq" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.icon")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-icon"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.itemLayoutDefault(block.blockType, "item-icon") !== "none" ? [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-icon-position"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-size"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })] : _vm._e()], 2)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("kirbyblock-faq.items")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(["lines", "cards"], function(st) {
        return _c("button", { key: "fs-" + st, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentFaqStyle(block.blockType) === st ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$set(_vm.faqPreviewStyle, block.blockType, st);
        } } }, [_vm._v(_vm._s(_vm.$t("kirbyblock-faq.faq-style." + st)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-padding-y"], "guides": _vm.previewGuides ? { "item-padding-y": "padding-y" } : null, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _vm.currentFaqStyle(block.blockType) === "cards" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-padding-x"], "guides": _vm.previewGuides ? { "item-padding-x": "padding" } : null, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.currentFaqStyle(block.blockType) === "cards" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.currentFaqStyle(block.blockType) === "cards" ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shape"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.currentFaqStyle(block.blockType) === "cards" && _vm.itemLayoutDefault(block.blockType, "item-shape") !== "square" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.currentFaqStyle(block.blockType) !== "cards" ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-divider"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.currentFaqStyle(block.blockType) !== "cards" && _vm.itemLayoutDefault(block.blockType, "item-divider") !== "disabled" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-divider-width"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-answer-gap"], "guides": _vm.previewGuides ? { "item-answer-gap": "gap-4" } : null, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _vm.itemLayoutDefault(block.blockType, "item-icon") !== "none" ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-answer-width"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e()], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "fqth-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-question"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _vm.itemLayoutDefault(block.blockType, "item-icon") !== "none" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-icon"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.currentFaqStyle(block.blockType) !== "cards" && _vm.itemLayoutDefault(block.blockType, "item-divider") !== "disabled" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-divider"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.currentFaqStyle(block.blockType) === "cards" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-background"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()], 1)]), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.spacing")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(["stacked", "split"], function(lay) {
        return _c("button", { key: "fql-" + lay, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentFeatureLayout(block.blockType) === lay ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$set(_vm.featurePreviewLayout, block.blockType, lay);
        } } }, [_vm._v(_vm._s(_vm.$t("kirbyblock-faq.section-layout." + lay)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_vm.currentFeatureLayout(block.blockType) === "split" && _vm.itemBp !== "default" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-offset-gap"], "guides": _vm.previewGuides ? { "item-offset-gap": "text" } : null, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.currentFeatureLayout(block.blockType) === "split" && _vm.itemBp !== "default" ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-offset-align"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), _vm.currentFeatureLayout(block.blockType) !== "split" || _vm.itemBp === "default" ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-text-gap"], "guides": _vm.previewGuides ? { "item-text-gap": "text" } : null, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()], 1)])] : _vm._e(), block.blockType === "pwhero" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.label.height")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(["small", "medium", "large", "fullscreen"], function(h) {
        return _c("button", { key: "hh-" + h, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentHeroHeight(block.blockType) === h ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$set(_vm.heroPreviewHeight, block.blockType, h);
        } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + h)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_vm.currentHeroHeight(block.blockType) === "fullscreen" ? _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.height")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-readonly-value" }, [_vm._v("100"), _c("span", { staticClass: "pw-element-unit" }, [_vm._v("vh")])]), _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.screenHeight(_vm.itemBp)) + "px")])]), _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
        return _c("button", { key: "fs-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t({ default: "prw.label.mobile", lg: "prw.label.tablet", xl: "prw.label.desktop" }[b]), "aria-label": _vm.$t({ default: "prw.label.mobile", lg: "prw.label.tablet", xl: "prw.label.desktop" }[b]), "aria-pressed": _vm.itemBp === b ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemBp = b;
        } } }, [_c("k-icon", { attrs: { "type": { default: "mobile", lg: "tablet", xl: "display" }[b] } })], 1);
      }), 0)])])])]) : _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "labels": { ["height-" + _vm.currentHeroHeight(block.blockType)]: _vm.$t("prw.label.height") }, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["height-" + _vm.currentHeroHeight(block.blockType)], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _vm.currentHeroHeight(block.blockType) !== "fullscreen" ? _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.heroHeight") } }) : _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny" } }, [_vm._v(_vm._s(_vm.$t("prw.hint.heroFullscreen")))])], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "hth-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["overlay"], "theme": _vm.currentItemColorTheme, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny" } }, [_vm._v(_vm._s(_vm.$t("prw.hint.heroOverlay")))])], 1)] : _vm._e(), block.blockType === "pwcardlets" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.padding")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-padding-x": "padding", "item-padding-y": "padding-y" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-padding-x", "item-padding-y"], "labels": { "item-padding-x": _vm.$t("prw.label.leftRight"), "item-padding-y": _vm.$t("prw.label.topBottom") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.cardletsCard") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.shape")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shape"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemRadiusVisible(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-radius"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e()], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.cardletsShape") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("pw.headline.style")))]), _vm.isItemBorderEnabled(block.blockType) ? _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "cbt-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0) : _vm._e()]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-border"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemBorderEnabled(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-border-width"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _vm.isItemBorderEnabled(block.blockType) ? _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-border-color"], "labels": { "item-border-color": _vm.$t("prw.label.color") }, "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }) : _vm._e(), _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-shadow"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.cardletsBorder") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("kirbyblock-cardlets.card-display")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(["stacked", "overlay", "overhang"], function(d) {
        return _c("button", { key: "cd-" + d, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentCardDisplay(block.blockType) === d ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$set(_vm.cardPreviewDisplay, block.blockType, d);
        } } }, [_vm._v(_vm._s(_vm.$t("kirbyblock-cardlets.card-display." + d)))]);
      }), 0)]), _vm.currentCardDisplay(block.blockType) === "stacked" ? _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": [{ default: "item-image-ratio", lg: "item-image-ratio-lg", xl: "item-image-ratio-xl" }[_vm.itemBp] || "item-image-ratio"], "row-bp": _vm.itemBp }, on: { "update:row-bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } })], 1) : _vm.currentCardDisplay(block.blockType) === "overlay" ? _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": [{ default: "item-ratio", lg: "item-ratio-lg", xl: "item-ratio-xl" }[_vm.itemBp] || "item-ratio"], "row-bp": _vm.itemBp }, on: { "update:row-bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _c("pw-block-values", { attrs: { "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-overlay-strength"], "hide-section-headers": true }, on: { "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1) : _vm.currentCardDisplay(block.blockType) === "overhang" ? _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": [{ default: "item-cutout-ratio", lg: "item-cutout-ratio-lg", xl: "item-cutout-ratio-xl" }[_vm.itemBp] || "item-cutout-ratio"], "row-bp": _vm.itemBp }, on: { "update:row-bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-overhang": "overhang" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-overhang"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1) : _vm._e(), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t({ stacked: "prw.hint.cardletsDisplayStacked", overlay: "prw.hint.cardletsDisplayOverlay", overhang: "prw.hint.cardletsOverhang" }[_vm.currentCardDisplay(block.blockType)]) } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.link")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-link-style"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-link-position"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }), _vm.isItemLinkStyleButton(block.blockType) ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-button-style"], "variants": _vm.activeVariants }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e(), !_vm.isItemLinkStyleButton(block.blockType) ? _c("pw-block-settings", { attrs: { "view": "items-layout", "block": block, "config": _vm.blockConfigs[block.blockType], "overrides": _vm.blockOverrides[block.blockType] || {}, "writer-active": _vm.writerActive[block.blockType] !== false, "layout-keys": ["item-link-decoration", "item-link-icon"] }, on: { "update:overrides": function($event) {
        return _vm.onBlockOverridesUpdate(block.blockType, $event);
      }, "update:writer-active": function($event) {
        return _vm.$set(_vm.writerActive, block.blockType, $event);
      } } }) : _vm._e()], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.cardletsLink") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.subtab.colors")))]), _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
        return _c("button", { key: "cth-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentItemColorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
          _vm.itemColorTheme = theme;
        } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.variantBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
      }), 0)]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "theme": _vm.currentItemColorTheme, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": _vm.isItemLinkStyleButton(block.blockType) ? ["item-tagline-text", "item-heading-text", "item-editor-text", ..._vm.currentCardDisplay(block.blockType) === "overlay" ? ["item-overlay"] : [], "item-background"] : ["item-tagline-text", "item-heading-text", "item-editor-text", "item-link", "item-link-hover", "item-link-active", ..._vm.currentCardDisplay(block.blockType) === "overlay" ? ["item-overlay"] : [], "item-background"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.cardletsColors") } })], 1), _c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.spacing")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "labels": { "item-gap": _vm.$t("prw.label.betweenCards") }, "guides": _vm.previewGuides ? { "item-gap": "margin" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-tagline-spacing": "row" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-tagline-spacing"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-heading-spacing": "gap-4" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-heading-spacing"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-cta-gap": "gap-5" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-cta-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } }), _c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-text-gap": "text" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-text-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.cardletsSpacing") } })], 1)] : _vm._e(), block.blockType === "pwmedia" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.spacing")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "item-text-gap": "text" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": ["item-text-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.mediaSpacing") } })], 1)] : _vm._e(), block.blockType === "pwmulticolumn" && _vm.blockValueDefaults[block.blockType] ? [_c("section", { staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.$t("prw.headline.spacing")))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_c("pw-block-values", { attrs: { "bp": _vm.itemBp, "guides": _vm.previewGuides ? { "column-gap": "margin", "row-gap": "row" } : null, "defaults": _vm.blockValueDefaults[block.blockType], "patch": _vm.valuesPatch(block.blockType), "overrides": _vm.blockValueOverrides[block.blockType] || {}, "show-only": [_vm.mcColumnsSide(block.blockType) ? "column-gap" : "row-gap"], "hide-section-headers": true }, on: { "update:bp": function($event) {
        _vm.itemBp = $event;
      }, "update:overrides": function($event) {
        return _vm.onBlockValueOverridesUpdate(block.blockType, $event);
      }, "hover-var": function($event) {
        _vm.hoveredVar = $event;
      } } })], 1), _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.$t("prw.hint.multicolumnSpacing") } })], 1)] : _vm._e()], 2) : _vm._e()], 1);
    })], 2), _c("aside", { staticClass: "pw-preview-column" }, [!_vm.showPreview ? _c("k-button", { staticClass: "pw-preview-open", attrs: { "icon": "preview", "title": _vm.$t("expand") }, on: { "click": _vm.togglePreview } }) : _vm._e()], 1), _c("k-button", { staticClass: "pw-preview-toggle", attrs: { "icon": _vm.showPreview ? "angle-right" : "angle-left", "title": _vm.showPreview ? _vm.$t("collapse") : _vm.$t("expand"), "size": "xs" }, on: { "click": _vm.togglePreview } })], 1)], 1);
  };
  var _sfc_staticRenderFns$n = [];
  _sfc_render$n._withStripped = true;
  var __component__$n = /* @__PURE__ */ normalizeComponent(
    _sfc_main$n,
    _sfc_render$n,
    _sfc_staticRenderFns$n
  );
  __component__$n.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/Overview.vue";
  const Overview = __component__$n.exports;
  const _sfc_main$m = {
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
      // the value set by the exceptions (Settings › Configuration): locked
      locked: { type: Boolean, default: false },
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
  var _sfc_render$m = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-field-row", class: { "is-disabled": !_vm.enabled, "is-modified": _vm.modified, "is-locked": _vm.locked } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.propertyLabel(_vm.label))), _vm.required ? _c("span", { staticClass: "pw-field-required" }, [_vm._v("*")]) : _vm._e()]), _vm.locked ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options", attrs: { "inert": _vm.locked || null } }, [_c("k-toggles-input", { attrs: { "value": _vm.defaultValue, "options": _vm.allowedOptions.map((o) => ({ value: o, text: _vm.optionLabel(o) })), "grow": false, "required": true }, on: { "input": _vm.setDefault } })], 1)])])]);
  };
  var _sfc_staticRenderFns$m = [];
  _sfc_render$m._withStripped = true;
  var __component__$m = /* @__PURE__ */ normalizeComponent(
    _sfc_main$m,
    _sfc_render$m,
    _sfc_staticRenderFns$m
  );
  __component__$m.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/FieldRow.vue";
  const FieldRow = __component__$m.exports;
  const _sfc_main$l = {
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
  var _sfc_render$l = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-color-field", class: { "is-default": !_vm.overrideValue } }, [_c("k-colorname-input", { staticClass: "pw-color-value", attrs: { "value": _vm.displayValue, "alpha": true, "format": "hex" }, on: { "input": _vm.onInput } }), _c("button", { staticClass: "pw-color-swatch", attrs: { "type": "button", "title": _vm.displayValue }, on: { "click": function($event) {
      return _vm.$refs.picker.toggle();
    } } }, [_c("k-color-frame", { attrs: { "color": _vm.displayValue, "ratio": "1/1" } })], 1), _c("k-dropdown-content", { ref: "picker", staticClass: "k-color-field-picker", attrs: { "align-x": "start" } }, [_c("k-colorpicker-input", { attrs: { "value": _vm.displayValue, "alpha": true, "format": "hex" }, on: { "input": _vm.onInput }, nativeOn: { "click": function($event) {
      $event.stopPropagation();
    } } })], 1)], 1);
  };
  var _sfc_staticRenderFns$l = [];
  _sfc_render$l._withStripped = true;
  var __component__$l = /* @__PURE__ */ normalizeComponent(
    _sfc_main$l,
    _sfc_render$l,
    _sfc_staticRenderFns$l
  );
  __component__$l.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/ColorFieldRow.vue";
  const ColorFieldRow = __component__$l.exports;
  const _sfc_main$k = {
    props: {
      blocks: {
        type: Array,
        default: () => []
      },
      // how often each block is used in the project (blockType → count)
      usage: {
        type: Object,
        default: () => ({})
      }
    },
    computed: {
      groups() {
        return [
          {
            // (only the pagewizard's blocks; project-related ones are not offered)
            key: "pagewizard",
            label: this.$t("prw.headline.pagewizard"),
            blocks: this.blocks.filter((b) => (b.blockType || "").startsWith("pw"))
          }
        ];
      }
    },
    data() {
      return {
        // the pages using a block (blockType → list), loaded on the first click
        usagePages: {}
      };
    },
    methods: {
      async openUsage(blockType) {
        const ref = this.$refs["usage-" + blockType];
        (Array.isArray(ref) ? ref[0] : ref).toggle();
        if (this.usagePages[blockType]) return;
        try {
          this.$set(this.usagePages, blockType, await this.$api.get("projectwizard/blocks/usage/" + blockType));
        } catch (e) {
          this.$set(this.usagePages, blockType, []);
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
      }
    }
  };
  var _sfc_render$k = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", [_vm._l(_vm.groups, function(group) {
      return [group.blocks.length ? _c("section", { key: group.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(group.label))])]), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(group.blocks, function(block) {
        return _c("div", { key: block.blockType, staticClass: "pw-field-row pw-active-row", class: { "is-inactive": !block.active } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col pw-active-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-active-label" }, [_c("k-icon", { staticClass: "pw-active-icon", attrs: { "type": block.icon || "box" } }), _c("span", [_vm._v(_vm._s(_vm.blockLabel(block.blockType)))])], 1), _vm.usage[block.blockType] ? _c("span", { staticClass: "pw-active-count pw-active-usage" }, [_c("button", { staticClass: "pw-active-usage-button", attrs: { "type": "button" }, on: { "click": function($event) {
          return _vm.openUsage(block.blockType);
        } } }, [_vm._v(" " + _vm._s(_vm.$t("prw.label.usedTimes", { count: _vm.usage[block.blockType] }))), _c("k-icon", { attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "usage-" + block.blockType, refInFor: true, attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, [!_vm.usagePages[block.blockType] ? _c("p", { staticClass: "pw-active-usage-loading" }, [_vm._v("…")]) : _vm._e(), _vm._l(_vm.usagePages[block.blockType] || [], function(page) {
          return _c("button", { key: page.link, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true" }, on: { "click": function($event) {
            return _vm.$go(page.link);
          } } }, [_c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(page.title) + " "), _c("span", { staticClass: "pw-menu-count" }, [_vm._v(_vm._s(page.count) + "×")])])]);
        })], 2)])], 1) : _c("span", { staticClass: "pw-active-count" }, [_vm._v(_vm._s(_vm.$t("prw.label.unused")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggle-input", { attrs: { "value": block.active }, on: { "input": function($event) {
          return _vm.$emit("toggle", { blockType: block.blockType, checked: $event });
        } } })], 1)])])]);
      }), 0)]) : _vm._e()];
    })], 2);
  };
  var _sfc_staticRenderFns$k = [];
  _sfc_render$k._withStripped = true;
  var __component__$k = /* @__PURE__ */ normalizeComponent(
    _sfc_main$k,
    _sfc_render$k,
    _sfc_staticRenderFns$k
  );
  __component__$k.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalElements.vue";
  const GlobalElements = __component__$k.exports;
  function validStart(value, options, empty) {
    if (!Array.isArray(options) || !options.length) return value;
    if (value === null || value === void 0 || typeof value === "boolean" || typeof value === "object") return value;
    if (empty !== void 0 && String(value) === String(empty)) return value;
    const values = options.map((o) => o && typeof o === "object" ? o.value : o);
    return values.some((v) => String(v) === String(value)) ? value : values[0];
  }
  const _sfc_main$j = {
    inject: { pwPatches: { default: null } },
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
      // the media's corner radii (Elements › Media › Form), shown next to the
      // media's corner switches
      mediaRadius: {
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
      },
      // items-layout: the device of rows with a value per device (switch shown)
      rowBp: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        // chosen tab of the drawer header (null: the first with rows)
        drawerTab: null,
        // grid start values switched to "adjusted" per screen size (still full width values)
        gridCustom: {},
        // the screen size shown per card with values per size (grid, columns …)
        sectionBp: {}
      };
    },
    watch: {
      // the start values' drawer tab shown (the overview adds the items' cards there)
      currentDrawerTab: {
        immediate: true,
        handler(tab) {
          if (this.view === "defaults") this.$emit("drawer-tab", tab);
        }
      }
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
          if (Object.values(settings).some((v) => this.isObject(v) && v.with === key)) continue;
          const displayKey = key.replace(/^item-/, "");
          if (this.isObject(settingVal) && settingVal.type === "icon-select" && Array.isArray(settingVal.options)) {
            fields.push({
              key,
              displayKey,
              label: settingVal.label || null,
              type: "icon-select",
              options: settingVal.options,
              defaultValue: settingVal.default !== void 0 ? settingVal.default : settingVal.options[0] && settingVal.options[0].value,
              // the value when nothing is chosen (optional: a second click on the
              // chosen icon deselects it)
              emptyValue: settingVal.empty,
              with: this.withField(settings, settingVal)
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
              // variants (e.g. the cards' button style): only those switched on
              options: settingVal.options.filter((o) => !["variant", "variant2", "variant3"].includes(o) || !Array.isArray(this.variants) || this.variants.includes(o)),
              defaultValue: settingVal.default !== void 0 ? settingVal.default : settingVal.options[0],
              // the value when nothing is chosen (optional: then it may stay empty)
              emptyValue: settingVal.empty,
              // (optional: an icon per option instead of its text, the text then
              // its tooltip)
              icons: this.isObject(settingVal.icons) ? settingVal.icons : null,
              // (a second choice in the same row)
              with: this.withField(settings, settingVal)
            });
            continue;
          }
          let defaultValue = false;
          if (this.isObject(settingVal) && "default" in settingVal) {
            defaultValue = settingVal.default;
          }
          fields.push({ key, displayKey, type: "toggle", defaultValue, label: this.isObject(settingVal) && settingVal.label || null });
        }
        return fields;
      },
      // a setting's second choice in its row ("with": the other key)
      withField(settings, settingVal) {
        const withVal = settingVal.with ? settings[settingVal.with] : null;
        if (!this.isObject(withVal) || !Array.isArray(withVal.options)) return null;
        return { key: settingVal.with, label: withVal.label || null, displayKey: settingVal.with.replace(/^item-/, ""), options: withVal.options, defaultValue: withVal.default !== void 0 ? withVal.default : withVal.options[0] };
      },
      // an icon chosen; the chosen one again: none (where the choice may
      // stay empty)
      chooseIcon(field, value) {
        const path = "settings.fields.layout." + field.key + ".default";
        const current = this.getVal(path, field.defaultValue);
        this.setVal(path, current === value && field.emptyValue !== void 0 ? field.emptyValue : value);
      },
      // the chosen drawing of an icon choice has a stroke (a filled one or
      // none: no stroke to set)
      iconHasStroke(field) {
        const value = this.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue);
        const opt = field.options.find((o) => o.value === value);
        return !!(opt && /stroke=/.test(opt.svg || "") && value !== "none");
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
        if (this.view === "defaults" && cat.key === "layout" && this.blockType === "pwlogocloud" && this.getVal("settings.fields.layout.item-format.default", "square") === "flexible") {
          fields = fields.filter((f) => !f.key.startsWith("logos-"));
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
          const paddings = fields.filter((f) => f.key.startsWith("padding"));
          const others = fields.filter((f) => f !== radius && !paddings.includes(f));
          const sections = [];
          if (paddings.length) sections.push({ key: "paddings", heading: this.$t("prw.headline.spacing"), help: this.$t("prw.hint.blockPaddings"), fields: paddings });
          if (radius && !this.blocksSquare) sections.push({ key: "radius", heading: this.$t("prw.prop.border-radius"), help: this.$t("prw.hint.blockRadius"), fields: [radius] });
          const headings = { "position-": "prw.headline.contentPosition", "columns-": "pw.headline.columns", "logos-": "prw.headline.logos", "multicolumn-": "prw.headline.positioning" };
          const helps = { "position-": "prw.hint.contentPosition", "multicolumn-": "prw.hint.multicolumnPosition" };
          for (const f of others) {
            const prefix = Object.keys(headings).find((p) => f.key.startsWith(p));
            const key = prefix || f.key;
            const section = sections.find((sec) => sec.key === key);
            if (section) section.fields.push(f);
            else sections.push({ key, heading: prefix ? this.$t(headings[prefix]) : null, help: helps[prefix] ? this.$t(helps[prefix]) : null, fields: [f] });
          }
          return sections;
        }
        if (!fields.length) return [];
        const styleHelp = (key) => this.view === "defaults" && key === "theme" ? this.$t("prw.hint.themeDefault") : null;
        if (this.view === "defaults" && cat.key === "style") {
          const help = !fields.some((f) => f.key === "theme") ? null : fields.length > 1 ? this.$t("prw.hint.styleDefault") : styleHelp("theme");
          return [{ key: "style", heading: this.drawerLabel("style"), help, fields }];
        }
        const heading = this.categoryHeading(cat.key);
        const repeats = this.view !== "layout" && heading === this.drawerLabel(cat.key);
        return [{ key: "main", heading: repeats ? null : heading, fields }];
      },
      // the help text below a card; the grid's follows its switch (full width
      // or adjusted, for the chosen screen size)
      cardHelp(cat, sec) {
        if (this.isGridDefaults(cat)) {
          return this.$t(this.gridAdjusted(sec.fields, this.secBp("grid")) ? "prw.hint.gridCustom" : "prw.hint.gridFull");
        }
        if (this.view === "defaults" && cat.key === "settings") return this.$t("prw.hint.settingsDefault");
        if (this.bpKeyOf(cat, sec) === "logos-") return this.$t("prw.hint.logosPerRow");
        if (this.bpKeyOf(cat, sec) === "columns-") return this.$t("prw.hint.columnsDefault");
        return sec.help;
      },
      // a grid row's label without its screen size (chosen above the card)
      gridFieldLabel(key) {
        return this.$t(key.startsWith("grid-size-") ? "prw.label.gridWidth" : "prw.label.gridOffset");
      },
      // cards with a value per screen size (sm … xl): the grid, the columns,
      // the logos per row – one size at a time, chosen above the card
      bpKeyOf(cat, sec) {
        if (this.isGridDefaults(cat)) return "grid";
        if (this.view === "defaults" && cat.key === "layout" && ["columns-", "logos-"].includes(sec.key)) return sec.key;
        return null;
      },
      secBp(key) {
        return this.sectionBp[key] || "lg";
      },
      // the row's label in such a card (the logos: "Logos per row" under "Logos")
      bpRowLabel(key, sec) {
        if (key === "logos-") return this.$t("kirbyblock-logocloud.per-row");
        return sec.heading;
      },
      // the grid's start values (Startwerte › Raster)
      isGridDefaults(cat) {
        return this.view === "defaults" && cat.key === "grid";
      },
      // a screen size adjusted: switched so, or its width / offset other than
      // full width
      gridAdjusted(fields, bp) {
        if (this.gridCustom[bp]) return true;
        return fields.filter((f) => f.key.endsWith("-" + bp)).some((f) => {
          const val = Number(this.getVal("settings.fields.grid." + f.key + ".default", f.defaultValue));
          return f.key.startsWith("grid-size-") ? val !== 12 : val !== 0;
        });
      },
      // full width: its width 12, its offset 0
      setGridMode(fields, bp, mode) {
        this.$set(this.gridCustom, bp, mode === "custom");
        if (mode !== "full") return;
        for (const f of fields.filter((fl) => fl.key.endsWith("-" + bp))) {
          this.selectOption("settings.fields.grid." + f.key + ".default", f.key.startsWith("grid-size-") ? 12 : 0, f.defaultValue);
        }
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
          const locked = (k) => this.isObject(all[k]) && all[k].locked === true;
          const row = (k) => ({ id: k, keys: [k], label: this.fieldLabel(k) });
          const groups = [];
          const extras = {};
          for (const f of this.contentExtraFields()) {
            extras[f.key] = [...f.lead, ...f.extras].filter((p) => !(this.isObject(all[f.key][p.key]) && all[f.key][p.key].locked === true)).map((p) => {
              const pKey = "prw.property." + p.key;
              const pLabel = this.$t(pKey);
              return { id: f.key + "-" + p.key, keys: [f.key + "-" + p.key], label: pLabel && pLabel !== pKey ? pLabel : p.key };
            });
          }
          const own = keys2.filter((k) => !k.startsWith("item-")).flatMap((k) => [...locked(k) ? [] : [row(k)], ...extras[k] || []]);
          const items = keys2.filter((k) => k.startsWith("item-") && !locked(k)).map(row);
          if (own.length) groups.push({ key: "block", heading: null, rows: own });
          if (items.length) groups.push({ key: "items", heading: this.$t("prw.tab.items"), rows: items });
          return groups;
        }
        let keys = Object.keys(all).filter((k) => !(tab === "layout" && k.startsWith("item-")) && this.isObject(all[k]) && "default" in all[k]);
        if (tab === "layout") {
          const rank = (k) => k.startsWith("padding") ? 0 : k.startsWith("radius") ? 1 : 2;
          keys = keys.map((k, i) => [k, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([k]) => k);
        }
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
            const own = this.isObject(all[k]) && all[k].label ? this.$t(all[k].label) : null;
            rows.push({ id: k, keys: [k], label: pLabel && pLabel !== pKey ? pLabel : own || this.categoryFieldLabel(k) });
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
        const extraKeys = this.contentExtraFields().map((f) => f.key);
        const own = this.presetFields(this.getContentFields()).filter((f) => !extraKeys.includes(f.key));
        const editor = this.getEditorField();
        if (editor && editor.properties.length) {
          const order = Object.keys(this.getDefault("settings.fields.content") || {});
          const at = own.findIndex((f) => order.indexOf(f.key) > order.indexOf("editor"));
          if (order.includes("editor") && at >= 0) own.splice(at, 0, editor);
          else own.push(editor);
        }
        const ownRows = own.map((f) => this.contentToolbarRow(f)).filter((r) => r.items.length);
        if (ownRows.length) groups.push({ key: "block", heading: this.$t("prw.headline.fields"), help: this.$t("prw.hint.contentDefaults"), rows: ownRows });
        const itemRows = this.presetFields(this.getItemDefaultsContentFields()).map((f) => this.contentToolbarRow(f)).filter((r) => r.items.length);
        if (itemRows.length) groups.push({ key: "items", heading: this.$t("prw.tab.items"), rows: itemRows });
        return groups;
      },
      // a content field's dropdowns (as in the drawer: flourish … level, then
      // the editor mode), each with the allowed options and the start value
      // content fields with settings beyond the drawer's dropdowns (the media's
      // type, size, corner style), each with its corner switches if it has them
      contentExtraFields() {
        const dropdowns = ["flourish", "multiline", "textbackground", "style", "align", "sizes", "level", "mode"];
        const raw = this.getDefault("settings.fields.content") || {};
        return this.getContentFields().map((f) => ({
          key: f.key,
          // the type of a field (the media type) leads, before its dropdowns
          lead: f.properties.filter((p) => p.key === "type"),
          extras: f.properties.filter((p) => !dropdowns.includes(p.key) && p.key !== "type"),
          corners: this.isObject(raw[f.key]) && "radius-top-left" in raw[f.key],
          // its dropdowns (the media's alignment) go into the same card
          toolbar: this.contentToolbarRow(f)
        })).filter((f) => f.lead.length || f.extras.length);
      },
      contentToolbarRow(field) {
        const order = ["flourish", "multiline", "textbackground", "align", "sizes", "style", "level", "mode"];
        const items = field.properties.filter((p) => order.includes(p.key)).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)).map((p) => {
          const options = this.getActiveOptions(field.key, p.key, p);
          const value = this.getVal("settings.fields.content." + field.key + "." + p.key + ".default", p.pluginDefault);
          return {
            key: p.key === "sizes" ? "size" : p.key,
            prop: p,
            value: options.includes(value) ? value : options[0],
            options,
            locked: this.isLocked("settings.fields.content." + field.key + "." + p.key + ".default")
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
                  // the block's own wording (its label key + the value), else the general one
                  label: val.label || null,
                  options: opts.map((v) => ({ value: v, text: this.itemOptionLabel({ label: val.label }, v) }))
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
        if (this.isLocked(path)) return;
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
        const ov = this.isLocked(path) ? this.patchedAt(path) : this.nested(this.overrides || {}, path);
        const value = ov !== void 0 ? ov : defaultVal;
        if (!path.endsWith(".default")) return value;
        const field = path.slice(0, -".default".length);
        return validStart(value, this.getDefault(field + ".options"), this.getDefault(field + ".empty"));
      },
      getOverrideOnly(path) {
        if (this.isLocked(path)) return this.patchedAt(path);
        return this.nested(this.overrides || {}, path);
      },
      // --- Values the exceptions set (Settings › Configuration) ---
      // the value at a settings path (settings.fields.… → the exception's
      // fields.…); undefined where the exceptions set none
      patchedAt(path) {
        const all = this.pwPatches ? this.pwPatches() : null;
        const patch = all && this.block ? all[this.block.blockType] : null;
        if (!patch || typeof patch !== "object" || !path.startsWith("settings.")) return void 0;
        return this.nested(patch, path.slice("settings.".length));
      },
      // locked: shown with the value that applies, not changeable here
      isLocked(path) {
        return this.patchedAt(path) !== void 0;
      },
      hasOverride(path) {
        return this.nested(this.overrides || {}, path) !== void 0;
      },
      setVal(path, value) {
        if (this.isLocked(path)) return;
        if (!this.overrides || Array.isArray(this.overrides)) {
          this.$emit("update:overrides", {});
        }
        this.setNested(this.overrides, path, value);
        this.markDirty();
      },
      setValOrClear(path, value, placeholder) {
        if (this.isLocked(path)) return;
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
      // the radius set for a corner (shown also while the corner is off, then
      // fainter)
      cornerHint(corner, on, values) {
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
      // an option of an item setting: the block's own wording (its label key
      // + the value, e.g. kirbyblock-logocloud.item-format.flexible), else the general one
      itemOptionLabel(field, val) {
        if (field.label) {
          const own = this.$t(field.label + "." + val);
          if (own && own !== field.label + "." + val) return own;
        }
        const pwKey = "pw.option." + val;
        const pw = this.$t(pwKey);
        return pw && pw !== pwKey ? pw : val;
      },
      toggleOptionLabel(val) {
        const pwKey = "pw.option." + val;
        const pwT = this.$t(pwKey);
        if (pwT && pwT !== pwKey) return pwT;
        return val;
      },
      // --- Nested object helpers ---
      nested(obj2, path) {
        if (!path) return void 0;
        return path.split(".").reduce((o, k) => o && o[k] !== void 0 ? o[k] : void 0, obj2);
      },
      setNested(obj2, path, value) {
        const keys = path.split(".");
        let cur = obj2;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!cur[keys[i]] || typeof cur[keys[i]] !== "object") {
            this.$set(cur, keys[i], {});
          }
          cur = cur[keys[i]];
        }
        this.$set(cur, keys[keys.length - 1], value);
      },
      cleanEmpty(obj2, path) {
        const val = this.nested(obj2, path);
        if (val && typeof val === "object" && Object.keys(val).length === 0) {
          this.deleteNested(obj2, path);
        }
      },
      deleteNested(obj2, path) {
        const keys = path.split(".");
        let cur = obj2;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!cur[keys[i]]) return;
          cur = cur[keys[i]];
        }
        this.$delete(cur, keys[keys.length - 1]);
      },
      isObject(val) {
        return val && typeof val === "object" && !Array.isArray(val);
      },
      hasNestedProps(obj2) {
        for (const v of Object.values(obj2)) {
          if (this.isObject(v) && ("options" in v || "default" in v)) return true;
        }
        return false;
      }
    }
  };
  var _sfc_render$j = function render() {
    var _vm = this, _c = _vm._self._c;
    return _vm.hasRows() ? _c("div", { staticClass: "pw-wizard-block-sections" }, [_vm.view === "defaults" || _vm.view === "presets" || _vm.view === "layout" ? _c("div", { staticClass: "pw-wizard-tab-content" }, [_vm.view === "defaults" ? _c("header", { staticClass: "k-drawer-header pw-drawer-strip" }, [_c("k-drawer-tabs", { attrs: { "tab": _vm.currentDrawerTab, "tabs": _vm.drawerTabs }, on: { "open": function($event) {
      _vm.drawerTab = $event;
    } } })], 1) : _vm._e(), _vm.view === "defaults" && _vm.currentDrawerTab === "content" ? [_vm._l(_vm.contentToolbarGroups(), function(group) {
      return _c("section", { key: "ct-" + group.key, staticClass: "pw-card-section" }, [group.heading ? _c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(group.heading))])]) : _vm._e(), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(group.rows, function(row) {
        return _c("div", { key: row.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.fieldLabel(row.key)))]), row.items.some((i) => i.locked) ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options" }, [_c("pw-field-toolbar", { attrs: { "items": row.items }, on: { "input": function($event) {
          return _vm.setContentPreset(row, $event);
        } } })], 1)])])]);
      }), 0), group.help ? _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": group.help } }) : _vm._e()], 1);
    }), _vm._l(_vm.contentExtraFields(), function(field) {
      return _c("section", { key: "cx-" + field.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(_vm.fieldLabel(field.key)))])]), _c("div", { staticClass: "pw-card pw-field-table" }, [_vm._l(field.lead, function(prop) {
        return _c("pw-field-row", { key: field.key + "-" + prop.key, attrs: { "uid": _vm.blockType + "-" + field.key + "-" + prop.key, "label": prop.key, "plugin": _vm.block.plugin || "", "all-options": prop.allOptions, "active-options": prop.allOptions, "current-default": _vm.getVal("settings.fields.content." + field.key + "." + prop.key + ".default", prop.pluginDefault), "locked": _vm.isLocked("settings.fields.content." + field.key + "." + prop.key + ".default"), "plugin-default": prop.pluginDefault, "modified": _vm.hasOverride("settings.fields.content." + field.key + "." + prop.key) }, on: { "update:default": function($event) {
          return _vm.selectOption("settings.fields.content." + field.key + "." + prop.key + ".default", $event, prop.pluginDefault);
        } } });
      }), _vm._l(field.toolbar.items, function(item) {
        return _c("div", { key: field.key + "-tb-" + item.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.property." + item.prop.key)))]), item.locked ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options" }, [_c("pw-field-toolbar", { attrs: { "items": [item] }, on: { "input": function($event) {
          return _vm.setContentPreset(field.toolbar, $event);
        } } })], 1)])])]);
      }), _vm._l(field.extras, function(prop) {
        return _c("pw-field-row", { key: field.key + "-" + prop.key, attrs: { "uid": _vm.blockType + "-" + field.key + "-" + prop.key, "label": prop.key, "plugin": _vm.block.plugin || "", "all-options": prop.allOptions, "active-options": prop.allOptions, "current-default": _vm.getVal("settings.fields.content." + field.key + "." + prop.key + ".default", prop.pluginDefault), "locked": _vm.isLocked("settings.fields.content." + field.key + "." + prop.key + ".default"), "plugin-default": prop.pluginDefault, "modified": _vm.hasOverride("settings.fields.content." + field.key + "." + prop.key) }, on: { "update:default": function($event) {
          return _vm.selectOption("settings.fields.content." + field.key + "." + prop.key + ".default", $event, prop.pluginDefault);
        } } });
      }), field.corners && _vm.getVal("settings.fields.content." + field.key + ".radius.default", "none") === "custom" ? _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel("radius")))]), ["top-left", "top-right", "bottom-left", "bottom-right"].some((c) => _vm.isLocked("settings.fields.content." + field.key + ".radius-" + c + ".default")) ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options pw-toggle-group pw-corner-grid" }, _vm._l(["top-left", "top-right", "bottom-left", "bottom-right"], function(corner) {
        return _c("span", { key: corner, staticClass: "pw-corner-cell", attrs: { "inert": _vm.isLocked("settings.fields.content." + field.key + ".radius-" + corner + ".default") || null } }, [_c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields.content." + field.key + ".radius-" + corner + ".default", false), "text": _vm.toggleOptionLabel(corner) }, on: { "input": function($event) {
          return _vm.setVal("settings.fields.content." + field.key + ".radius-" + corner + ".default", $event);
        } } }), _c("span", { staticClass: "pw-field-hint", class: { "is-zero": !_vm.getVal("settings.fields.content." + field.key + ".radius-" + corner + ".default", false) } }, [_vm._v(_vm._s(_vm.cornerHint(corner, true, _vm.mediaRadius)))])], 1);
      }), 0)])])]) : _vm._e()], 2)]);
    })] : _vm._e(), _vm.view === "presets" ? _vm._l(_vm.allRestrictionGroups(), function(group) {
      return _c("section", { key: "rg-" + group.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(group.heading))])]), _c("div", { staticClass: "pw-card pw-field-table" }, _vm._l(group.rows, function(row) {
        return _c("div", { key: row.id, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(row.label))]), _vm.isHidden(row.keys) ? _c("k-icon", { staticClass: "pw-field-state-eye", attrs: { "type": "hidden" } }) : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggle-input", { attrs: { "value": !_vm.isHidden(row.keys), "text": _vm.$t(_vm.isHidden(row.keys) ? "prw.field.hidden" : "prw.field.visible") }, on: { "input": function($event) {
          return _vm.toggleHidden(row.keys);
        } } })], 1)])])]);
      }), 0)]);
    }) : _vm._e(), _vm._l(_vm.getCategories(), function(cat) {
      return _vm._l(_vm.view === "layout" || cat.key === _vm.currentDrawerTab ? _vm.catSections(cat) : [], function(sec) {
        return _c("section", { key: "card-" + cat.key + "-" + sec.key, staticClass: "pw-card-section" }, [sec.heading || _vm.bpKeyOf(cat, sec) ? _c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(sec.heading || _vm.drawerLabel(cat.key)))]), _vm.bpKeyOf(cat, sec) ? _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(["sm", "md", "lg", "xl"], function(b) {
          return _c("button", { key: "gbp-" + b, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.secBp(_vm.bpKeyOf(cat, sec)) === b ? "true" : "false" }, on: { "click": function($event) {
            _vm.$set(_vm.sectionBp, _vm.bpKeyOf(cat, sec), b);
          } } }, [_vm._v(_vm._s(b.toUpperCase()))]);
        }), 0) : _vm._e()]) : _vm._e(), _c("div", { staticClass: "pw-card pw-field-table" }, [_vm.isGridDefaults(cat) ? _c("div", { staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.gridLayout")))])]), _c("div", { staticClass: "pw-field-row-options" }, [_c("k-toggles-input", { attrs: { "value": _vm.gridAdjusted(sec.fields, _vm.secBp("grid")) ? "custom" : "full", "options": [{ value: "full", text: _vm.$t("prw.option.gridFull") }, { value: "custom", text: _vm.$t("prw.option.gridCustom") }], "grow": false, "required": true }, on: { "input": function($event) {
          _vm.setGridMode(sec.fields, _vm.secBp("grid"), $event);
        } } })], 1)])])]) : _vm._e(), _vm._l(_vm.isGridDefaults(cat) ? _vm.gridAdjusted(sec.fields, _vm.secBp("grid")) ? sec.fields.filter((f) => f.key.endsWith("-" + _vm.secBp("grid"))) : [] : _vm.bpKeyOf(cat, sec) ? sec.fields.filter((f) => f.key.endsWith("-" + _vm.secBp(_vm.bpKeyOf(cat, sec)))) : sec.fields, function(field) {
          return [field.type === "fieldrow" ? _c("pw-field-row", { key: field.key, attrs: { "uid": _vm.blockType + "-" + cat.key + "-" + field.key, "label": field.key, "all-options": _vm.fieldOptions(field), "active-options": cat.key === "grid" ? _vm.fieldOptions(field) : _vm.getCategoryActiveOptions(cat.key, field.key, field).filter((o) => _vm.fieldOptions(field).includes(o)), "current-default": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.pluginDefault), "locked": _vm.isLocked("settings.fields." + cat.key + "." + field.key + ".default"), "plugin-default": field.pluginDefault, "enabled": true, "modified": _vm.hasOverride("settings.fields." + cat.key + "." + field.key), "required": field.required === true, "plugin": _vm.block.plugin || "" }, on: { "update:options": function($event) {
            return _vm.setCategoryOptions(cat.key, field.key, field, $event);
          }, "update:default": function($event) {
            return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event, field.pluginDefault);
          } } }) : _vm._e(), field.type === "toggles" ? _c("div", { key: field.key, staticClass: "pw-field-row", attrs: { "data-guide": _vm.guideType(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.isGridDefaults(cat) ? _vm.gridFieldLabel(field.key) : _vm.bpKeyOf(cat, sec) ? _vm.bpRowLabel(_vm.bpKeyOf(cat, sec), sec) : field.label ? _vm.$t(field.label) : _vm.categoryFieldLabel(field.key))), field.required ? _c("span", { staticClass: "pw-field-required" }, [_vm._v("*")]) : _vm._e()]), _vm.isLocked("settings.fields." + cat.key + "." + field.key + ".default") ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options", attrs: { "inert": _vm.isLocked("settings.fields." + cat.key + "." + field.key + ".default") || null } }, [_c("k-toggles-input", { attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue), "options": field.options, "grow": false, "reset": field.reset !== false, "required": field.required === true }, on: { "input": function($event) {
            return _vm.selectOption("settings.fields." + cat.key + "." + field.key + ".default", $event, field.defaultValue);
          } } }), _vm.globalHint(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) ? _c("span", { staticClass: "pw-field-hint", class: { "is-zero": _vm.globalHint(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) === "0rem" } }, [_vm._v(_vm._s(_vm.globalHint(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue))))]) : _vm._e()], 1)])])]) : field.type === "toggle-group" ? _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key)))]), field.subFields.some((sub) => _vm.isLocked("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default")) ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options pw-toggle-group", class: { "pw-corner-grid": _vm.isCornerGroup(field) } }, _vm._l(_vm.cornerOrder(field.subFields), function(sub) {
            return _c("span", { key: sub.key, staticClass: "pw-corner-cell", attrs: { "inert": _vm.isLocked("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default") || null } }, [_c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default", sub.defaultValue), "text": _vm.toggleOptionLabel(sub.label) }, on: { "input": function($event) {
              _vm.setVal("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default", $event);
            } } }), _vm.isCornerGroup(field) ? _c("span", { staticClass: "pw-field-hint", class: { "is-zero": !_vm.getVal("settings.fields." + (field.catKey || cat.key) + "." + sub.key + ".default", sub.defaultValue) } }, [_vm._v(_vm._s(_vm.cornerHint(sub.label, true, _vm.globalValues["global-"])))]) : _vm._e()], 1);
          }), 0)])])]) : field.type === "single" ? _c("div", { key: field.key, staticClass: "pw-field-row", attrs: { "data-guide": _vm.guideType(field.key, _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue)) } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.categoryFieldLabel(field.key)))]), _vm.isLocked("settings.fields." + cat.key + "." + field.key + ".default") ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options", attrs: { "inert": _vm.isLocked("settings.fields." + cat.key + "." + field.key + ".default") || null } }, [field.defaultValue !== null && typeof field.defaultValue === "boolean" ? _c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields." + cat.key + "." + field.key + ".default", field.defaultValue), "text": [_vm.$t("pw.option.disabled"), _vm.$t("pw.option.enabled")] }, on: { "input": function($event) {
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
        })], 2), _vm.cardHelp(cat, sec) ? _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.cardHelp(cat, sec) } }) : _vm._e()], 1);
      });
    })], 2) : _vm._e(), _vm.view === "items-defaults" || _vm.view === "items-layout" ? _c("div", { staticClass: "pw-wizard-tab-content" }, [_vm.view === "items-defaults" && _vm.getItemRadiusFields().length ? _c("div", { staticClass: "pw-field-block" }, _vm._l(_vm.getItemRadiusFields(), function(field) {
      return _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.fieldLabel(field.displayKey)))]), field.subFields.some((sub) => _vm.isLocked("settings.fields.layout." + sub.key + ".default")) ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options", class: { "pw-toggle-group": field.type === "toggle-group", "pw-corner-grid": _vm.isCornerGroup(field) } }, _vm._l(_vm.cornerOrder(field.subFields), function(sub) {
        return _c("span", { key: sub.key, staticClass: "pw-corner-cell", attrs: { "inert": _vm.isLocked("settings.fields.layout." + sub.key + ".default") || null } }, [_c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields.layout." + sub.key + ".default", sub.defaultValue), "text": _vm.toggleOptionLabel(sub.label) }, on: { "input": function($event) {
          return _vm.setVal("settings.fields.layout." + sub.key + ".default", $event);
        } } }), _vm.isCornerGroup(field) ? _c("span", { staticClass: "pw-field-hint", class: { "is-zero": !_vm.getVal("settings.fields.layout." + sub.key + ".default", sub.defaultValue) } }, [_vm._v(_vm._s(_vm.cornerHint(sub.label, true, _vm.itemRadius)))]) : _vm._e()], 1);
      }), 0)])])]);
    }), 0) : _vm._e(), _vm.view === "items-layout" && _vm.getItemLayoutSettings().length ? _c("div", { staticClass: "pw-field-block" }, _vm._l(_vm.getItemLayoutSettings(), function(field) {
      return _c("div", { key: field.key, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(field.label ? _vm.$t(field.label) : _vm.fieldLabel(field.displayKey)))]), _vm.isLocked("settings.fields.layout." + field.key + ".default") ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options", attrs: { "inert": _vm.isLocked("settings.fields.layout." + field.key + ".default") || null } }, [field.type === "icon-select" ? _c("div", { staticClass: "pw-icon-select-row" }, [_c("div", { staticClass: "pw-icon-select" }, _vm._l(field.options, function(opt) {
        return _c("button", { key: opt.value, staticClass: "pw-icon-option", class: { "is-active": _vm.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue) === opt.value }, attrs: { "type": "button", "aria-pressed": _vm.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue) === opt.value ? "true" : "false" }, domProps: { "innerHTML": _vm._s('<svg viewBox="0 0 24 24" aria-hidden="true">' + opt.svg + "</svg>") }, on: { "click": function($event) {
          return _vm.chooseIcon(field, opt.value);
        } } });
      }), 0), field.with && _vm.iconHasStroke(field) ? _c("k-toggles-input", { staticClass: "pw-icon-select-with", attrs: { "value": _vm.getVal("settings.fields.layout." + field.with.key + ".default", field.with.defaultValue), "options": field.with.options.map((o) => ({ value: o, text: _vm.itemOptionLabel(field.with, o) })), "grow": false, "required": true }, on: { "input": function($event) {
        return _vm.setVal("settings.fields.layout." + field.with.key + ".default", $event);
      } } }) : _vm._e()], 1) : field.type === "select" ? _c("div", { staticClass: "pw-icon-select-row" }, [_c("k-toggles-input", { attrs: { "value": _vm.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue), "options": field.options.map((o) => ({ value: o, text: _vm.itemOptionLabel(field, o), icon: field.icons ? field.icons[o] : void 0 })), "labels": !field.icons, "grow": false, "required": field.emptyValue === void 0 }, on: { "input": function($event) {
        _vm.setVal("settings.fields.layout." + field.key + ".default", ($event === null || $event === "") && field.emptyValue !== void 0 ? field.emptyValue : $event);
      } } }), field.with ? _c("k-toggles-input", { attrs: { "value": _vm.getVal("settings.fields.layout." + field.with.key + ".default", field.with.defaultValue), "options": field.with.options.map((o) => ({ value: o, text: _vm.itemOptionLabel(field.with, o) })), "grow": false, "required": true }, on: { "input": function($event) {
        return _vm.setVal("settings.fields.layout." + field.with.key + ".default", $event);
      } } }) : _vm._e()], 1) : _c("k-toggle-input", { attrs: { "value": _vm.getVal("settings.fields.layout." + field.key + ".default", field.defaultValue), "text": [_vm.$t("pw.option.disabled"), _vm.$t("pw.option.enabled")] }, on: { "input": function($event) {
        return _vm.setVal("settings.fields.layout." + field.key + ".default", $event);
      } } }), _vm.rowBp ? _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
        return _c("button", { key: "rbp-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t({ default: "prw.label.mobile", lg: "prw.label.tablet", xl: "prw.label.desktop" }[b]), "aria-label": _vm.$t({ default: "prw.label.mobile", lg: "prw.label.tablet", xl: "prw.label.desktop" }[b]), "aria-pressed": _vm.rowBp === b ? "true" : "false" }, on: { "click": function($event) {
          return _vm.$emit("update:row-bp", b);
        } } }, [_c("k-icon", { attrs: { "type": { default: "mobile", lg: "tablet", xl: "display" }[b] } })], 1);
      }), 0) : _vm._e()], 1)])])]);
    }), 0) : _vm._e()]) : _vm._e()]) : _vm._e();
  };
  var _sfc_staticRenderFns$j = [];
  _sfc_render$j._withStripped = true;
  var __component__$j = /* @__PURE__ */ normalizeComponent(
    _sfc_main$j,
    _sfc_render$j,
    _sfc_staticRenderFns$j
  );
  __component__$j.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BlockSettings.vue";
  const BlockSettings = __component__$j.exports;
  const _sfc_main$i = {
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
  var _sfc_render$i = function render() {
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
  var _sfc_staticRenderFns$i = [];
  _sfc_render$i._withStripped = true;
  var __component__$i = /* @__PURE__ */ normalizeComponent(
    _sfc_main$i,
    _sfc_render$i,
    _sfc_staticRenderFns$i
  );
  __component__$i.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalFonts.vue";
  const GlobalFonts = __component__$i.exports;
  const _sfc_main$h = {
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
        previewBp: readPreviewBp(),
        // theme whose colours the colour rows show
        colorTheme: "default",
        // size step shown in the preview (headings without a base size)
        // size step per element (edited and previewed): heading → "lg",
        // elements with a base size → "normal"
        previewSteps: {},
        // heading preview with the text marking / the flourish
        previewMarked: false,
        // the value whose question mark is hovered: its area tinted
        hoveredArea: null,
        // the buttons preview: the second button below the first (then the gap
        // between them is a row gap)
        buttonsWrapped: false,
        previewFlourish: false,
        // media preview with a sample image
        // media radii kept while the corners are square
        mediaCustomRadius: null,
        openSections: {},
        resetFields: /* @__PURE__ */ new Set()
      };
    },
    watch: {
      // remembered for the next visit
      previewBp(bp) {
        savePreviewBp(bp);
      },
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
    mounted() {
      this.onResize = () => this.measureButtons();
      window.addEventListener("resize", this.onResize);
      this.measureButtons();
    },
    updated() {
      this.measureButtons();
    },
    beforeDestroy() {
      window.removeEventListener("resize", this.onResize);
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
        if (varName.endsWith("-paragraph-spacing")) return "row";
        if (varName === "button-row-gap") return "row";
        if (varName === "item-title-spacing") return "margin";
        if (varName.endsWith("cite-spacing") || varName === "caption-spacing" || varName === "button-gap") return "margin";
        if (/^(tagline|heading|editor|list|quote|media)-spacing$/.test(varName)) return "margin";
        if (varName === "button-spacing") return "text";
        if (varName === "button-icon-gap") return "text";
        if (varName === "list-indent") return "padding";
        if (varName === "list-number-indent") return "padding-y";
        if (varName === "list-item-spacing") return "text";
        if (!this.previewFlourish) return null;
        if (varName.endsWith("-flourish-margin-top")) return "row";
        if (varName.endsWith("-flourish-margin-bottom")) return "text";
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
      // button width: automatic or the same manual width for all buttons
      buttonWidthMode() {
        var _a, _b, _c;
        return this.getOverrideValue("button-width-mode") || ((_c = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.vars) == null ? void 0 : _b["button-width-mode"]) == null ? void 0 : _c.value) || "auto";
      },
      // button shadow: the chosen step's CSS (generates in elements.json)
      buttonShadow() {
        var _a, _b, _c, _d;
        const def = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.vars) == null ? void 0 : _b["button-shadow"];
        if (!def) return "none";
        const step = this.getOverrideValue("button-shadow") || def.value;
        return ((_d = (_c = def.generates) == null ? void 0 : _c["button-shadow"]) == null ? void 0 : _d[step]) || "none";
      },
      // buttons preview: is the second button in a row of its own? (the
      // preview sits in the sidebar, moved there by the portal)
      measureButtons() {
        this.$nextTick(() => {
          const box = document.querySelector(".pw-preview-column .pw-element-preview-buttons");
          const first = box && box.querySelector(".pw-element-preview-button");
          const second = box && box.querySelector(".pw-element-preview-button-second");
          const wrapped = !!(first && second && second.offsetTop > first.offsetTop + 1);
          if (wrapped !== this.buttonsWrapped) this.buttonsWrapped = wrapped;
        });
      },
      // the help text below a card (sizes, marking, flourish, colours, zoom)
      cardHelp(st) {
        const own = { "list:marker": "prw.hint.listMarker", "list:number": "prw.hint.listNumber", "list:spacing": "prw.hint.listSpacing", "button:shape": "prw.hint.buttonShape", "button:margin": "prw.hint.buttonMargin", "button:icon": "prw.hint.buttonIcon" };
        if (own[st.elementKey + ":" + st.category]) return this.$t(own[st.elementKey + ":" + st.category]);
        const keys = { sizes: "prw.hint.cardSizes", marked: "prw.hint.cardMarked", flourish: "prw.hint.cardFlourish", colors: "prw.hint.cardColors", zoom: "prw.hint.cardZoom" };
        return keys[st.category] ? this.$t(keys[st.category]) : "";
      },
      // media: the caption's gap to the image or video
      captionGap() {
        var _a, _b, _c;
        return this.getOverrideValue("caption-spacing") || ((_c = (_b = (_a = this.elementDefaults.caption) == null ? void 0 : _a.vars) == null ? void 0 : _b["caption-spacing"]) == null ? void 0 : _c.value) || "";
      },
      captionStyle(bp, theme) {
        return { ...this.previewStyle("caption", bp, theme), marginTop: this.guides ? 0 : this.captionGap() };
      },
      // item: the gap between title and description
      itemTitleGap() {
        var _a, _b, _c;
        return this.getOverrideValue("item-title-spacing") || ((_c = (_b = (_a = this.elementDefaults.item) == null ? void 0 : _a.vars) == null ? void 0 : _b["item-title-spacing"]) == null ? void 0 : _c.value) || "";
      },
      // item: its description, below the title (with guides: the band between)
      itemTextStyle(bp, theme) {
        return { ...this.previewStyle("item-text", bp, theme), marginTop: this.guides ? 0 : this.itemTitleGap(), "--pw-paragraph-gap": this.itemParagraphGap() };
      },
      // block links (Global › Blocks): underline none, always or on hover
      linkDecoration() {
        var _a, _b, _c;
        return (this.globalOverrides.global || {})["block-link-decoration"] || ((_c = (_b = (_a = this.globalDefaults.links) == null ? void 0 : _a.vars) == null ? void 0 : _b["block-link-decoration"]) == null ? void 0 : _c.value) || "none";
      },
      // their colour (per variant, with hover) and underline
      linkStyle(theme) {
        const color = (name) => {
          var _a, _b, _c;
          return ((this.globalOverrides.global || {})[theme] || {})[name] || ((_c = (_b = (_a = this.globalDefaults.colors) == null ? void 0 : _a.colors) == null ? void 0 : _b[name]) == null ? void 0 : _c[theme]) || "";
        };
        const v = (name) => {
          var _a, _b, _c;
          return (this.globalOverrides.global || {})[name] || ((_c = (_b = (_a = this.globalDefaults.links) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value) || "";
        };
        return {
          "--pw-link": color("block-link"),
          "--pw-link-hover": color("block-link-hover"),
          fontWeight: v("block-link-weight") === "bold" ? 700 : null,
          textDecorationThickness: v("block-link-thickness"),
          textUnderlineOffset: v("block-link-offset")
        };
      },
      // item: the space between the description's paragraphs
      itemParagraphGap() {
        var _a, _b, _c;
        return this.getOverrideValue("item-text-paragraph-spacing") || ((_c = (_b = (_a = this.elementDefaults.item) == null ? void 0 : _a.vars) == null ? void 0 : _b["item-text-paragraph-spacing"]) == null ? void 0 : _c.value) || "";
      },
      // buttons preview: the area of the hovered question mark
      buttonHotClass() {
        return {
          "button-gap": "is-hot-gap",
          "button-row-gap": "is-hot-row",
          "button-padding-h": "is-hot-padding-h",
          "button-padding-v": "is-hot-padding-v",
          "button-icon-gap": "is-hot-icon"
        }[this.hoveredArea] || null;
      },
      // gap between buttons (button-gap), as in the frontend
      buttonGap(name = "button-gap") {
        var _a, _b, _c;
        return this.getOverrideValue(name) || ((_c = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value) || "";
      },
      // gap between quote and source, as in the frontend
      // a value with an area in the preview (tinted while the cursor is in its field)
      hasArea(varName) {
        return /^(tagline|heading|editor|list|quote|media|button)-spacing$/.test(varName) || ["editor-paragraph-spacing", "cite-spacing", "button-gap", "button-row-gap", "button-icon-gap", "item-title-spacing", "item-text-paragraph-spacing", "caption-spacing", "list-indent", "list-number-indent", "list-item-spacing"].includes(varName) || this.previewFlourish && /-flourish-margin-(top|bottom)$/.test(varName);
      },
      // the space below an element (tagline, heading, text): override, else the plugin's
      spaceBelow(groupKey) {
        var _a, _b, _c;
        if (!["tagline", "heading", "editor", "list", "quote", "media", "button"].includes(groupKey)) return "";
        const name = groupKey + "-spacing";
        return this.getOverrideValue(name) || ((_c = (_b = (_a = this.elementDefaults[groupKey]) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value) || "";
      },
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
          paddingBottom: val("heading-flourish-margin-bottom", "0"),
          // the same for the tinted areas (guides)
          "--pw-flourish-pt": val("heading-flourish-margin-top", "0.5em"),
          "--pw-flourish-pb": val("heading-flourish-margin-bottom", "0")
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
        const part = varName.match(/^item-(?:title|text)-(.+)$/);
        if (part) {
          const pT = this.$t("prw.prop." + part[1]);
          if (pT && pT !== "prw.prop." + part[1]) return pT;
        }
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
          if (name === "element-item-title-text") return "title";
          if (name === "element-item-text-text") return "description";
          if (name === "element-list-marker") return "marker";
          if (name === "element-list-number") return "number";
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
        return ["colors", "marked", "flourish", "text", "marker", "number", "icon", "shape", "style", "slideshow", "zoom", "title", "description"].includes(category);
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
          const textRank = (name) => name.endsWith("-font-size") ? 1 : name.endsWith("-line-height") ? 2 : name.endsWith("-letter-spacing") ? 3 : name.endsWith("-paragraph-spacing") ? 4 : name.endsWith("-spacing") ? 5 : 0;
          const entries = Object.entries(group.vars).sort(([a], [b]) => ["text", "sizes", "title", "description"].includes(category) ? textRank(a) - textRank(b) : Number(b.endsWith("-font-size")) - Number(a.endsWith("-font-size")));
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
      // a size step's name: the steps of a scale starting at the base size
      // (the texts') named apart from the headings' (the same step is smaller)
      stepLabel(elementKey, step) {
        return this.$t((this.hasBaseFontSize(elementKey) ? "pw.option.text-" : "pw.option.") + step);
      },
      // option label from pagewizard's pw.option.* (e.g. uppercase → "Uppercase"), else the value
      optionText(value) {
        const key = "pw.option." + value;
        const t = this.$t(key);
        return t && t !== key ? t : value;
      },
      filteredOptions(varName, options) {
        if (!varName.endsWith("-font-weight")) {
          if (varName.endsWith("-content-align")) {
            return options.map((o) => ({ value: o, icon: "text-" + o, text: this.optionText(o) }));
          }
          if (varName === "list-marker") {
            return options.map((o) => ({ value: o, icon: "prw-marker-" + o, text: this.optionText(o) }));
          }
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
        return val.replace(/(rem|em|px|%)$/, "");
      },
      // unit of a responsive value at a device: % when set so, else the field's
      responsiveUnit(field, bp) {
        const val = this.getResponsiveOverride(field.varName, bp) || field.def[bp] || "";
        return String(val).endsWith("%") ? "%" : field.def.unit;
      },
      // the unit dropdown of a field (refs inside v-for come as arrays)
      unitMenu(varName) {
        const ref = this.$refs["unit-" + varName];
        return Array.isArray(ref) ? ref[0] : ref;
      },
      // switching the unit: % starts at 100, the field's unit at its default
      setResponsiveUnit(field, bp, unit) {
        if (unit === this.responsiveUnit(field, bp)) return;
        const value = unit === "%" ? "100" : this.stripUnit(field.def[bp]);
        this.setResponsiveValue(field.varName, bp, value, field.def[bp], unit);
      },
      setUnitValue(varName, value, defaultVal, unit) {
        const num = parseFloat(String(value).replace(",", "."));
        const withUnit = value === "" || isNaN(num) ? "" : num + (unit || "");
        this.setValue(varName, withUnit, defaultVal);
      },
      // em values relate to their element's font size (step and device shown)
      toPx(val, unit, varName) {
        if (!val) return "";
        const num = parseFloat(val);
        if (isNaN(num)) return "";
        if (unit === "rem" || val.endsWith("rem")) return Math.round(num * 16) + "px";
        if (unit === "em" || val.endsWith("em")) return Math.round(num * this.emBasePx(varName)) + "px";
        if (unit === "" && num > 0) return Math.round(num * 16) + "px";
        return "";
      },
      // font size in px an em value of this variable relates to: its
      // element's size at the chosen step and device, else 16px
      emBasePx(varName) {
        const elementKey = (varName || "").split("-")[0];
        if (!this.elementDefaults[elementKey]) return 16;
        const size2 = String(this.previewStyle(elementKey, this.previewBp, this.colorTheme).fontSize || "");
        const num = parseFloat(size2);
        if (isNaN(num)) return 16;
        if (size2.endsWith("px")) return num;
        return num * 16;
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
        if (groupKey === "item") return "__item__";
        if (groupKey === "list") return "__list__";
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
          // lists: their marker, indent and gap (the type of the text)
          // (the markers' colour with the bullets)
          list: ["marker", "number", "spacing"],
          quote: ["text", "sizes", "colors"],
          button: ["text", "padding", "margin", "shape", "style", "icon", "colors"],
          caption: ["text", "colors"],
          breadcrumb: ["text", "colors"],
          media: ["shape", "style", "slideshow", "zoom", "spacing"],
          cite: ["text", "colors"],
          // entries of a list: their title and description, each with its colour
          item: ["title", "description"]
        };
        return tabs[groupKey] || ["text", "sizes", "colors"];
      },
      varCategory(varName) {
        if (varName === "list-marker" || varName === "list-marker-size" || varName === "list-indent") return "marker";
        if (varName.startsWith("list-number-")) return "number";
        if (varName === "list-item-spacing" || varName === "list-spacing") return "spacing";
        if (varName.startsWith("item-title-")) return "title";
        if (varName.startsWith("item-text-")) return "description";
        if (varName === "cite-spacing" || varName === "caption-spacing") return "text";
        if (varName === "button-spacing") return "margin";
        if (varName === "media-spacing") return "spacing";
        if (/^(tagline|heading|editor|quote)-spacing$/.test(varName)) return "text";
        if (varName === "button-padding") return "padding";
        if (varName === "button-gap" || varName === "button-row-gap") return "margin";
        if (varName === "button-shape" || varName === "button-border-radius") return "shape";
        if (varName === "button-width-mode" || varName === "button-width" || varName === "button-content-align") return "shape";
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
        const tabLabels = { text: this.$t("prw.subtab.text"), sizes: this.$t("prw.subtab.sizes"), padding: this.$t("prw.headline.paddings"), margin: this.$t("prw.headline.margins"), shape: this.$t("prw.subtab.shape"), style: this.$t("pw.headline.style"), icon: this.$t("prw.subtab.icon"), slideshow: this.$t("prw.subtab.slideshow"), zoom: this.$t("prw.subtab.zoom"), marker: this.$t("prw.subtab.marker"), number: this.$t("prw.subtab.number"), spacing: this.$t("prw.headline.spacing"), title: this.$t("prw.subtab.title"), description: this.$t("prw.subtab.description"), marked: this.$t("prw.subtab.marked"), flourish: this.$t("prw.subtab.flourish"), colors: this.$t("prw.subtab.colors") };
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
          // manual width: all buttons equally wide, the text cut off with "…"
          ...this.buttonWidthMode() === "manual" ? { width: responsiveVal("width"), justifyContent: { left: "flex-start", right: "flex-end" }[get("content-align") || defVal("content-align")] || "center", "--pw-btn-white-space": "nowrap" } : {},
          // the sides for the tinted paddings (guides)
          "--pw-btn-pt": padding[0],
          "--pw-btn-pr": padding[1],
          "--pw-btn-pb": padding[2],
          "--pw-btn-pl": padding[3],
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
          marginRight: iconGapOv || iconGapDef,
          // the gap for its guide (resolved in the icon's font size, as the margin)
          "--pw-icon-gap": iconGapOv || iconGapDef
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
      // a list: its values (override, else the element's), the marker's or
      // numbers' colour of the variant shown
      previewListStyle(theme, numbered) {
        var _a, _b, _c;
        const v = (name) => {
          var _a2, _b2, _c2;
          return this.getOverrideValue(name) || ((_c2 = (_b2 = (_a2 = this.elementDefaults.list) == null ? void 0 : _a2.vars) == null ? void 0 : _b2[name]) == null ? void 0 : _c2.value) || "";
        };
        const marker = numbered ? { decimal: "decimal", "decimal-paren": "pw-decimal-paren", "lower-alpha": "lower-alpha", "lower-roman": "lower-roman" }[v("list-number-format")] || "decimal" : { disc: "disc", circle: "circle", box: "square", dash: '"–  "', arrow: '"→  "', chevron: '"›  "', check: '"✓  "', star: '"★  "' }[v("list-marker")] || "disc";
        const indent = v(numbered ? "list-number-indent" : "list-indent");
        const colorName = numbered ? "element-list-number" : "element-list-marker";
        const color = this.getColorOverrideValue(theme, colorName) || ((_c = (_b = (_a = this.elementDefaults.list) == null ? void 0 : _a.colors) == null ? void 0 : _b[colorName]) == null ? void 0 : _c[theme]) || "";
        const marginTop = numbered && !this.guides ? this.spaceBelow("list") : 0;
        return { marginTop, paddingLeft: indent, listStyleType: marker, "--pw-list-marker-size": numbered ? "100%" : v("list-marker-size") || "100%", "--pw-list-indent": indent, "--pw-list-gap": v("list-item-spacing"), "--pw-list-marker": color };
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
        const elKey = this.elementDefaults[groupKey] ? groupKey : groupKey.split("-")[0];
        const get = (prop) => {
          return this.getOverrideValue(prefix + "-" + prop);
        };
        const defVal = (prop, breakpoint) => {
          const group = this.elementDefaults[elKey];
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
        const colorDefault = ((_c = (_b = (_a = this.elementDefaults[elKey]) == null ? void 0 : _a.colors) == null ? void 0 : _b[colorVar]) == null ? void 0 : _c[t]) || "";
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
  var _sfc_render$h = function render() {
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
      }, expression: "previewBp" } })], 1), _c("div", { staticClass: "pw-element-preview", class: { "pw-element-preview-themed": _vm.previewThemed(groupKey), "has-guides": _vm.guides, "has-focus": _vm.guides && !!_vm.hoveredArea, "is-marked": groupKey === "heading" && _vm.previewMarked } }, [_vm._l([_vm.colorTheme], function(theme) {
        return _vm._l([_vm.previewBp], function(bp) {
          return _c("div", { key: theme + "-" + bp, staticClass: "pw-element-preview-col", style: { backgroundColor: _vm.blockBackground(theme) } }, [groupKey === "media" ? [_c("div", { staticClass: "pw-media-preview-img pw-media-preview-empty", style: _vm.mediaPreviewStyle(theme) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "stroke-width": "1", "opacity": "0.3" } }, [_c("rect", { attrs: { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" } }), _c("circle", { attrs: { "cx": "8.5", "cy": "8.5", "r": "1.5" } }), _c("path", { attrs: { "d": "M21 15l-5-5L5 21" } })])]), _c("div", { staticClass: "pw-media-preview-img pw-media-preview-photo", style: _vm.mediaPreviewStyle(theme) }, [_c("span", { staticClass: "pw-media-preview-zoom", style: { color: _vm.mediaColor(theme, "element-image-zoom"), backgroundColor: _vm.mediaColor(theme, "element-image-zoom-background") } }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" } }, [_c("circle", { attrs: { "cx": "11", "cy": "11", "r": "8" } }), _c("line", { attrs: { "x1": "21", "y1": "21", "x2": "16.65", "y2": "16.65" } })])])]), _c("div", { staticClass: "pw-media-preview-bullets" }, [_c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet") } }), _c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet-active") } }), _c("span", { style: { backgroundColor: _vm.mediaColor(theme, "element-slideshow-bullet") } })]), _vm.previewChildText(groupKey) ? [_vm.guides ? _c("span", { staticClass: "pw-element-space-below", class: { "is-hot": _vm.hoveredArea === "caption-spacing" }, style: { height: _vm.captionGap() } }) : _vm._e(), _c("span", { staticClass: "pw-element-preview-text", style: _vm.captionStyle(bp, theme) }, [_vm._v(_vm._s(_vm.previewChildText(groupKey)))])] : _vm._e()] : _vm.previewThemed(groupKey) ? [_c("span", { staticClass: "pw-element-preview-buttons", class: [_vm.buttonHotClass(), { "is-wrapped": _vm.buttonsWrapped }], style: { columnGap: _vm.buttonGap(), rowGap: _vm.buttonGap("button-row-gap"), "--pw-button-gap": _vm.buttonGap(), "--pw-button-row-gap": _vm.buttonGap("button-row-gap") } }, [_c("span", { staticClass: "pw-element-preview-button", style: _vm.previewButtonStyle(groupKey, theme, bp) }, [_c("span", { staticClass: "pw-button-content" }, [groupKey === "button" ? _c("span", { staticClass: "pw-preview-link-icon", style: _vm.previewButtonIconStyle(theme, bp) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "currentColor", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" } })])]) : _vm._e(), _c("span", { staticClass: "pw-button-text" }, [_vm._v(_vm._s(_vm.previewText(groupKey)))])])]), _c("span", { staticClass: "pw-element-preview-button pw-element-preview-button-second", style: _vm.previewButtonStyle(groupKey, theme, bp) }, [_c("span", { staticClass: "pw-button-content" }, [groupKey === "button" ? _c("span", { staticClass: "pw-preview-link-icon", style: _vm.previewButtonIconStyle(theme, bp) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "currentColor", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" } })])]) : _vm._e(), _c("span", { staticClass: "pw-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.sample.button.2")))])])]), _c("span", { staticClass: "pw-element-preview-buttons-row", style: { "--pw-button-row-gap": _vm.buttonGap("button-row-gap") } }, [_c("span", { staticClass: "pw-element-preview-button", style: _vm.previewButtonStyle(groupKey, theme, bp) }, [_c("span", { staticClass: "pw-button-content" }, [groupKey === "button" ? _c("span", { staticClass: "pw-preview-link-icon", style: _vm.previewButtonIconStyle(theme, bp) }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "currentColor", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" } })])]) : _vm._e(), _c("span", { staticClass: "pw-button-text" }, [_vm._v(_vm._s(_vm.$t("prw.sample.button.3")))])])])])])] : groupKey === "list" ? [_c("div", { staticClass: "pw-element-preview-text pw-element-preview-lists", style: _vm.previewStyle("editor", bp, theme) }, [_c("ul", { staticClass: "pw-element-preview-list", class: { "is-hot-indent": _vm.hoveredArea === "list-indent", "is-hot-gap": _vm.hoveredArea === "list-item-spacing" }, style: _vm.previewListStyle(theme, false) }, _vm._l(3, function(n) {
            return _c("li", { key: "li-" + n }, [_vm._v(_vm._s(_vm.$t("prw.sample.list." + n)))]);
          }), 0), _vm.guides ? _c("span", { staticClass: "pw-element-space-below", class: { "is-hot": _vm.hoveredArea === "list-spacing" }, style: { height: _vm.spaceBelow("list") } }) : _vm._e(), _c("ol", { staticClass: "pw-element-preview-list is-numbered", class: { "is-hot-indent": _vm.hoveredArea === "list-number-indent", "is-hot-gap": _vm.hoveredArea === "list-item-spacing" }, style: _vm.previewListStyle(theme, true) }, _vm._l(3, function(n) {
            return _c("li", { key: "ol-" + n }, [_vm._v(_vm._s(_vm.$t("prw.sample.list." + n)))]);
          }), 0), _vm.guides ? _c("span", { staticClass: "pw-element-space-below", class: { "is-hot": _vm.hoveredArea === "list-spacing" }, style: { height: _vm.spaceBelow("list") } }) : _vm._e()])] : groupKey === "item" ? [_c("span", { staticClass: "pw-element-preview-text", style: _vm.previewStyle("item-title", bp, theme) }, [_vm._v(_vm._s(_vm.$t("prw.sample.item.title")))]), _vm.guides ? _c("span", { staticClass: "pw-element-space-below", class: { "is-hot": _vm.hoveredArea === "item-title-spacing" }, style: { height: _vm.itemTitleGap() } }) : _vm._e(), _c("div", { staticClass: "pw-element-preview-text pw-element-preview-paragraphs", class: { "is-hot": _vm.hoveredArea === "item-text-paragraph-spacing" }, style: _vm.itemTextStyle(bp, theme) }, [_c("p", [_vm._v(_vm._s(_vm.$t("prw.sample.item.text")))]), _c("p", { style: { marginTop: _vm.itemParagraphGap() } }, [_vm._v(_vm._s(_vm.$t("prw.sample.item.text2")) + " "), _c("a", { staticClass: "pw-item-preview-link", style: _vm.linkStyle(theme), attrs: { "data-decoration": _vm.linkDecoration() } }, [_vm._v(_vm._s(_vm.$t("prw.sample.item.link")))]), _vm._v(" " + _vm._s(_vm.$t("prw.sample.item.text2after")))])])] : _vm.previewParagraphs(groupKey) ? [_c("div", { staticClass: "pw-element-preview-text pw-element-preview-paragraphs", class: { "is-hot": _vm.hoveredArea === groupKey + "-paragraph-spacing" }, style: { ..._vm.previewStyle(groupKey, bp, theme), "--pw-paragraph-gap": _vm.previewParagraphGap(groupKey) } }, _vm._l(_vm.previewParagraphs(groupKey), function(para, pIdx) {
            return _c("p", { key: pIdx, style: pIdx > 0 ? { marginTop: _vm.previewParagraphGap(groupKey) } : {} }, [_vm._v(_vm._s(para))]);
          }), 0)] : [groupKey === "heading" && _vm.previewMarked ? _c("span", { staticClass: "pw-element-preview-text pw-element-preview-marked", style: _vm.previewStyle(groupKey, bp, theme, true), domProps: { "innerHTML": _vm._s(_vm.previewHtml(groupKey, theme)) } }) : _c("span", { staticClass: "pw-element-preview-text", style: _vm.previewStyle(groupKey, bp, theme), domProps: { "innerHTML": _vm._s(_vm.previewHtml(groupKey, theme, groupKey === "heading")) } }), groupKey === "heading" && _vm.previewFlourish ? _c("span", { staticClass: "pw-element-preview-flourish-box", class: { "is-hot-top": _vm.hoveredArea === "heading-flourish-margin-top", "is-hot-bottom": _vm.hoveredArea === "heading-flourish-margin-bottom" }, style: _vm.flourishBoxStyle(bp, theme) }, [_c("span", { staticClass: "pw-element-preview-flourish", style: _vm.flourishStyle(bp, theme) })]) : _vm._e()], _vm.guides && _vm.spaceBelow(groupKey) && groupKey !== "list" && groupKey !== "quote" ? _c("span", { staticClass: "pw-element-space-below", class: { "is-hot": _vm.hoveredArea === groupKey + "-spacing" }, style: { height: _vm.spaceBelow(groupKey) } }) : _vm._e(), _vm.previewChildText(groupKey) && groupKey !== "media" ? [_c("span", { staticClass: "pw-element-preview-text", class: { "pw-element-preview-cite": _vm.previewChildKey(groupKey) === "cite", "is-hot": _vm.previewChildKey(groupKey) === "cite" && _vm.hoveredArea === "cite-spacing" }, style: { ..._vm.previewStyle(_vm.previewChildKey(groupKey), bp, theme), ..._vm.citeGapStyle(_vm.previewChildKey(groupKey)) } }, [_vm._v(_vm._s(_vm.previewChildText(groupKey)))])] : _vm._e(), _vm.guides && groupKey === "quote" && _vm.spaceBelow("quote") ? _c("span", { staticClass: "pw-element-space-below", class: { "is-hot": _vm.hoveredArea === "quote-spacing" }, style: { height: _vm.spaceBelow("quote") } }) : _vm._e()], 2);
        });
      })], 2)])]) : _vm._e(), _vm._l(_vm.combinedSubtabs(groupKey), function(st) {
        return [_c("section", { key: "card-" + st.key, staticClass: "pw-card-section" }, [_c("div", { staticClass: "pw-card-heading-row" }, [_c("h3", { staticClass: "pw-card-heading" }, [_vm._v(_vm._s(st.label))]), st.category === "flourish" ? _c("button", { staticClass: "pw-marked-switch", attrs: { "type": "button", "title": _vm.$t("prw.label.showInPreview"), "aria-label": _vm.$t("prw.label.showInPreview"), "aria-pressed": _vm.previewFlourish ? "true" : "false" }, on: { "click": function($event) {
          _vm.previewFlourish = !_vm.previewFlourish;
        } } }, [_c("k-icon", { attrs: { "type": _vm.previewFlourish ? "preview" : "hidden" } })], 1) : st.category === "marked" ? _c("button", { staticClass: "pw-marked-switch", attrs: { "type": "button", "title": _vm.$t("prw.label.showInPreview"), "aria-label": _vm.$t("prw.label.showInPreview"), "aria-pressed": _vm.previewMarked ? "true" : "false" }, on: { "click": function($event) {
          _vm.previewMarked = !_vm.previewMarked;
        } } }, [_c("k-icon", { attrs: { "type": _vm.previewMarked ? "preview" : "hidden" } })], 1) : _vm._e(), _vm.hasColorRows(st.category) && _vm.groupedColorFields(_vm.stInfo(st).group, st.category).length ? _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(theme) {
          return _c("button", { key: "th-" + theme, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.colorTheme === theme ? "true" : "false" }, on: { "click": function($event) {
            _vm.colorTheme = theme;
          } } }, [_c("span", { staticClass: "pw-variant-dot is-small", style: { backgroundColor: _vm.blockBackground(theme) } }), _vm._v(_vm._s(_vm.$t("pw.option." + theme)))]);
        }), 0) : st.category === "sizes" && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) ? _c("span", { staticClass: "pw-pill pw-theme-switch", attrs: { "role": "group" } }, _vm._l(_vm.sizeStepOptions(_vm.stInfo(st).elementKey), function(step) {
          return _c("button", { key: "fs-" + step, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.stepOf(_vm.stInfo(st).elementKey) === step ? "true" : "false" }, on: { "click": function($event) {
            _vm.$set(_vm.previewSteps, _vm.stInfo(st).elementKey, step);
          } } }, [_vm._v(_vm._s(_vm.stepLabel(_vm.stInfo(st).elementKey, step)))]);
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
              return _c("div", { key: "ax-" + gIdx + "-" + fIdx + "-" + axis.key, staticClass: "pw-field-row", attrs: { "data-guide": _vm.guides ? axis.key === "v" ? "padding-y" : "padding" : null }, on: { "focusin": function($event) {
                _vm.guides && (_vm.hoveredArea = field.varName + "-" + axis.key);
              }, "focusout": function($event) {
                _vm.hoveredArea = null;
              } } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label" }, [_vm._v(_vm._s(_vm.$t(axis.label)))])]), _c("div", { staticClass: "pw-field-row-options pw-corner-grid pw-side-grid pw-axis-grid" }, _vm._l(axis.idx, function(idx) {
                return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || field.def.value[idx]) }, on: { "change": function($event) {
                  return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
                } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || field.def.value[idx], field.def.unit, field.varName)))]) : _vm._e(), _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": ["grid-top", "grid-right", "grid-bottom", "grid-left"][idx] } })], 1);
              }), 0)])])]);
            }) : !(field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) && _vm.stepOf(_vm.stInfo(st).elementKey) !== "normal") && !(field.varName === "button-border-radius" && _vm.buttonShape() !== "custom") && !(field.varName === "media-radius" && _vm.mediaShape() !== "custom") && !(["button-width", "button-content-align"].includes(field.varName) && _vm.buttonWidthMode() !== "manual") ? _c("div", { key: "vf-" + gIdx + "-" + fIdx, staticClass: "pw-field-row", class: {
              "pw-dual-first": field.isFollowedByState,
              "pw-dual-next": field.isState
            }, attrs: { "data-guide": _vm.guideType(field.varName) }, on: { "focusin": function($event) {
              _vm.guides && _vm.hasArea(field.varName) && (_vm.hoveredArea = field.varName);
            }, "focusout": function($event) {
              _vm.hoveredArea = null;
            } } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(field.label) } })]), _c("div", { staticClass: "pw-field-row-options", class: [fieldGroup.header ? "pw-group-type-" + fieldGroup.fieldType : "", { "pw-corner-grid": _vm.isCorners(field.def) || _vm.isSides(field.def), "pw-side-grid": _vm.isSides(field.def) }] }, [field.def.type === "font-family" ? _c("select", { staticClass: "pw-element-input pw-font-select", domProps: { "value": _vm.fontSelectValue(field.varName, field.def.value) }, on: { "change": function($event) {
              return _vm.setValue(field.varName, $event.target.value, field.def.value);
            } } }, _vm._l(_vm.fontFamilyOptions, function(opt) {
              return _c("option", { key: opt.value, domProps: { "value": opt.value } }, [_vm._v(_vm._s(opt.text))]);
            }), 0) : field.def.options ? _c("k-toggles-input", { attrs: { "value": _vm.getOverrideValue(field.varName) || field.def.value, "options": _vm.filteredOptions(field.varName, field.def.options), "grow": false, "required": true }, on: { "input": function($event) {
              return _vm.setValue(field.varName, $event, field.def.value);
            } } }) : field.type === "multi-value" ? _vm._l(field.def.value, function(val, idx) {
              return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getQuadValue(field.varName, idx) || val) }, on: { "change": function($event) {
                return _vm.setQuadValue(field.varName, idx, $event.target.value, field.def);
              } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit, field.varName)))]) : _vm._e(), _vm.isSides(field.def) ? _c("k-icon", { staticClass: "pw-side-icon", attrs: { "type": ["grid-top", "grid-right", "grid-bottom", "grid-left"][idx] } }) : _vm._e()], 1);
            }) : field.type === "responsive" ? [_vm._l([_vm.previewBp], function(bp) {
              return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": _vm.responsiveUnit(field, bp) === "%" ? 100 : field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "change": function($event) {
                _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], _vm.responsiveUnit(field, bp));
              } } }), field.def.units ? _c("span", { staticClass: "pw-element-unit pw-element-unit-choice" }, [_c("button", { staticClass: "pw-unit-button", attrs: { "type": "button", "aria-haspopup": "menu", "aria-label": _vm.$t("prw.label.unit") }, on: { "click": function($event) {
                _vm.unitMenu(field.varName).toggle();
              } } }, [_vm._v(_vm._s(_vm.responsiveUnit(field, bp))), _c("k-icon", { attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "unit-" + field.varName, refInFor: true, staticClass: "pw-unit-menu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, _vm._l(field.def.units, function(u) {
                return _c("button", { key: "u-" + u, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "aria-current": _vm.responsiveUnit(field, bp) === u ? "true" : void 0 }, on: { "click": function($event) {
                  _vm.unitMenu(field.varName).close();
                  _vm.setResponsiveUnit(field, bp, u);
                } } }, [_c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(u))])]);
              }), 0)])], 1) : _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(_vm.responsiveUnit(field, bp)))])]), !["px", "%"].includes(_vm.responsiveUnit(field, bp)) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit, field.varName)))]) : _vm._e()]);
            }), _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
              return _c("button", { key: "sw-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.bpLabel(b), "aria-label": _vm.bpLabel(b), "aria-pressed": _vm.previewBp === b ? "true" : "false" }, on: { "click": function($event) {
                _vm.previewBp = b;
              } } }, [_c("k-icon", { attrs: { "type": _vm.bpIcon(b) } })], 1);
            }), 0)] : field.def.unit !== void 0 ? [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverrideValue(field.varName) || field.def.value) }, on: { "change": function($event) {
              return _vm.setUnitValue(field.varName, $event.target.value, field.def.value, field.def.unit);
            } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))])]), !["px", "%"].includes(field.def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit, field.varName)))]) : _vm._e()])] : _vm._e()], 2)])]), _vm.hasFieldOverride(field) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "title": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
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
              } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getQuadValue(field.varName, idx) || val, field.def.unit, field.varName)))]) : _vm._e()]);
            }) : field.type === "responsive" ? [_vm._l([_vm.previewBp], function(bp) {
              return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number pw-px-calculator-input", class: { "is-default": !_vm.getResponsiveOverride(field.varName, bp) }, attrs: { "type": "text", "inputmode": "decimal", "step": field.def.step || 0.1, "min": field.def.min, "max": field.def.max }, domProps: { "value": _vm.stripUnit(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp]) }, on: { "change": function($event) {
                return _vm.setResponsiveValue(field.varName, bp, $event.target.value, field.def[bp], field.def.unit);
              } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), field.def.unit !== "px" ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getResponsiveOverride(field.varName, bp) || field.def[bp], field.def.unit, field.varName)))]) : _vm._e()]);
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
            } } }), field.def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(field.def.unit))]) : _vm._e()]), !["px", "%"].includes(field.def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverrideValue(field.varName) || field.def.value, field.def.unit, field.varName)))]) : _vm._e()]), field.def.help ? _c("span", { staticClass: "pw-element-help" }, [_vm._v(_vm._s(_vm.helpText(field.def.help)))]) : _vm._e()] : [_c("input", { staticClass: "pw-element-input", attrs: { "type": "text", "placeholder": field.def.value }, domProps: { "value": _vm.getOverrideValue(field.varName) }, on: { "input": function($event) {
              return _vm.setValue(field.varName, $event.target.value, field.def.value);
            } } }), field.def.help ? _c("span", { staticClass: "pw-element-help" }, [_vm._v(_vm._s(_vm.helpText(field.def.help)))]) : _vm._e()]], 2)])]), _vm.hasFieldOverride(field) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "title": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
              return _vm.resetField(field);
            } } }) : _vm._e()], 1), field.varName.endsWith("-font-size") && _vm.fontSizesForGroup(_vm.stInfo(st).elementKey) && _vm.openSections[st.key + "-sizes"] ? _vm._l(_vm.fontSizesForGroup(_vm.stInfo(st).elementKey).vars, function(sizeVal, sizeName) {
              return _c("div", { key: "size-" + sizeName, staticClass: "pw-field-row pw-dual-first pw-dual-next" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label pw-sizes-label" }, [_vm._v(_vm._s(_vm.stepLabel(_vm.stInfo(st).elementKey, sizeName.split("-").pop())))])]), _c("div", { staticClass: "pw-field-row-options pw-group-type-responsive" }, [_vm._l([_vm.previewBp], function(bp) {
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
        })] : _vm._e()], 2), _vm.cardHelp(st) ? _c("k-text", { staticClass: "k-help pw-card-help", attrs: { "size": "tiny", "html": _vm.cardHelp(st) } }) : _vm._e()], 1)];
      })], 2)]);
    }), 0);
  };
  var _sfc_staticRenderFns$h = [];
  _sfc_render$h._withStripped = true;
  var __component__$h = /* @__PURE__ */ normalizeComponent(
    _sfc_main$h,
    _sfc_render$h,
    _sfc_staticRenderFns$h
  );
  __component__$h.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalElementStyles.vue";
  const GlobalElementStyles = __component__$h.exports;
  const _sfc_main$g = {
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
  var _sfc_render$g = function render() {
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
  var _sfc_staticRenderFns$g = [];
  _sfc_render$g._withStripped = true;
  var __component__$g = /* @__PURE__ */ normalizeComponent(
    _sfc_main$g,
    _sfc_render$g,
    _sfc_staticRenderFns$g
  );
  __component__$g.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalNavigation.vue";
  const GlobalNavigation = __component__$g.exports;
  const _sfc_main$f = {
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
  var _sfc_render$f = function render() {
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
  var _sfc_staticRenderFns$f = [];
  _sfc_render$f._withStripped = true;
  var __component__$f = /* @__PURE__ */ normalizeComponent(
    _sfc_main$f,
    _sfc_render$f,
    _sfc_staticRenderFns$f
  );
  __component__$f.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/GlobalFontManager.vue";
  const GlobalFontManager = __component__$f.exports;
  const _sfc_main$e = {
    directives: { "pw-autosize": autosize },
    props: {
      defaults: { type: Object, default: () => ({}) },
      overrides: { type: Object, default: () => ({}) },
      groupLabels: { type: Object, default: null },
      // guide stripes while the preview guides are on (varName → margin | padding)
      guides: { type: Object, default: null },
      hideSectionHeaders: { type: Boolean, default: false },
      showOnly: { type: Array, default: null },
      // own labels for some rows (varName → text), e.g. in a card that names the part
      labels: { type: Object, default: () => ({}) },
      // one theme (e.g. "variant"): the colour rows show only its value
      theme: { type: String, default: null },
      // one breakpoint (default / lg / xl): responsive rows show only its
      // value plus the device switch (.sync)
      bp: { type: String, default: null },
      // a reference value per row, grey at its end (varName → text), e.g. the
      // global elements' value next to a block's own
      hints: { type: Object, default: null },
      hintTitle: { type: String, default: "" },
      // the block's values the exceptions set (Settings › Configuration):
      // shown with the value that applies, locked
      patch: { type: Object, default: null }
    },
    data() {
      return { open: {} };
    },
    computed: {
      // the own values as shown: without those the exceptions set (their
      // rows show the value that applies, as the pagewizard drops them too)
      shown() {
        return withoutPatchedValues(this.overrides, this.patch);
      },
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
      // a var whose value the exceptions set (values › group › vars › name › value)
      varLocked(varName) {
        return Object.values(this.patch || {}).some((g) => {
          const v = g && g.vars && g.vars[varName];
          return !!v && typeof v === "object" && "value" in v;
        });
      },
      // a colour of a variant the exceptions set (values › group › colors › name › variant)
      colorLocked(varName, variant) {
        if (!variant) return false;
        return Object.values(this.patch || {}).some((g) => {
          const c = g && g.colors && g.colors[varName];
          return !!c && typeof c === "object" && variant in c;
        });
      },
      // a colour row with a locked colour among those it shows
      colorRowLocked(row, group) {
        return row.states.some((st) => (this.theme ? [this.theme] : Object.keys(this.visibleThemes(group.colors[st.varName]) || {})).some((variant) => this.colorLocked(st.varName, variant)));
      },
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
      // the colour rows: with one variant chosen, a colour's hover and active
      // join it (states side by side, as the buttons' on the elements page)
      colorRows(group) {
        const names = Object.keys(group.colors || {});
        const rows = [];
        for (const name of names) {
          const state2 = name.endsWith("-hover") ? "hover" : name.endsWith("-active") ? "active" : "normal";
          const base = state2 === "normal" ? name : name.replace(/-(hover|active)$/, "");
          if (this.theme && state2 !== "normal" && names.includes(base)) continue;
          const states = [{ varName: name, state: "normal" }];
          if (this.theme && state2 === "normal") {
            for (const s of ["hover", "active"]) if (names.includes(name + "-" + s)) states.push({ varName: name + "-" + s, state: s });
          }
          rows.push({ varName: name, states });
        }
        return rows;
      },
      visibleThemes(themes2) {
        if (!this.theme) return themes2;
        return this.theme in themes2 ? { [this.theme]: themes2[this.theme] } : {};
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
        if (u === "vh") return Math.round(n * SCREEN_HEIGHTS[bp || "default"] / 100) + "px";
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
        return unit !== "px" && unit !== "%";
      },
      getOverride(varName) {
        return this.shown[varName];
      },
      overrideAt(varName, idx) {
        const v = this.shown[varName];
        return Array.isArray(v) ? v[idx] : void 0;
      },
      getThemeOverride(theme, varName) {
        const t = this.shown[theme];
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
        return this.shown[varName] !== void 0;
      },
      hasColorOverride(varName) {
        for (const theme of ["default", "variant", "variant2", "variant3"]) {
          const t = this.shown[theme];
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
        this.resetColors([varName]);
      },
      // several colours at once (a colour with its hover and active)
      resetColors(names) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        for (const theme of ["default", "variant", "variant2", "variant3"]) {
          if (next[theme] && typeof next[theme] === "object") {
            for (const varName of names) delete next[theme][varName];
            if (Object.keys(next[theme]).length === 0) delete next[theme];
          }
        }
        this.$emit("update:overrides", next);
      },
      isResponsive(def) {
        return !!def && typeof def === "object" && def.value === void 0 && def.default !== void 0 && def.lg !== void 0;
      },
      responsiveAt(varName, bp) {
        const v = this.shown[varName];
        return v && typeof v === "object" && !Array.isArray(v) ? v[bp] : void 0;
      },
      // unit of a responsive value at a device: % when set so, else the field's
      unitAt(varName, bp, def) {
        const val = this.responsiveAt(varName, bp) || def[bp] || "";
        return def.units && String(val).endsWith("%") ? "%" : def.unit;
      },
      // the unit dropdown of a row (refs inside v-for come as arrays)
      unitMenu(varName) {
        const ref = this.$refs["unit-" + varName];
        return Array.isArray(ref) ? ref[0] : ref;
      },
      // switching the unit: % starts at the field's percent start, the
      // field's unit at its default
      setUnit(varName, bp, def, unit) {
        if (unit === this.unitAt(varName, bp, def)) return;
        const value = unit === "%" ? String(def.percent ?? 50) : this.stripUnit(def[bp], def.unit);
        this.setResponsive(varName, bp, value, def, unit);
      },
      setResponsive(varName, bp, value, def, unit) {
        const next = JSON.parse(JSON.stringify(this.overrides || {}));
        const current = next[varName] && typeof next[varName] === "object" && !Array.isArray(next[varName]) ? next[varName] : {};
        if (value === "") {
          delete current[bp];
        } else {
          const num = this.parseNum(value);
          if (num === null) return;
          const composed = num + (unit || def.unit || "");
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
  var _sfc_render$e = function render() {
    var _vm = this, _c = _vm._self._c;
    return Object.keys(_vm.groups).length ? _c("div", _vm._l(_vm.groups, function(group, groupKey) {
      return _c("section", { key: groupKey, staticClass: "pw-element-section" }, [!_vm.hideSectionHeaders ? _c("div", { staticClass: "pw-section-header" }, [_c("span", { staticClass: "pw-tab-visibility pw-tab-visibility-static" }, [_c("k-icon", { attrs: { "type": "settings" } })], 1), _c("button", { staticClass: "pw-section-toggle", on: { "click": function($event) {
        return _vm.toggle(groupKey);
      } } }, [_c("span", [_vm._v(_vm._s(_vm.groupLabel(groupKey)))]), _c("k-icon", { attrs: { "type": _vm.isOpen(groupKey) ? "angle-down" : "angle-right" } })], 1)]) : _vm._e(), _c("transition", { attrs: { "name": "pw-slide" } }, [_c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.isOpen(groupKey), expression: "isOpen(groupKey)" }], staticClass: "pw-element-list" }, [!_vm.theme && Object.keys(group.colors || {}).length ? _c("div", { staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-theme-color" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.default") || "Default"))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant") || "Variant"))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant2") || "Variant 2"))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("pw.option.variant3") || "Variant 3"))])])])]) : _vm._e(), _vm._l(_vm.colorRows(group), function(row) {
        return _c("div", { key: "color-" + row.varName, staticClass: "pw-field-row" }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(_vm.varLabel(row.varName)) } }), _vm.colorRowLocked(row, group) ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options", class: { "pw-group-type-theme-color": !_vm.theme } }, [row.states.length > 1 ? _c("span", { staticClass: "pw-state-grid" }, _vm._l(row.states, function(st) {
          return _c("span", { key: st.varName, staticClass: "pw-state-cell", attrs: { "inert": _vm.colorLocked(st.varName, _vm.theme) || null } }, [st.state !== "normal" ? _c("span", { staticClass: "pw-state-pill", class: "pw-state-" + st.state }, [_vm._v(":" + _vm._s(_vm.$t("prw.state." + st.state)))]) : _vm._e(), _c("pw-color-field-row", { attrs: { "group": "block-values-" + _vm.theme, "var-name": st.varName, "default-value": group.colors[st.varName][_vm.theme] || "", "override-value": _vm.getThemeOverride(_vm.theme, st.varName) || "" }, on: { "update:value": function($event) {
            return _vm.setThemeColor(_vm.theme, st.varName, $event || "", group.colors[st.varName][_vm.theme] || "");
          } } })], 1);
        }), 0) : _vm._l(_vm.visibleThemes(group.colors[row.varName]), function(themeValue, themeKey) {
          return _c("span", { key: themeKey, staticClass: "pw-element-field", attrs: { "inert": _vm.colorLocked(row.varName, themeKey) || null } }, [_c("pw-color-field-row", { attrs: { "group": "block-values-" + themeKey, "var-name": row.varName, "default-value": themeValue, "override-value": _vm.getThemeOverride(themeKey, row.varName) || "" }, on: { "update:value": function($event) {
            return _vm.setThemeColor(themeKey, row.varName, $event || "", themeValue);
          } } })], 1);
        })], 2)]), row.states.some((st) => _vm.hasColorOverride(st.varName)) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
          _vm.resetColors(row.states.map((st) => st.varName));
        } } }) : _vm._e()], 1)]);
      }), _vm._l(group.vars, function(def, varName) {
        return [_vm.isResponsive(def) && !_vm.bp ? _c("div", { key: "rh-" + varName, staticClass: "pw-group-header" }, [_c("div", { staticClass: "pw-field-row-label-col" }), _c("div", { staticClass: "pw-group-header-labels pw-group-type-responsive" }, [_c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.mobile")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.tablet")))])]), _c("span", { staticClass: "pw-group-column-cell" }, [_c("span", { staticClass: "pw-group-column-label" }, [_vm._v(_vm._s(_vm.$t("prw.label.desktop")))])])])]) : _vm._e(), _c("div", { key: varName, staticClass: "pw-field-row", class: { "is-locked": _vm.varLocked(varName) }, attrs: { "data-guide": _vm.guides ? _vm.guides[varName] || null : null }, on: { "focusin": function($event) {
          _vm.guides && _vm.guides[varName] && _vm.$emit("hover-var", varName);
        }, "focusout": function($event) {
          _vm.guides && _vm.guides[varName] && _vm.$emit("hover-var", null);
        } } }, [_c("div", { staticClass: "k-input", attrs: { "data-type": "text" } }, [_c("span", { staticClass: "k-input-element pw-field-row-inner" }, [_c("div", { staticClass: "pw-field-row-label-col" }, [_c("label", { staticClass: "pw-field-row-label", domProps: { "innerHTML": _vm._s(_vm.varLabel(varName)) } }), _vm.varLocked(varName) ? _c("pw-lock") : _vm._e()], 1), _c("div", { staticClass: "pw-field-row-options", class: { "pw-group-type-responsive": _vm.isResponsive(def) && !_vm.bp, "pw-corner-grid": _vm.isCorners(def) }, attrs: { "inert": _vm.varLocked(varName) || null } }, [def.type === "color" ? [_c("pw-color-field-row", { attrs: { "group": "block-values", "var-name": varName, "default-value": def.value, "override-value": _vm.getOverride(varName) || "" }, on: { "update:value": function($event) {
          return _vm.setSingle(varName, $event || "", def.value);
        } } })] : _vm.isResponsive(def) ? [_vm._l(_vm.bp ? [_vm.bp] : ["default", "lg", "xl"], function(bp) {
          return _c("span", { key: bp, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(_vm.unitAt(varName, bp, def)), "is-default": !_vm.responsiveAt(varName, bp) }, attrs: { "type": "text", "inputmode": "decimal", "step": def.step, "min": def.min, "max": _vm.unitAt(varName, bp, def) === "%" ? 100 : def.max }, domProps: { "value": _vm.stripUnit(_vm.responsiveAt(varName, bp) || def[bp], _vm.unitAt(varName, bp, def)) }, on: { "change": function($event) {
            _vm.setResponsive(varName, bp, $event.target.value, def, _vm.unitAt(varName, bp, def));
          } } }), def.units ? _c("span", { staticClass: "pw-element-unit pw-element-unit-choice" }, [_c("button", { staticClass: "pw-unit-button", attrs: { "type": "button", "aria-haspopup": "menu", "aria-label": _vm.$t("prw.label.unit") }, on: { "click": function($event) {
            _vm.unitMenu(varName).toggle();
          } } }, [_vm._v(_vm._s(_vm.unitAt(varName, bp, def))), _c("k-icon", { attrs: { "type": "angle-down" } })], 1), _c("k-dropdown-content", { ref: "unit-" + varName, refInFor: true, staticClass: "pw-unit-menu", attrs: { "align-x": "start" } }, [_c("nav", { staticClass: "k-navigate" }, _vm._l(def.units, function(u) {
            return _c("button", { key: "u-" + u, staticClass: "k-dropdown-item k-button pw-menu-item", attrs: { "type": "button", "data-has-text": "true", "aria-current": _vm.unitAt(varName, bp, def) === u ? "true" : void 0 }, on: { "click": function($event) {
              _vm.unitMenu(varName).close();
              _vm.setUnit(varName, bp, def, u);
            } } }, [_c("span", { staticClass: "k-button-text" }, [_vm._v(_vm._s(u))])]);
          }), 0)])], 1) : _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))])]), _vm.showCalculator(_vm.unitAt(varName, bp, def)) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.responsiveAt(varName, bp) || def[bp], def.unit, varName, bp)))]) : _vm._e()]);
        }), _vm.hints && _vm.hints[varName] ? _c("span", { staticClass: "pw-field-hint", attrs: { "title": _vm.hintTitle } }, [_vm._v(_vm._s(_vm.hints[varName]))]) : _vm._e(), _vm.bp ? _c("span", { staticClass: "pw-pill pw-bp-switch", attrs: { "role": "group" } }, _vm._l(["default", "lg", "xl"], function(b) {
          return _c("button", { key: "sw-" + b, staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.bpLabel(b), "aria-label": _vm.bpLabel(b), "aria-pressed": _vm.bp === b ? "true" : "false" }, on: { "click": function($event) {
            return _vm.$emit("update:bp", b);
          } } }, [_c("k-icon", { attrs: { "type": _vm.bpIcon(b) } })], 1);
        }), 0) : _vm._e()] : Array.isArray(def.value) && def.suffixes ? _vm._l(def.suffixes, function(suffix, idx) {
          return _c("span", { key: suffix, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(def.unit), "is-default": !_vm.overrideAt(varName, idx) }, attrs: { "type": "text", "inputmode": "decimal", "step": def.step, "min": def.min, "max": def.max }, domProps: { "value": _vm.stripUnit(_vm.overrideAt(varName, idx) || def.value[idx], def.unit) }, on: { "change": function($event) {
            return _vm.setMulti(varName, idx, $event.target.value, def.value, def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))])]), _vm.showCalculator(def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.overrideAt(varName, idx) || def.value[idx], def.unit)))]) : _vm._e()]);
        }) : Array.isArray(def.value) ? _vm._l(def.value, function(_, idx) {
          return _c("span", { key: idx, staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(def.unit) }, attrs: { "type": "text", "inputmode": "decimal", "step": def.step, "min": def.min, "max": def.max }, domProps: { "value": _vm.stripUnit(_vm.overrideAt(varName, idx) || def.value[idx], def.unit) }, on: { "change": function($event) {
            return _vm.setMulti(varName, idx, $event.target.value, def.value, def.unit);
          } } }), _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))])]), _vm.showCalculator(def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.overrideAt(varName, idx) || def.value[idx], def.unit)))]) : _vm._e()]);
        }) : [_c("span", { staticClass: "pw-element-field" }, [_c("span", { staticClass: "pw-element-input-wrap" }, [_c("input", { directives: [{ name: "pw-autosize", rawName: "v-pw-autosize" }], staticClass: "pw-element-input pw-element-input-number", class: { "pw-px-calculator-input": _vm.showCalculator(def.unit), "is-default": !_vm.getOverride(varName) }, attrs: { "type": "text", "inputmode": "decimal", "step": def.step, "min": def.min, "max": def.max }, domProps: { "value": _vm.stripUnit(_vm.getOverride(varName) || def.value, def.unit) }, on: { "change": function($event) {
          return _vm.setSingleUnit(varName, $event.target.value, def.value, def.unit);
        } } }), def.unit ? _c("span", { staticClass: "pw-element-unit" }, [_vm._v(_vm._s(def.unit))]) : _vm._e()]), _vm.showCalculator(def.unit) ? _c("span", { staticClass: "pw-px-calculator" }, [_vm._v(_vm._s(_vm.toPx(_vm.getOverride(varName) || def.value, def.unit, varName)))]) : _vm._e()]), _vm.hints && _vm.hints[varName] ? _c("span", { staticClass: "pw-field-hint", attrs: { "title": _vm.hintTitle } }, [_vm._v(_vm._s(_vm.hints[varName]))]) : _vm._e()]], 2)]), _vm.hasVarOverride(varName) ? _c("k-button", { staticClass: "pw-field-reset", attrs: { "text": _vm.$t("prw.label.reset"), "icon": "undo", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
          return _vm.resetVar(varName);
        } } }) : _vm._e()], 1)])];
      })], 2)])], 1);
    }), 0) : _vm._e();
  };
  var _sfc_staticRenderFns$e = [];
  _sfc_render$e._withStripped = true;
  var __component__$e = /* @__PURE__ */ normalizeComponent(
    _sfc_main$e,
    _sfc_render$e,
    _sfc_staticRenderFns$e
  );
  __component__$e.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BlockValues.vue";
  const BlockValues = __component__$e.exports;
  const _sfc_main$d = {
    inject: { pwOpenPatches: { default: null } },
    methods: {
      open() {
        if (this.pwOpenPatches) this.pwOpenPatches();
      }
    }
  };
  var _sfc_render$d = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("button", { staticClass: "pw-lock", attrs: { "type": "button", "title": _vm.$t("prw.patches.locked"), "aria-label": _vm.$t("prw.patches.locked") }, on: { "click": _vm.open } }, [_c("k-icon", { attrs: { "type": "lock" } })], 1);
  };
  var _sfc_staticRenderFns$d = [];
  _sfc_render$d._withStripped = true;
  var __component__$d = /* @__PURE__ */ normalizeComponent(
    _sfc_main$d,
    _sfc_render$d,
    _sfc_staticRenderFns$d
  );
  __component__$d.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/Lock.vue";
  const Lock = __component__$d.exports;
  const _sfc_main$c = {
    name: "pw-translate-node",
    props: {
      // { key, label, icon, fields: [{ key, name, label, type }], children }
      node: { type: Object, required: true },
      // "owner.field" → on/off
      values: { type: Object, default: () => ({}) },
      depth: { type: Number, default: 0 },
      // "expand all" / "collapse all" of the page: every node follows
      expanded: { type: Boolean, default: false }
    },
    data() {
      return { open: this.expanded };
    },
    watch: {
      expanded(now) {
        this.open = now;
      }
    },
    computed: {
      counts() {
        const count = (node) => node.fields.reduce(
          (acc, f) => ({ on: acc.on + (this.values[f.key] ? 1 : 0), all: acc.all + 1 }),
          (node.children || []).map(count).reduce((a, b) => ({ on: a.on + b.on, all: a.all + b.all }), { on: 0, all: 0 })
        );
        return count(this.node);
      }
    }
  };
  var _sfc_render$c = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("li", { staticClass: "pw-json-node", class: { "is-block": _vm.depth === 0 } }, [_c("div", { staticClass: "pw-json-row is-branch", class: { "is-open": _vm.open }, attrs: { "title": _vm.node.title || null }, on: { "click": function($event) {
      _vm.open = !_vm.open;
    } } }, [_c("span", { staticClass: "pw-json-toggle" }, [_c("k-icon", { attrs: { "type": _vm.open ? "angle-down" : "angle-right" } })], 1), _c("k-icon", { staticClass: "pw-json-block-icon", attrs: { "type": _vm.node.icon || "box" } }), _c("span", { staticClass: "pw-json-block-name" }, [_vm._v(_vm._s(_vm.node.label))]), _vm.node.code ? _c("code", { staticClass: "pw-json-block-type" }, [_vm._v(_vm._s(_vm.node.code))]) : _vm._e(), _c("span", { staticClass: "pw-json-count pw-translate-count", class: { "is-none": _vm.counts.on === 0 } }, [_vm._v(_vm._s(_vm.counts.on) + "/" + _vm._s(_vm.counts.all))])], 1), _vm.open ? _c("ul", { staticClass: "pw-json-children" }, [_vm._l(_vm.node.fields, function(field) {
      return _c("li", { key: field.key, staticClass: "pw-json-node" }, [_c("div", { staticClass: "pw-json-row pw-translate-field", class: { "is-off": !_vm.values[field.key] }, attrs: { "role": "checkbox", "tabindex": "0", "aria-checked": _vm.values[field.key] ? "true" : "false", "title": field.name }, on: { "click": function($event) {
        return _vm.$emit("toggle", { key: field.key, value: !_vm.values[field.key] });
      }, "keydown": function($event) {
        if (!$event.type.indexOf("key") && _vm._k($event.keyCode, "space", 32, $event.key, [" ", "Spacebar"])) return null;
        $event.preventDefault();
        return _vm.$emit("toggle", { key: field.key, value: !_vm.values[field.key] });
      } } }, [_c("span", { staticClass: "pw-json-toggle" }), _c("span", { staticClass: "pw-translate-label" }, [_vm._v(_vm._s(field.label))]), _vm.values[field.key] ? _c("span", { staticClass: "pw-translate-type" }, [_vm._v(_vm._s(field.type))]) : _vm._e(), _c("span", { staticClass: "pw-translate-check", class: { "is-on": _vm.values[field.key] } }, [_vm.values[field.key] ? _c("svg", { attrs: { "viewBox": "0 0 24 24", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": "M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z" } })]) : _vm._e()])])]);
    }), _vm._l(_vm.node.children, function(child) {
      return _c("pw-translate-node", { key: child.key, attrs: { "node": child, "values": _vm.values, "depth": _vm.depth + 1, "expanded": _vm.expanded }, on: { "toggle": function($event) {
        return _vm.$emit("toggle", $event);
      } } });
    })], 2) : _vm._e()]);
  };
  var _sfc_staticRenderFns$c = [];
  _sfc_render$c._withStripped = true;
  var __component__$c = /* @__PURE__ */ normalizeComponent(
    _sfc_main$c,
    _sfc_render$c,
    _sfc_staticRenderFns$c
  );
  __component__$c.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/TranslateNode.vue";
  const TranslateNode = __component__$c.exports;
  const _sfc_main$b = {
    props: {
      // the wizard (Overview): its batch state and actions
      host: { type: Object, required: true },
      // the panel hands this in when it opens the dialog
      visible: { type: Boolean, default: false }
    },
    computed: {
      dialog() {
        return this.host.batchDialog;
      },
      batch() {
        return this.host.batch;
      },
      usage() {
        return this.host.deeplUsage;
      }
    }
  };
  var _sfc_render$b = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-dialog", { staticClass: "pw-batch-dialog", attrs: { "size": "medium", "visible": _vm.visible, "cancel-button": _vm.host.batchDialogCancel, "submit-button": _vm.host.batchDialogSubmit }, on: { "cancel": function($event) {
      return _vm.host.onBatchCancel();
    }, "submit": function($event) {
      return _vm.host.onBatchSubmit();
    } } }, [_vm.dialog ? [_vm.dialog.step === "ask" ? [_c("p", { staticClass: "pw-batch-dialog-text", domProps: { "innerHTML": _vm._s(_vm.$t("prw.translate.batch.chars", { chars: "<strong>~" + _vm.dialog.chars.toLocaleString() + "</strong>", lang: "<strong>" + _vm.$esc(_vm.dialog.lang.name) + "</strong>" })) } }), _vm.host.batchOverQuota ? _c("k-box", { attrs: { "theme": "negative", "text": _vm.$t("prw.translate.batch.over") } }) : _vm.dialog.mode === "all" ? _c("k-box", { attrs: { "theme": "notice", "text": _vm.$t("prw.translate.batch.overwrite") } }) : _vm._e()] : _vm.dialog.step === "run" ? [_c("div", { staticClass: "pw-batch-dialog-lines" }, [_c("p", { staticClass: "pw-batch-dialog-headline" }, [_vm._v(_vm._s(_vm.$t("prw.translate.batch.progress", { n: Math.min(_vm.batch.done + 1, _vm.batch.total), total: _vm.batch.total })))]), _c("p", { staticClass: "pw-batch-dialog-page" }, [_vm._v(_vm._s(_vm.batch.current))])]), _c("div", { staticClass: "pw-usage-bar" }, [_c("span", { style: { width: _vm.batch.done / _vm.batch.total * 100 + "%" } })])] : _vm.batch.result ? [_c("div", { staticClass: "pw-batch-dialog-lines" }, [_c("p", { staticClass: "pw-batch-dialog-headline" }, [_vm._v(_vm._s(_vm.$t("prw.translate.batch.done", { count: _vm.batch.result.done, chars: _vm.batch.result.doneChars.toLocaleString() })))]), _c("p", { staticClass: "pw-batch-dialog-page" }, [_vm._v(_vm._s(_vm.batch.result.stopped ? _vm.$t("prw.translate.batch.pending", { count: _vm.batch.result.left, chars: _vm.batch.result.leftChars.toLocaleString() }) : " "))])]), _c("div", { staticClass: "pw-usage-bar" }, [_c("span", { style: { width: _vm.batch.done / _vm.batch.total * 100 + "%" } })]), _vm._l(_vm.batch.result.errors, function(err) {
      return _c("k-box", { key: err.path, attrs: { "theme": "negative", "text": err.title + ": " + err.message } });
    })] : _vm._e()] : _vm._e()], 2);
  };
  var _sfc_staticRenderFns$b = [];
  _sfc_render$b._withStripped = true;
  var __component__$b = /* @__PURE__ */ normalizeComponent(
    _sfc_main$b,
    _sfc_render$b,
    _sfc_staticRenderFns$b
  );
  __component__$b.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BatchDialog.vue";
  const BatchDialog = __component__$b.exports;
  const GAPS = {
    // (also kirbyblock-featurelist: before the items)
    "tagline>items": "1rem",
    "heading>items": "1.2rem",
    "editor>items": "2rem",
    // (between tagline, heading, text and buttons: only the elements' space
    // below – the blocks' fixed pair gaps are gone)
    // (kirbyblock-logocloud: before the logos)
    "tagline>logos": "1rem",
    "heading>logos": "2rem",
    "editor>logos": "2rem",
    // (kirbyblock-media: before the image, slideshow or video)
    "tagline>media": "0.8rem",
    "heading>media": "1.2rem",
    "editor>media": "1.2rem"
  };
  const DUMMY_LOGOS = [
    [120, 60, '<circle cx="30" cy="30" r="13" fill="#4b5563"/><circle cx="30" cy="30" r="6" fill="#fff"/><text x="50" y="36" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#4b5563">Lumo</text>'],
    [90, 60, '<path d="M14 42 L26 18 L38 42 Z" fill="#6b7280"/><text x="44" y="36" font-family="Georgia, serif" font-size="17" font-style="italic" fill="#6b7280">Nova</text>'],
    [60, 60, '<rect x="14" y="14" width="32" height="32" rx="7" fill="#374151"/><rect x="23" y="23" width="14" height="14" rx="3" fill="#fff"/>'],
    [180, 60, '<path d="M14 36 Q22 22 30 36 T46 36" fill="none" stroke="#6b7280" stroke-width="4" stroke-linecap="round"/><text x="54" y="37" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="300" letter-spacing="3" fill="#6b7280">velamaris</text>']
  ];
  const FEATURE_ICONS = [
    "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
  ];
  const GRID_BP = { default: null, sm: "sm", md: "md", lg: "lg", xl: "xl" };
  const GRID_GAP = { sm: 16 / 640 * 100 + "%", md: 32 / 768 * 100 + "%", lg: 48 / 1024 * 100 + "%", xl: 64 / 1280 * 100 + "%" };
  const _sfc_main$a = {
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
      // the block's own guides (paddings, outer spacing): not in the design
      // tab, which sets the items' values only
      withBlockGuides: { type: Boolean, default: true },
      // steplist: the item style to show (chosen in the design tab)
      stepStyle: { type: String, default: "" },
      // featurelist: the layout to show (stacked / split, chosen in the gaps card)
      featureLayout: { type: String, default: "" },
      // faq: the style to show (lines / cards, chosen in the design tab)
      faqStyle: { type: String, default: "" },
      // hero: the height to show (chosen in the design tab's height card)
      heroHeight: { type: String, default: "" },
      // cardlets: the display chosen in the design tab (else the start value)
      cardDisplay: { type: String, default: "" },
      // the design tab (the hero: on the sample image with its overlay, to
      // check the overlay colour with the text)
      designView: { type: Boolean, default: false },
      // the value whose row the pointer is over (guides on: its area tinted)
      highlight: { type: String, default: null },
      // variant shown, shared with the colour cards (.sync); empty: the block's preset
      variant: { type: String, default: "" }
    },
    computed: {
      // the value whose field has the cursor, if it has an area to tint (the
      // gaps, the paddings): its lines stay, the other guides give way
      highlightsArea() {
        const h = this.highlight || "";
        return [
          "item-gap",
          "item-row-gap",
          "item-text-gap",
          "item-padding",
          "item-padding-y",
          "item-icon-gap",
          "item-title-spacing",
          "item-icon-tile-padding",
          "item-offset-gap",
          "item-answer-gap",
          "tagline-spacing",
          "heading-spacing",
          "editor-spacing",
          "item-tagline-spacing",
          "item-heading-spacing",
          "item-cta-gap",
          "item-padding-x",
          "item-overhang",
          "column-gap",
          "row-gap",
          "list-spacing",
          "quote-spacing",
          "media-spacing",
          "button-spacing",
          "padding-top",
          "padding-bottom",
          "padding-left",
          "padding-right",
          "margin-top",
          "margin-bottom"
        ].includes(h) || h.startsWith("item-content-gap");
      },
      dummyLogos() {
        return DUMMY_LOGOS;
      },
      blockGuides() {
        return this.guides && this.withBlockGuides;
      },
      // the chosen variant (here or in the colour cards), else the block's preset
      currentTheme() {
        const chosen = this.variant || this.setting("style", "theme") || "default";
        return this.themes.includes(chosen) ? chosen : "default";
      },
      // fields shown in the order of the snippet (steplist: its items last)
      fields() {
        const fields = ["tagline", "heading", "editor", "buttons"].filter((f) => this.hasField(f));
        if (this.isSteplist) return [...fields, "items"];
        if (this.isMedia && this.hasField("media")) return [...fields, "media"];
        if (this.isLogocloud) return [...fields, "logos"];
        if (this.isFeaturelist) return [...fields, "items"];
        if (this.isFaq) return [...fields, "items"];
        if (this.isCardlets) return [...fields, "items"];
        return fields;
      },
      isMedia() {
        return this.blockType === "pwmedia";
      },
      // the media as a new block starts: its size (max width as in the
      // frontend) and alignment, its corners – none, round (all four) or
      // custom (the chosen ones) with the element's radii (Elements › Media)
      mediaStyle() {
        var _a, _b, _c;
        const def = ((_c = (_b = (_a = this.elementDefaults.media) == null ? void 0 : _a.vars) == null ? void 0 : _b["media-radius"]) == null ? void 0 : _c.value) || [];
        const ov = (this.elementOverrides.global || {})["media-radius"];
        const r = Array.isArray(ov) ? ov : def;
        const style = this.preset("media", "radius") || "none";
        const corner = (key, idx) => {
          if (style === "round") return r[idx] || 0;
          if (style === "custom" && this.preset("media", "radius-" + key) === true) return r[idx] || 0;
          return 0;
        };
        const widths = { xsmall: "25%", small: "33%", medium: "50%", large: "75%", fullscreen: "100%" };
        const align = this.preset("media", "align") || "left";
        return {
          // (with a band of its own above: none)
          marginTop: this.guides ? 0 : this.mediaTextGap,
          maxWidth: widths[this.preset("media", "size")] || "33%",
          marginLeft: align === "left" ? 0 : "auto",
          marginRight: align === "right" ? 0 : "auto",
          borderRadius: r.length === 4 ? [corner("top-left", 0), corner("top-right", 1), corner("bottom-right", 3), corner("bottom-left", 2)].join(" ") : 0
        };
      },
      // media: the gap to the intro above (when there is one)
      mediaTextGap() {
        return this.introGap("media");
      },
      isLogocloud() {
        return this.blockType === "pwlogocloud";
      },
      // the logos: two columns and two rows with the gap between them,
      // aligned as set
      logosStyle() {
        const size2 = this.itemValueAt("item-size");
        const align = this.preset("logos", "align") || "center";
        const justify = { left: "start", right: "end" }[align] || "center";
        const gap = this.itemValue("item-gap");
        const rowGap = this.itemValue("item-row-gap") || gap;
        if (this.logosFlexible) {
          const size3 = this.itemValueAt("item-size");
          const line = this.highlight === "item-row-gap" ? "transparent" : "rgba(130, 80, 255, 0.9)";
          const fill = this.highlight === "item-row-gap" ? "rgba(130, 80, 255, 0.18)" : "transparent";
          const hidden = this.highlight && this.highlight !== "item-row-gap";
          const end = "calc(" + size3 + " + " + rowGap + ")";
          const bands = this.guides && !hidden ? "repeating-linear-gradient(to bottom, transparent 0, transparent " + size3 + ", " + line + " " + size3 + ", " + line + " calc(" + size3 + " + 1px), " + fill + " calc(" + size3 + " + 1px), " + fill + " calc(" + end + " - 1px), " + line + " calc(" + end + " - 1px), " + line + " " + end + ")" : null;
          return {
            backgroundImage: bands,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: { left: "flex-start", right: "flex-end" }[align] || "center",
            columnGap: gap,
            rowGap,
            marginTop: this.logosMarginTop
          };
        }
        if (this.guides) {
          return {
            display: "grid",
            gridTemplateColumns: "minmax(0, " + size2 + ") " + gap + " minmax(0, " + size2 + ")",
            gridTemplateRows: "auto " + rowGap + " auto",
            justifyContent: justify,
            marginTop: this.logosMarginTop
          };
        }
        return {
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, " + size2 + "))",
          justifyContent: justify,
          columnGap: gap,
          rowGap,
          marginTop: this.logosMarginTop
        };
      },
      // the tile's padding: vertical, horizontal (older: one value)
      logoPadding() {
        const x = this.itemValue("item-padding");
        return (this.itemValue("item-padding-y") || x) + " " + x;
      },
      // the gap between the text above and the logos (none without text)
      logosTextGap() {
        return this.introGap("logos");
      },
      // the logos' own top margin (with guides the gap is an element above)
      logosMarginTop() {
        return this.guides ? 0 : this.logosTextGap;
      },
      // the tile's box: a padding hovered tinted in it (square bands)
      logoBoxStyle() {
        if (this.highlight !== "item-padding" && this.highlight !== "item-padding-y") return {};
        const x = this.itemValue("item-padding");
        const y = this.itemValue("item-padding-y") || x;
        return {
          // (with the outer edges as lines, the inner ones are the guides')
          boxShadow: this.highlight === "item-padding" ? "inset 1px 0 0 0 rgba(255, 0, 170, 0.6), inset -1px 0 0 0 rgba(255, 0, 170, 0.6), inset " + x + " 0 0 0 rgba(255, 0, 170, 0.18), inset calc(-1 * " + x + ") 0 0 0 rgba(255, 0, 170, 0.18)" : "inset 0 1px 0 0 rgba(0, 180, 90, 0.9), inset 0 -1px 0 0 rgba(0, 180, 90, 0.9), inset 0 " + y + " 0 0 rgba(0, 180, 90, 0.18), inset 0 calc(-1 * " + y + ") 0 0 rgba(0, 180, 90, 0.18)"
        };
      },
      // logocloud format: square tiles or one height ("flexible")
      logosFlexible() {
        return this.setting("layout", "item-format") === "flexible";
      },
      // a logo's tile: size, padding, shape and background as in the frontend
      logoStyle() {
        const shape = this.setting("layout", "item-shape") || "round";
        if (this.logosFlexible) {
          const r2 = this.itemValue("item-radius") || [];
          const custom2 = Array.isArray(r2) && r2.length === 4 ? [r2[0], r2[1], r2[3], r2[2]].join(" ") : 0;
          return {
            height: this.itemValueAt("item-size"),
            maxWidth: "100%",
            padding: this.logoPadding,
            backgroundColor: this.itemColor("item-background"),
            borderRadius: { square: 0, round: "999px" }[shape] ?? custom2
          };
        }
        const r = this.itemValue("item-radius") || [];
        const custom = Array.isArray(r) && r.length === 4 ? [r[0], r[1], r[3], r[2]].join(" ") : 0;
        return {
          minWidth: 0,
          aspectRatio: "1",
          padding: this.logoPadding,
          backgroundColor: this.itemColor("item-background"),
          borderRadius: { square: 0, round: "50%" }[shape] ?? custom
        };
      },
      isQuote() {
        return this.blockType === "pwquote";
      },
      // the link in the sample text: as the block links (Global › Blocks)
      linkStyle() {
        return {
          "--pw-link": this.globalColor("block-link"),
          "--pw-link-hover": this.globalColor("block-link-hover"),
          fontWeight: this.linkValue("block-link-weight") === "bold" ? 700 : null,
          textDecorationThickness: this.linkValue("block-link-thickness"),
          textUnderlineOffset: this.linkValue("block-link-offset")
        };
      },
      isHero() {
        return this.blockType === "pwhero";
      },
      // the block's own space below its tagline, heading and text (hero)
      ownSpacing() {
        return this.setting("layout", "item-spacing") === "own";
      },
      // the block brings values for its own space below (then its design tab
      // shows the space, own or global, with guides)
      hasOwnSpacingValues() {
        return Object.values(this.valueDefaults || {}).some((g) => g && g.vars && ["tagline-spacing", "heading-spacing", "editor-spacing"].some((name) => g.vars[name]));
      },
      // the background: the start value (design tab: the sample image, for the
      // overlay colour)
      heroBackground() {
        if (this.designView) return "image";
        return this.setting("style", "background-type") || "color";
      },
      // design tab: a solid overlay at 50 % (the start strength) in the
      // variant's overlay colour
      heroOverlayStyle() {
        const color = this.itemColor("overlay") || "#000000";
        return { background: "color-mix(in srgb, " + color + " 50%, transparent)" };
      },
      // image or video: the drawn sample image (as in the media preview)
      heroImage() {
        return this.isHero && ["image", "video"].includes(this.heroBackground);
      },
      // its height: a share of the device's screen, "auto" as its content
      heroHeightPx() {
        const height = this.heroHeight || this.setting("style", "height");
        if (height === "fullscreen") return SCREEN_HEIGHTS[this.bp] + "px";
        const vh = parseFloat(this.itemValueAt("height-" + height));
        return vh ? Math.round(SCREEN_HEIGHTS[this.bp] * vh / 100) + "px" : null;
      },
      // the paddings' edge inside the grid item
      heroPadStyle() {
        const st = this.itemStyle;
        const v = (x) => x || 0;
        return { inset: [v(st.paddingTop), v(st.paddingRight), v(st.paddingBottom), v(st.paddingLeft)].join(" ") };
      },
      // the content's place (as the frontend's data-h / data-v margins)
      heroContentStyle() {
        const h = this.setting("layout", "position-horizontal") || "left";
        const v = this.setting("layout", "position-vertical") || "middle";
        return {
          display: "flex",
          flexDirection: "column",
          marginLeft: h === "left" ? 0 : "auto",
          marginRight: h === "right" ? 0 : "auto",
          marginTop: v === "top" ? 0 : "auto",
          marginBottom: v === "bottom" ? 0 : "auto"
        };
      },
      isCardlets() {
        return this.blockType === "pwcardlets";
      },
      // the cards: columns at the shown device (at most two samples), the gap
      // between them as in its CSS
      cardColumns() {
        if (!this.hasGrid) return 1;
        return Math.min(Number(this.setting("layout", "columns-" + GRID_BP[this.bp])) || 1, 2);
      },
      // the gap to the intro above (alone: the intro's last element has no space below there)
      cardTextGap() {
        return this.introGap("items");
      },
      cardItemsStyle() {
        const marginTop = this.guides ? 0 : this.cardTextGap;
        const gap = this.itemValueAt("item-gap");
        const cols = this.cardColumns;
        if (this.guides) {
          if (cols > 1) return { marginTop, display: "grid", gridTemplateColumns: Array.from({ length: cols }, () => "minmax(0, 1fr)").join(" " + gap + " ") };
          return { marginTop, display: "flex", flexDirection: "column" };
        }
        if (!this.hasGrid) return { marginTop, display: "flex", flexDirection: "column", gap };
        return { marginTop, display: "grid", gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))", gap };
      },
      // a card: background, border (switched on), the corners switched on
      cardStyle() {
        const r = this.setting("layout", "item-shape") === "square" ? [] : this.itemValue("item-radius") || [];
        const corner = (key, idx) => r[idx] || 0;
        return {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          // on the image: the card in its ratio, the image fills it
          position: this.cardOverlay ? "relative" : null,
          aspectRatio: this.cardOverlay ? (this.setting("layout", { default: "item-ratio", lg: "item-ratio-lg", xl: "item-ratio-xl" }[this.bp] || "item-ratio") || "4/5").replace("/", " / ") : null,
          backgroundColor: this.itemColor("item-background"),
          border: this.setting("layout", "item-border") === true ? this.itemValue("item-border-width") + " solid " + this.itemColor("item-border-color") : 0,
          // the shadow step (as the buttons')
          boxShadow: { sm: "0 1px 2px rgba(0, 0, 0, 0.12)", md: "0 4px 10px rgba(0, 0, 0, 0.15)", lg: "0 10px 24px rgba(0, 0, 0, 0.18)" }[this.setting("layout", "item-shadow")] || null,
          borderRadius: [corner("top-left", 0), corner("top-right", 1), corner("bottom-right", 3), corner("bottom-left", 2)].join(" "),
          // the image standing out: the card drawn in two pieces (see
          // cardOverhangStyle and the content), the card itself bare
          ...this.cardOverhang ? { overflow: "visible", backgroundColor: "transparent", border: 0, boxShadow: "none", borderRadius: 0 } : {}
        };
      },
      // its content inside the card's padding, the link at the bottom
      cardContentStyle() {
        const x = this.itemValue("item-padding-x");
        const y = this.itemValue("item-padding-y");
        const style = { flex: 1, display: "flex", flexDirection: "column", padding: y + " " + x, position: "relative", "--pw-card-px": x, "--pw-card-py": y };
        if (this.cardOverhang) {
          const piece = this.cardPiece;
          Object.assign(style, {
            backgroundColor: piece.backgroundColor,
            border: piece.border,
            borderTopWidth: 0,
            borderRadius: "0 0 " + piece.radius[2] + " " + piece.radius[3],
            boxShadow: [piece.shadow, style.boxShadow].filter(Boolean).join(", ") || null,
            clipPath: "inset(0 -3rem -3rem -3rem)"
          });
        }
        if (this.cardOverlay) {
          Object.assign(style, { position: "relative", justifyContent: this.cardTextTop ? "flex-start" : "flex-end" });
        }
        if (this.guides && this.highlight === "item-padding-x") {
          style.boxShadow = "inset 1px 0 0 0 rgba(255, 0, 170, 0.6), inset -1px 0 0 0 rgba(255, 0, 170, 0.6), inset " + x + " 0 0 0 rgba(255, 0, 170, 0.18), inset calc(-1 * " + x + ") 0 0 0 rgba(255, 0, 170, 0.18)";
        } else if (this.guides && this.highlight === "item-padding-y") {
          style.boxShadow = "inset 0 1px 0 0 rgba(0, 180, 90, 0.9), inset 0 -1px 0 0 rgba(0, 180, 90, 0.9), inset 0 " + y + " 0 0 rgba(0, 180, 90, 0.18), inset 0 calc(-1 * " + y + ") 0 0 rgba(0, 180, 90, 0.18)";
        }
        return style;
      },
      // the display on the image (start value), the texts at the top
      cardOverlay() {
        return (this.cardDisplay || this.setting("style", "card-display")) === "overlay";
      },
      // image above / standing out: the images' ratio at the device shown
      // (Original: the sample's own 16:9); standing out the whole cut-out
      // image at the bottom of its box
      cardImageStyle() {
        if (this.cardOverlay) return null;
        const key = this.cardOverhang ? "item-cutout-ratio" : "item-image-ratio";
        const ratio = this.setting("layout", { default: key, lg: key + "-lg", xl: key + "-xl" }[this.bp] || key);
        if (!ratio || ratio === "auto") return null;
        const style = { aspectRatio: ratio.replace("/", " / ") };
        if (this.cardOverhang) Object.assign(style, { backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center bottom" });
        return style;
      },
      cardOverhang() {
        return (this.cardDisplay || this.setting("style", "card-display")) === "overhang";
      },
      // the card's look shared by its two pieces: background, border, corners
      // (top-left, top-right, bottom-right, bottom-left), shadow
      cardPiece() {
        const r = this.setting("layout", "item-shape") === "square" ? [] : this.itemValue("item-radius") || [];
        return {
          backgroundColor: this.itemColor("item-background"),
          border: this.setting("layout", "item-border") === true ? this.itemValue("item-border-width") + " solid " + this.itemColor("item-border-color") : 0,
          radius: [r[0] || 0, r[1] || 0, r[3] || 0, r[2] || 0],
          shadow: { sm: "0 1px 2px rgba(0, 0, 0, 0.12)", md: "0 4px 10px rgba(0, 0, 0, 0.15)", lg: "0 10px 24px rgba(0, 0, 0, 0.18)" }[this.setting("layout", "item-shadow")] || null
        };
      },
      // the upper piece: behind the image, from the overhang down
      cardOverhangStyle() {
        const piece = this.cardPiece;
        return {
          top: this.itemValueAt("item-overhang"),
          backgroundColor: piece.backgroundColor,
          border: piece.border,
          borderBottomWidth: 0,
          borderRadius: piece.radius[0] + " " + piece.radius[1] + " 0 0",
          boxShadow: piece.shadow,
          clipPath: "inset(-3rem -3rem 0 -3rem)"
        };
      },
      cardTextTop() {
        return this.setting("style", "card-text-position") === "top";
      },
      // the overlay in the variant's colour with its strength, from the
      // texts' side
      cardOverlayStyle() {
        const color = this.itemColor("item-overlay") || "#000000";
        const own = this.content ? this.content.cardoverlay : null;
        const raw = own !== void 0 && own !== null && own !== "" ? own : this.itemValue("item-overlay-strength");
        const strength = isNaN(parseFloat(raw)) ? 50 : parseFloat(raw);
        const stops = [[1, 0], [1, 35], [0.85, 45], [0.62, 55], [0.4, 65], [0.2, 75], [0.07, 87]].map(([k, at]) => "color-mix(in srgb, " + color + " " + strength * k + "%, transparent) " + at + "%");
        return { background: "linear-gradient(to " + (this.cardTextTop ? "bottom" : "top") + ", " + stops.join(", ") + ", transparent 100%)" };
      },
      // the card's texts shown (as switched on in the block)
      cardFields() {
        return ["tagline", "heading", "editor"].filter((el) => this.hasField("item-" + el));
      },
      // the link: text (link colour, underline, icon) or a button
      cardCtaStyle() {
        const base = { "--pw-card-icon-stroke": { thin: 1.25, normal: 2, bold: 2.75 }[this.setting("layout", "item-link-icon-stroke")] || 2, display: "inline-flex", alignItems: "center", gap: "0.4em", width: "max-content", marginTop: this.setting("layout", "item-link-position") === "inline" || this.cardOverlay ? 0 : "auto" };
        if (this.setting("layout", "item-link-style") !== "button") {
          return {
            ...base,
            ...this.typography("editor"),
            // medium, or bold as the block links
            fontWeight: this.linkValue("block-link-weight") === "bold" ? 700 : 500,
            color: this.itemColor("item-link"),
            textDecoration: this.setting("layout", "item-link-decoration") === "underline" ? "underline" : "none"
          };
        }
        const style = this.setting("layout", "item-button-style") || "default";
        const color = (name) => {
          var _a, _b, _c;
          return ((this.elementOverrides.global || {})[style] || {})[name] || ((_c = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.colors) == null ? void 0 : _b[name]) == null ? void 0 : _c[style]) || "";
        };
        return { ...this.buttonStyle, display: "inline-flex", width: "max-content", marginTop: base.marginTop, color: color("element-button-text"), backgroundColor: color("element-button-background"), borderColor: color("element-button-border") };
      },
      // the link's icon (text style): the chosen one of its icon choice
      cardCtaIcon() {
        if (this.setting("layout", "item-link-style") === "button") return "";
        const def = this.nested(this.config.defaults || {}, "settings.fields.layout.item-link-icon");
        const key = this.setting("layout", "item-link-icon");
        const opt = def && Array.isArray(def.options) ? def.options.find((o) => o.value === key) : null;
        return opt ? opt.svg : "";
      },
      isMulticolumn() {
        return this.blockType === "pwmulticolumn";
      },
      // side by side from the device whose distribution is set (mobile stacked)
      mcDist() {
        const key = GRID_BP[this.bp];
        return key ? this.setting("layout", "columns-" + key) || "" : "";
      },
      mcSide() {
        return /^dist-\d-\d$/.test(this.mcDist);
      },
      // the columns: side by side (a distribution set for the device) in equal
      // halves with the gap between them (with guides a track of its own);
      // stacked below each other with the row gap
      mcStyle() {
        if (!this.mcSide) {
          return { display: "flex", flexDirection: "column", gap: this.guides ? 0 : this.itemValueAt("row-gap") };
        }
        const a = 1;
        const b = 1;
        const gap = this.itemValueAt("column-gap");
        return this.guides ? { display: "grid", gridTemplateColumns: "minmax(0, " + a + "fr) " + gap + " minmax(0, " + b + "fr)" } : { display: "grid", gridTemplateColumns: "minmax(0, " + a + "fr) minmax(0, " + b + "fr)", columnGap: gap };
      },
      // the list in a column: the text's type, the lists' indent, gap, marker
      // (Elements › Lists); its space below the block's own or the lists'
      mcListStyle() {
        const kind = this.preset("list", "style") || "bullet";
        const marker = kind === "none" ? "none" : kind === "ordered" ? { decimal: "decimal", "decimal-paren": "pw-decimal-paren", "lower-alpha": "lower-alpha", "lower-roman": "lower-roman" }[this.elementValue("list", "number-format")] || "decimal" : { disc: "disc", circle: "circle", box: "square", dash: '"–  "', arrow: '"→  "', chevron: '"›  "', check: '"✓  "', star: '"★  "' }[this.elementValue("list", "marker")] || "disc";
        const size2 = this.preset("list", "sizes") || "normal";
        const step = size2 !== "normal" ? this.sizeStep("editor", size2) : "";
        return {
          ...this.typography("editor"),
          ...step ? { fontSize: step } : {},
          color: this.elementColor("editor", "element-editor-text"),
          textAlign: this.preset("list", "align") || "left",
          margin: 0,
          marginBottom: this.guides ? 0 : this.mcListSpacing,
          paddingLeft: kind === "none" ? 0 : this.elementValue("list", kind === "ordered" ? "number-indent" : "indent"),
          listStyleType: marker,
          "--pw-list-gap": this.elementValue("list", "item-spacing"),
          "--pw-list-marker": this.elementColor("list", kind === "ordered" ? "element-list-number" : "element-list-marker"),
          "--pw-list-marker-size": kind === "ordered" ? "100%" : this.elementValue("list", "marker-size") || "100%"
        };
      },
      // the quote in a column: the quote's type and colour, its start values
      // (alignment, size), its space below
      mcQuoteStyle() {
        const step = this.sizeStep("quote", this.preset("quote", "sizes") || "lg");
        return { ...this.typography("quote"), ...step ? { fontSize: step } : {}, color: this.elementColor("quote", "element-quote-text"), textAlign: this.preset("quote", "align") || "left", margin: 0, marginBottom: this.guides ? 0 : this.spaceAfter("quote") };
      },
      mcListSpacing() {
        if (this.ownSpacing) {
          const own = this.itemValue("list-spacing");
          if (own) return own;
        }
        return this.elementValue("list", "spacing");
      },
      isFaq() {
        return this.blockType === "pwfaq";
      },
      // faq: the style shown, its icon (chevron, plus, none) and stroke
      currentFaqStyle() {
        return this.faqStyle || this.setting("style", "faq-style") || "lines";
      },
      faqIcon() {
        return this.setting("layout", "item-icon") || "chevron";
      },
      // its drawing from the icon choice (none: no icon); a plus turns into a
      // minus when open, the others turn down
      faqIconSvg() {
        if (this.faqIcon === "none") return "";
        const def = this.nested(this.config.defaults || {}, "settings.fields.layout.item-icon");
        const opt = def && Array.isArray(def.options) ? def.options.find((o) => o && o.value === this.faqIcon) : null;
        return opt && opt.svg ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + opt.svg + "</svg>" : "";
      },
      faqIconKind() {
        return ["plus", "circle-plus"].includes(this.faqIcon) ? "plus" : "turn";
      },
      faqStroke() {
        return { thin: 1, normal: 1.5, bold: 2.5 }[this.setting("layout", "item-icon-stroke")] || 1.5;
      },
      // the gap to the intro above (beside it in the split layout: none)
      faqTextGap() {
        if (this.featureSplit && this.hasGrid) return 0;
        return this.introGap("items");
      },
      faqListStyle() {
        const style = { marginTop: this.guides ? 0 : this.faqTextGap };
        if (this.currentFaqStyle === "cards") Object.assign(style, { display: "flex", flexDirection: "column", gap: this.itemValueAt("item-gap") });
        return style;
      },
      // the question's row: the question and the icon (left: before it)
      faqSummaryStyle() {
        const room = this.setting("layout", "item-icon-align") === "item" && this.faqIconSvg && !this.faqAlwaysOpen ? "calc(" + this.itemValueAt("item-icon-size") + " + " + this.itemValue("item-icon-gap") + ")" : null;
        return {
          [this.setting("layout", "item-icon-position") === "left" ? "paddingLeft" : "paddingRight"]: room,
          display: "flex",
          // (the icon on the question's first line: at the top)
          alignItems: this.setting("layout", "item-icon-align") === "top" ? "flex-start" : "center",
          gap: this.itemValue("item-icon-gap"),
          paddingTop: this.itemValueAt("item-padding-y"),
          paddingBottom: this.itemValueAt("item-padding-y"),
          flexDirection: this.setting("layout", "item-icon-position") === "left" ? "row-reverse" : "row",
          justifyContent: "space-between"
        };
      },
      faqQuestionStyle() {
        return { ...this.entryTypography("title"), color: this.itemColor("item-question"), flex: 1, margin: 0 };
      },
      // the answer: the entries' text, below the question; up to the icon or
      // across the full width
      faqAnswerStyle() {
        const pad = this.itemValueAt("item-padding-y");
        const style = {
          ...this.entryTypography("text"),
          color: this.elementColor("editor", "element-editor-text"),
          paddingBottom: pad,
          marginTop: "calc(" + (this.itemValue("item-answer-gap") || "0rem") + " - " + pad + ")"
        };
        if (this.setting("layout", "item-answer-width") !== "full" && this.faqIconSvg && !this.faqAlwaysOpen) {
          const room = "calc(" + this.itemValueAt("item-icon-size") + " + " + this.itemValue("item-icon-gap") + ")";
          style[this.setting("layout", "item-icon-position") === "left" ? "paddingLeft" : "paddingRight"] = room;
        }
        return style;
      },
      faqAlwaysOpen() {
        return this.setting("style", "faq-behavior") === "open";
      },
      isFeaturelist() {
        return this.blockType === "pwfeaturelist";
      },
      featureIcons() {
        return FEATURE_ICONS;
      },
      // split layout (from tablet on): intro one third, the items two thirds
      featureSplit() {
        return (this.isFeaturelist || this.isFaq) && (this.featureLayout || this.setting("style", "section-layout")) === "split";
      },
      contentStyle() {
        if (this.isHero) return this.heroContentStyle;
        if (!this.featureSplit || !this.hasGrid) return {};
        const gap = this.itemValue("item-offset-gap");
        const alignItems = this.setting("layout", "item-offset-align") === "center" ? "center" : "start";
        if (this.guides) return { display: "grid", gridTemplateColumns: "minmax(0, 1fr) " + gap + " minmax(0, 2fr)", alignItems };
        return { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", columnGap: gap, alignItems };
      },
      // columns of the features at the shown device (mobile: one below the other)
      // (at most as many as sample features shown: no empty column; split:
      // one below the other, so the layout reads in the narrow sidebar)
      featureColumns() {
        if (!this.hasGrid || this.featureSplit) return 1;
        return Math.min(Number(this.setting("layout", "columns-" + GRID_BP[this.bp])) || 1, 2);
      },
      featureItemsStyle() {
        const gap = this.itemValueAt("item-gap");
        const marginTop = this.guides ? 0 : this.featureTextGap;
        const cols = this.featureColumns;
        if (this.guides) {
          if (cols > 1) {
            const tracks = Array.from({ length: cols }, () => "minmax(0, 1fr)").join(" " + gap + " ");
            return { marginTop, display: "grid", gridTemplateColumns: tracks };
          }
          return { marginTop, display: "flex", flexDirection: "column" };
        }
        if (!this.hasGrid) return { marginTop, display: "flex", flexDirection: "column", gap };
        return { marginTop, display: "grid", gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))", gap };
      },
      // the gap between the text above and the features (none without text,
      // none beside the intro); the text's space below meets it, the larger wins
      featureTextGap() {
        if (this.featureSplit && this.hasGrid) return 0;
        return this.introGap("items");
      },
      // the gap between two features: as high (one below the other) or as
      // wide (side by side) as the gap
      featureGapStyle() {
        const gap = this.itemValueAt("item-gap");
        return this.featureColumns > 1 ? { width: gap } : { height: gap };
      },
      // icon position "none": the features without icons
      featureNoIcon() {
        return this.setting("layout", "item-icon-position") === "none";
      },
      // icon beside the content: top (with its offset) or centre
      featureIconAlign() {
        return this.setting("layout", "item-icon-align") || "top";
      },
      featureIconTop() {
        return this.setting("layout", "item-icon-position") === "top";
      },
      featureTile() {
        return this.setting("layout", "item-icon-style") === "tile";
      },
      // the gap between icon and text: beside as wide, above as high as it is
      featureIconGapStyle() {
        const gap = this.itemValue("item-icon-gap");
        return this.featureIconTop ? { height: gap, alignSelf: "stretch" } : { width: gap, alignSelf: "stretch", flexShrink: 0 };
      },
      featureItemStyle() {
        return {
          display: "flex",
          flexDirection: this.featureIconTop ? "column" : "row",
          // with guides the gap is an element of its own (two lines)
          gap: this.guides ? 0 : this.itemValue("item-icon-gap"),
          // icon beside the content: at the top or centred to it
          alignItems: !this.featureIconTop && this.featureIconAlign === "center" ? "center" : "flex-start"
        };
      },
      // the icon: plain, or on a tile (padding, background, shape)
      featureIconStyle() {
        const style = { display: "flex", flexShrink: 0, position: "relative" };
        if (!this.featureIconTop && this.featureIconAlign !== "center") style.translate = "0 " + (this.itemValue("item-icon-offset") || "0rem");
        if (!this.featureTile) return style;
        const shape = this.setting("layout", "item-shape") || "custom";
        const r = this.itemValue("item-radius") || [];
        const custom = Array.isArray(r) && r.length === 4 ? [r[0], r[1], r[3], r[2]].join(" ") : 0;
        const pad = this.itemValue("item-icon-tile-padding");
        return {
          ...style,
          padding: pad,
          // its padding hovered: tinted all around
          boxShadow: this.guides && this.highlight === "item-icon-tile-padding" ? "inset 0 0 0 " + pad + " rgba(255, 0, 170, 0.25)" : null,
          backgroundColor: this.itemColor("item-icon-tile-background"),
          borderRadius: { square: 0, round: "50%" }[shape] ?? custom
        };
      },
      featureSvgStyle() {
        const size2 = this.itemValueAt("item-icon-size");
        return { width: size2, height: size2, fill: this.itemColor("item-icon-fill") };
      },
      featureTitleInline() {
        return this.setting("layout", "item-title-style") === "inline";
      },
      // title and description: Elements › Items (the block's own values when
      // switched on)
      featureTitleStyle() {
        return { ...this.entryTypography("title"), textAlign: this.preset("blocks", "align") || "left" };
      },
      featureTitleInlineStyle() {
        const heading = this.typography("heading");
        return { fontFamily: heading.fontFamily, fontWeight: heading.fontWeight, color: this.elementColor("heading", "element-heading-text") };
      },
      // the text below the title: the title gap above it
      featureTextBelowStyle() {
        return { ...this.featureTextStyle, marginTop: this.guides ? 0 : this.entryValue("item-title-spacing") };
      },
      featureTextStyle() {
        return { ...this.entryTypography("text"), textAlign: this.preset("blocks", "align") || "left" };
      },
      // the sample quote, with the element's quote marks (or none)
      quoteText() {
        const text = this.$t("prw.sample.quote").replace(/^[„"“«»]+|[“"”«»]+$/g, "");
        const marks = this.elementValue("quote", "marks") !== "disabled";
        return marks ? "„" + text + "“" : text;
      },
      quoteStyle() {
        const size2 = this.preset("quote", "sizes") || "lg";
        return {
          ...this.typography("quote"),
          fontSize: this.sizeStep("quote", size2) || this.sizeStep("quote", "lg"),
          color: this.elementColor("quote", "element-quote-text"),
          textAlign: this.preset("quote", "align") || "left",
          margin: 0
        };
      },
      citeStyle() {
        return {
          ...this.typography("cite"),
          display: "block",
          color: this.elementColor("cite", "element-cite-text"),
          textAlign: this.preset("author", "align") || "left",
          marginTop: this.elementValue("cite", "spacing")
        };
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
      // columns of the steps at the shown device (no grid: one; connected: one)
      stepColumns() {
        if (!this.hasGrid || this.currentStepStyle === "connected") return 1;
        return Number(this.setting("layout", "columns-" + GRID_BP[this.bp])) || 1;
      },
      // the gap to the intro above (alone: the intro's last element has no space below there)
      stepTextGap() {
        return this.introGap("items");
      },
      stepItemsStyle() {
        const gap = this.itemValue("item-gap");
        const style = { marginTop: this.guides ? 0 : this.stepTextGap };
        const cols = this.stepColumns;
        if (this.guides) {
          if (cols > 1) {
            const tracks = Array.from({ length: cols }, () => "minmax(0, 1fr)").join(" " + gap + " ");
            return { ...style, display: "grid", gridTemplateColumns: tracks };
          }
          return { ...style, display: "flex", flexDirection: "column" };
        }
        if (!this.hasGrid) return { ...style, display: "flex", flexDirection: "column", gap };
        return { ...style, display: "grid", gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))", gap };
      },
      // the gap between two steps: as high (one below the other) or as wide
      // (side by side) as the gap
      stepStepGapStyle() {
        const gap = this.itemValue("item-gap");
        return this.stepColumns > 1 ? { width: gap } : { height: gap };
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
          // with guides the gap is an element of its own (two lines)
          gap: this.guides ? 0 : this.stepValue("item-content-gap")
        };
      },
      // the gap element: as wide (beside) or as high (centered) as the gap
      stepGapStyle() {
        const gap = this.stepValue("item-content-gap");
        return this.currentStepStyle === "centered" ? { height: gap, alignSelf: "stretch" } : { width: gap, alignSelf: "stretch", flexShrink: 0 };
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
      // step title and description: Elements › Items (own values when switched on)
      stepHeadingStyle() {
        return this.entryTypography("title");
      },
      stepTextStyle() {
        return { ...this.entryTypography("text"), marginTop: this.guides ? 0 : this.entryValue("item-title-spacing") };
      },
      sectionStyle() {
        const layout = (key) => this.setting("layout", key);
        const radius = this.globalValue("global-") || [];
        const corner = (key, idx) => layout("radius-" + key) === true ? radius[idx] || 0 : 0;
        return {
          // hero: its height, a sample image as background
          // (a minimum, as in the frontend: more content lets the hero grow; the
          // grid fills it as a flex column)
          ...this.isHero ? { minHeight: this.heroHeightPx, display: "flex", flexDirection: "column" } : {},
          backgroundColor: this.heroImage ? null : this.globalColor("block-background"),
          // global- values: top-left, top-right, bottom-left, bottom-right
          borderRadius: [corner("top-left", 0), corner("top-right", 1), corner("bottom-right", 3), corner("bottom-left", 2)].join(" ")
        };
      },
      // outer spacing (settings: margin-top / margin-bottom) in page colour
      blockStyle() {
        const margin = (key, name) => this.setting("settings", key) === true ? this.globalValue(name) || "0px" : "0px";
        const top = margin("margin-top", "global-margin-top");
        const bottom = margin("margin-bottom", "global-margin-bottom");
        const tint = "rgba(0, 170, 255, 0.15)";
        const shadow = !this.guides ? null : this.highlight === "margin-top" ? "inset 0 " + top + " 0 0 " + tint : this.highlight === "margin-bottom" ? "inset 0 calc(-1 * " + bottom + ") 0 0 " + tint : null;
        return { paddingTop: top, paddingBottom: bottom, boxShadow: shadow };
      },
      hasGrid() {
        return !!GRID_BP[this.bp];
      },
      gridStyle() {
        const fill = this.isHero ? { flex: "1 1 auto" } : {};
        if (!this.hasGrid) return { display: "block", ...fill };
        return {
          ...fill,
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
        const tint = " 0 0 rgba(255, 0, 170, 0.15)";
        const sides = {
          "padding-top": () => "inset 0 " + style.paddingTop + tint,
          "padding-bottom": () => "inset 0 calc(-1 * " + style.paddingBottom + ")" + tint,
          "padding-left": () => "inset " + style.paddingLeft + " 0" + tint,
          "padding-right": () => "inset calc(-1 * " + style.paddingRight + ") 0" + tint
        };
        const value = { "padding-top": style.paddingTop, "padding-bottom": style.paddingBottom, "padding-left": style.paddingLeft, "padding-right": style.paddingRight }[this.highlight];
        if (this.guides && sides[this.highlight] && value) style.boxShadow = sides[this.highlight]();
        if (this.isHero) {
          style.display = "flex";
          style.height = "100%";
          style.boxSizing = "border-box";
          style.position = "relative";
        }
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
          marginTop: this.spaceBand("buttons") ? 0 : this.gapBefore("buttons")
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
      // a logo's tile; with guides one of the four corners of the 3×3 tracks
      logoTileStyle(index) {
        const cells = ["1 / 1", "1 / 3", "3 / 1", "3 / 3"];
        const style = this.guides && !this.logosFlexible && cells[index] ? { ...this.logoStyle, gridArea: cells[index] } : { ...this.logoStyle };
        if (this.guides && this.logosFlexible && (this.highlight === "item-gap" || this.highlight === "item-row-gap")) {
          if (this.highlight === "item-gap") {
            const half = "calc(" + this.itemValue("item-gap") + " / 2)";
            style.boxShadow = half + " 0 0 0 rgba(0, 170, 255, 0.15), calc(-1 * " + half + ") 0 0 0 rgba(0, 170, 255, 0.15)";
          }
        }
        return style;
      },
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
      // a responsive value of the block's own (item-size …) at the shown device
      itemValueAt(name) {
        const ov = (this.valueOverrides || {})[name];
        if (ov && typeof ov === "object" && !Array.isArray(ov) && ov[this.bp]) return ov[this.bp];
        for (const group of Object.values(this.valueDefaults || {})) {
          const def = group && group.vars && group.vars[name];
          if (def) return def[this.bp] || def.default || def.value;
        }
        return void 0;
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
      nested(obj2, path) {
        return path.split(".").reduce((o, k) => o && o[k] !== void 0 ? o[k] : void 0, obj2);
      },
      // a block setting (category field) default: override, else the plugin's
      setting(category, key) {
        const path = "settings.fields." + category + "." + key;
        const ov = this.nested(this.overrides || {}, path + ".default");
        const value = ov !== void 0 ? ov : this.nested(this.config.defaults || {}, path + ".default");
        return validStart(value, this.nested(this.config.defaults || {}, path + ".options"), this.nested(this.config.defaults || {}, path + ".empty"));
      },
      // a content field preset (align, sizes, …)
      preset(field, prop) {
        const path = "settings.fields.content." + field + "." + prop;
        const ov = this.nested(this.overrides || {}, path + ".default");
        const value = ov !== void 0 ? ov : this.nested(this.config.defaults || {}, path + ".default");
        return validStart(value, this.nested(this.config.defaults || {}, path + ".options"), this.nested(this.config.defaults || {}, path + ".empty"));
      },
      // a content field of the block, unless hidden from the editors (then
      // nobody fills it in)
      hasField(field) {
        if (this.isMulticolumn) return false;
        const content = this.nested(this.config.defaults || {}, "settings.fields.content") || {};
        const hidden = this.nested(this.overrides || {}, "settings.hidden");
        if (Array.isArray(hidden) && hidden.includes(field)) return false;
        return content[field] !== void 0 && content[field] !== false;
      },
      // a value of the block links (override, else the plugin's)
      linkValue(name) {
        var _a, _b, _c;
        const ov = (this.globalOverrides.global || {})[name];
        if (ov !== void 0 && ov !== "") return ov;
        return ((_c = (_b = (_a = this.globalDefaults.links) == null ? void 0 : _a.vars) == null ? void 0 : _b[name]) == null ? void 0 : _c.value) || "";
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
      // the gap above a field: the element before keeps its "space after"
      // (tagline, heading, text); before the block's own content (items,
      // media, logos) the block's CSS sets the gap – margins meet there, the
      // larger one wins as in the frontend
      // the gap between the intro and what follows it (entries, logos, media):
      // the space below the intro's last element plus the block's own
      // enlargement (as the frontend: its padding above them)
      introGap(field) {
        const idx = this.fields.indexOf(field);
        if (idx <= 0) return 0;
        const prev = this.fields[idx - 1];
        const after = ["tagline", "heading", "editor"].includes(prev) ? this.spaceAfter(prev) : "";
        const more = this.itemValue("item-text-gap");
        if (after && more && parseFloat(more) !== 0) return "calc(" + after + " + " + more + ")";
        return after || more || 0;
      },
      gapBefore(field) {
        const idx = this.fields.indexOf(field);
        if (idx <= 0) return 0;
        const prev = this.fields[idx - 1];
        const after = ["tagline", "heading", "editor"].includes(prev) ? this.spaceAfter(prev) : "";
        const own = GAPS[prev + ">" + field];
        if (own && after) return "max(" + own + ", " + after + ")";
        return own || after || 0;
      },
      // a value of the entries: the block's own (switched on: item-entry own),
      // else the global items' (Elements › Items), at the shown device
      entryValue(name) {
        const part = name.startsWith("item-text-") ? "text" : "title";
        const own = this.setting("layout", "item-entry-" + part) || this.setting("layout", "item-entry");
        if (own === "own") {
          const ov = (this.valueOverrides || {})[name];
          if (ov && typeof ov === "object") {
            if (ov[this.bp]) return ov[this.bp];
          } else if (ov) return ov;
          for (const group of Object.values(this.valueDefaults || {})) {
            const def = group && group.vars && group.vars[name];
            if (def) return def[this.bp] || def.default || def.value;
          }
        }
        return this.elementValue("item", name.replace(/^item-/, ""));
      },
      // title or description of an entry: the type of Elements › Items, its
      // colour from the variant
      entryTypography(part) {
        const g = (prop) => this.elementValue("item", part + "-" + prop);
        let family = g("font-family");
        if (!family || family === "default") family = this.bodyDefaultFont;
        const all = { ...this.fonts.builtin || {}, ...this.fonts.project || {} };
        const font = Object.values(all).find((f) => f.family === family);
        return {
          fontFamily: "'" + family + "', " + (font && font.category || "sans-serif"),
          fontWeight: g("font-weight"),
          fontStyle: g("font-style"),
          fontSize: this.entryValue("item-" + part + "-font-size"),
          lineHeight: part === "title" ? this.entryValue("item-title-line-height") : g("line-height"),
          letterSpacing: g("letter-spacing"),
          textTransform: g("text-transform"),
          color: this.elementColor("item", "element-item-" + part + "-text")
        };
      },
      // the space below an element: the block's own (switched on in its design
      // tab) or the element's
      spaceAfter(element) {
        if (this.ownSpacing) {
          const own = this.itemValue(element + "-spacing");
          if (own) return own;
        }
        return this.elementValue(element, "spacing");
      },
      // guides with the block's own space below: the gap above a field as a
      // band of its own, coloured by the element above (tagline cyan, heading
      // violet, text orange)
      spaceBand(field) {
        if (!this.guides || !this.hasOwnSpacingValues) return null;
        const idx = this.fields.indexOf(field);
        const prev = idx > 0 ? this.fields[idx - 1] : "";
        if (!["tagline", "heading", "editor"].includes(prev)) return null;
        const height = this.gapBefore(field);
        return height ? { height, prev } : null;
      },
      // faq: a sample question
      faqSampleQuestion(n) {
        return this.$t("prw.preview.faq.question." + n);
      },
      // the first question open (always open: all)
      faqOpen(n) {
        return this.faqAlwaysOpen || n === 1;
      },
      // a question: lines between them, or each a card
      faqItemStyle(n) {
        const padY = this.itemValueAt("item-padding-y");
        const tintY = this.guides && this.highlight === "item-padding-y" ? "inset 0 " + padY + " 0 0 rgba(0, 180, 90, 0.18), inset 0 calc(-1 * " + padY + ") 0 0 rgba(0, 180, 90, 0.18)" : null;
        if (this.currentFaqStyle === "cards") {
          const r = this.setting("layout", "item-shape") === "square" ? [] : this.itemValue("item-radius") || [];
          const padX = this.itemValueAt("item-padding-x");
          return {
            position: "relative",
            boxShadow: this.guides && this.highlight === "item-padding-x" ? "inset " + padX + " 0 0 0 rgba(255, 0, 170, 0.18), inset calc(-1 * " + padX + ") 0 0 0 rgba(255, 0, 170, 0.18)" : tintY,
            backgroundColor: this.itemColor("item-background"),
            paddingLeft: this.itemValueAt("item-padding-x"),
            paddingRight: this.itemValueAt("item-padding-x"),
            borderRadius: [r[0] || 0, r[1] || 0, r[3] || 0, r[2] || 0].join(" ")
          };
        }
        if (n > 1 && this.setting("layout", "item-divider") !== "disabled") {
          return { position: "relative", boxShadow: tintY, borderTop: (this.itemValue("item-divider-width") || "1px") + " solid " + this.itemColor("item-divider") };
        }
        return { position: "relative", boxShadow: tintY };
      },
      // the icon: its size and colour, turned when open (a chevron down; a
      // plus loses its vertical line)
      faqIconStyle(open) {
        const size2 = this.itemValueAt("item-icon-size");
        const title = this.entryTypography("title");
        const line = this.setting("layout", "item-icon-align") === "top" && title.fontSize && title.lineHeight ? "max(" + size2 + ", calc(" + title.fontSize + " * " + title.lineHeight + "))" : size2;
        const onItem = this.setting("layout", "item-icon-align") === "item";
        const left = this.setting("layout", "item-icon-position") === "left";
        const inset = this.currentFaqStyle === "cards" ? this.itemValueAt("item-padding-x") : 0;
        return {
          ...onItem ? { position: "absolute", top: "50%", translate: "0 -50%", [left ? "left" : "right"]: inset } : {},
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          width: size2,
          height: line,
          "--pw-faq-size": size2,
          color: this.itemColor("item-icon"),
          "--pw-faq-stroke": this.faqStroke,
          transform: open ? this.faqIconKind === "plus" ? "rotate(180deg)" : "rotate(90deg)" : null
        };
      },
      // tagline, heading and text in a card: the element's type, the card's
      // text colours, the preset size step and alignment
      // the gap below a text in the card: to the next one, or (the last) to the link
      cardGapVar(el) {
        const i = this.cardFields.indexOf(el);
        if (i === this.cardFields.length - 1) return "item-cta-gap";
        return el === "tagline" ? "item-tagline-spacing" : el === "heading" ? "item-heading-spacing" : "";
      },
      cardGapAfter(el) {
        const name = this.cardGapVar(el);
        return name ? this.itemValue(name) : 0;
      },
      // its guide colour: tagline violet, heading gold, to the link teal
      cardGapKind(el) {
        return { "item-tagline-spacing": "tagline", "item-heading-spacing": "heading", "item-cta-gap": "cta" }[this.cardGapVar(el)] || "";
      },
      cardFieldText(el, n) {
        if (el === "tagline") return this.$t("prw.preview.tagline");
        if (el === "heading") return this.$t("prw.preview.card.title") + " " + n;
        return this.$t(n === 1 ? "prw.preview.card.textLong" : "prw.preview.card.text");
      },
      cardFieldStyle(el) {
        const style = {
          ...this.typography(el),
          color: this.itemColor("item-" + el + "-text"),
          textAlign: this.preset("item-" + el, "align") || "left",
          margin: 0,
          // the gap below it (with guides a band of its own)
          marginBottom: this.guides ? 0 : this.cardGapAfter(el)
        };
        const size2 = this.preset("item-" + el, "sizes");
        if (size2 && size2 !== "normal") {
          const step = this.sizeStep(el, size2);
          if (step) style.fontSize = step;
        } else if (!style.fontSize) {
          style.fontSize = this.sizeStep(el, "md");
        }
        return style;
      },
      // a column: its vertical position next to the other (start value)
      mcColumnStyle(side) {
        if (!this.mcSide) return null;
        return { alignSelf: { top: "start", middle: "center", bottom: "end" }[this.setting("layout", "multicolumn-" + side)] || "start" };
      },
      // a text in a column: the element's type and colour, the preset size step
      // (headline lg, text normal), its space below (with guides a band instead)
      mcTextStyle(element, spaceOf) {
        const field = { tagline: "tagline", heading: "headline", editor: "text" }[element];
        const style = { ...this.typography(element), color: this.elementColor(element, "element-" + element + "-text"), margin: 0, textAlign: this.preset(field, "align") || "left" };
        const preset = element === "heading" ? this.preset("headline", "sizes") || "lg" : element === "editor" ? this.preset("text", "sizes") || "normal" : "normal";
        if (preset !== "normal") {
          const step = this.sizeStep(element, preset);
          if (step) style.fontSize = step;
        }
        if (spaceOf && !this.guides) style.marginBottom = this.spaceAfter(spaceOf);
        return style;
      },
      fieldStyle(field) {
        const style = {
          ...this.typography(field),
          color: this.elementColor(field, "element-" + field + "-text"),
          textAlign: this.preset(field, "align") || "left",
          margin: 0,
          // (with a band of its own above: none)
          marginTop: this.spaceBand(field) ? 0 : this.gapBefore(field)
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
  var _sfc_render$a = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-element-preview-side pw-block-live-preview", class: { "has-focus": _vm.guides && _vm.highlightsArea }, attrs: { "data-focus": _vm.guides && _vm.highlightsArea ? _vm.highlight : null } }, [_c("div", { staticClass: "pw-preview-switches" }, [_c("div", { staticClass: "pw-pill pw-guides-switch", attrs: { "role": "group" } }, [_c("button", { staticClass: "pw-tool", attrs: { "type": "button", "title": _vm.$t("prw.preview.guides"), "aria-label": _vm.$t("prw.preview.guides"), "aria-pressed": _vm.guides ? "true" : "false" }, on: { "click": _vm.toggleGuides } }, [_c("k-icon", { attrs: { "type": "prw-guides" } })], 1)]), _c("pw-device-select", { attrs: { "value": _vm.bp }, on: { "input": function($event) {
      return _vm.$emit("update:bp", $event);
    } } }), _c("div", { staticClass: "pw-pill pw-preview-bp pw-preview-theme", attrs: { "role": "group" } }, _vm._l(_vm.themes, function(t) {
      return _c("button", { key: "pt-" + t, staticClass: "pw-tool", attrs: { "type": "button", "aria-pressed": _vm.currentTheme === t ? "true" : "false" }, on: { "click": function($event) {
        return _vm.$emit("update:variant", t);
      } } }, [_vm._v(_vm._s(_vm.$t("pw.option." + t)))]);
    }), 0)], 1), _c("div", { staticClass: "pw-block-live-body", style: { backgroundColor: _vm.bodyBackground } }, [_c("div", { staticClass: "pw-block-live-block", class: { "has-guide-top": _vm.blockGuides && _vm.setting("settings", "margin-top") === true, "has-guide-bottom": _vm.blockGuides && _vm.setting("settings", "margin-bottom") === true, "is-fullscreen": _vm.setting("settings", "block-size") === "fullscreen" }, style: _vm.blockStyle }, [_c("section", { staticClass: "pw-block-live-section", class: { "has-guides": _vm.blockGuides, "is-hero": _vm.isHero, "pw-media-preview-photo": _vm.heroImage }, style: _vm.sectionStyle }, [_vm.isHero && _vm.designView ? _c("span", { staticClass: "pw-hero-overlay", style: _vm.heroOverlayStyle, attrs: { "aria-hidden": "true" } }) : _vm._e(), _vm.isHero && _vm.heroBackground === "video" ? _c("span", { staticClass: "pw-hero-video-mark", attrs: { "aria-hidden": "true" } }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "fill": "currentColor" } }, [_c("path", { attrs: { "d": "M8 5v14l11-7z" } })])]) : _vm._e(), _c("div", { staticClass: "pw-block-live-grid", style: _vm.gridStyle }, [_c("div", { staticClass: "pw-block-live-item", style: _vm.itemStyle }, [_vm.isHero && _vm.blockGuides ? _c("span", { staticClass: "pw-hero-pad", style: _vm.heroPadStyle }) : _vm._e(), _c("div", { staticClass: "pw-block-live-content", class: { "is-split": _vm.featureSplit && _vm.hasGrid }, style: _vm.contentStyle }, [_c("div", { staticClass: "pw-block-live-intro" }, [_vm.hasField("tagline") ? _c("p", { style: _vm.fieldStyle("tagline") }, [_vm._v(_vm._s(_vm.$t("prw.preview.tagline")))]) : _vm._e(), _vm.hasField("heading") && _vm.spaceBand("heading") ? _c("div", { staticClass: "pw-space-band", class: ["is-" + _vm.spaceBand("heading").prev, { "is-hot": _vm.highlight === _vm.spaceBand("heading").prev + "-spacing" }], style: { height: _vm.spaceBand("heading").height } }) : _vm._e(), _vm.hasField("heading") ? _c("div", { style: _vm.fieldStyle("heading") }, [_vm._v(_vm._s(_vm.$t("prw.preview.heading")))]) : _vm._e(), _vm.hasField("editor") && _vm.spaceBand("editor") ? _c("div", { staticClass: "pw-space-band", class: ["is-" + _vm.spaceBand("editor").prev, { "is-hot": _vm.highlight === _vm.spaceBand("editor").prev + "-spacing" }], style: { height: _vm.spaceBand("editor").height } }) : _vm._e(), _vm.hasField("editor") ? _c("p", { staticClass: "pw-block-live-text", style: _vm.fieldStyle("editor") }, [_vm._v(_vm._s(_vm.$t("prw.preview.text.before")) + " "), _c("a", { staticClass: "pw-block-live-link", style: _vm.linkStyle, attrs: { "data-decoration": _vm.linkValue("block-link-decoration") || "none" } }, [_vm._v(_vm._s(_vm.$t("prw.preview.text.link")))]), _vm._v(_vm._s(_vm.$t("prw.preview.text.after")))]) : _vm._e()]), _vm.featureSplit && _vm.hasGrid && _vm.guides ? _c("span", { staticClass: "pw-featurelist-offset-gap", class: { "is-hot": _vm.highlight === "item-offset-gap" } }) : _vm._e(), _vm.isQuote ? _c("figure", { staticClass: "pw-quote-preview" }, [_c("blockquote", { style: _vm.quoteStyle }, [_vm._v(_vm._s(_vm.quoteText))]), _vm.hasField("author") ? _c("figcaption", [_c("cite", { style: _vm.citeStyle }, [_vm._v(_vm._s(_vm.$t("prw.sample.cite")))])]) : _vm._e()]) : _vm._e(), _vm.isMedia && _vm.hasField("media") && _vm.guides && _vm.mediaTextGap ? _c("div", { staticClass: "pw-logocloud-text-gap", class: { "is-hot": _vm.highlight === "item-text-gap" }, style: { height: _vm.mediaTextGap } }) : _vm._e(), _vm.isMedia && _vm.hasField("media") ? _c("div", { staticClass: "pw-media-preview-img pw-media-preview-photo", style: _vm.mediaStyle }) : _vm._e(), _vm.isLogocloud && _vm.guides && _vm.logosTextGap ? _c("div", { staticClass: "pw-logocloud-text-gap", class: { "is-hot": _vm.highlight === "item-text-gap" }, style: { height: _vm.logosTextGap } }) : _vm._e(), _vm.isLogocloud ? _c("div", { staticClass: "pw-logocloud-preview", class: { "has-guides": _vm.guides, "is-flexible": _vm.logosFlexible, "is-hot-gap": _vm.highlight === "item-gap", "is-hot-row-gap": _vm.highlight === "item-row-gap" }, style: _vm.logosStyle }, [_vm._l(_vm.dummyLogos, function(logo, index) {
      return _c("div", { key: "logo-" + index, staticClass: "pw-logocloud-item", style: _vm.logoTileStyle(index) }, [_c("svg", { style: { aspectRatio: logo[0] + " / " + logo[1] }, attrs: { "viewBox": "0 0 " + logo[0] + " " + logo[1], "aria-hidden": "true" }, domProps: { "innerHTML": _vm._s(logo[2]) } }), _vm.guides ? _c("span", { staticClass: "pw-logocloud-pad", style: { inset: _vm.logoPadding } }) : _vm._e(), _vm.guides ? _c("span", { staticClass: "pw-logocloud-box", style: _vm.logoBoxStyle }) : _vm._e()]);
    }), _vm.guides && !_vm.logosFlexible ? [_c("span", { staticClass: "pw-logocloud-gap is-column", class: { "is-hot": _vm.highlight === "item-gap" }, staticStyle: { "grid-area": "1 / 2 / 4 / 3" } }), _c("span", { staticClass: "pw-logocloud-gap is-row", class: { "is-hot": _vm.highlight === "item-row-gap" }, staticStyle: { "grid-area": "2 / 1 / 3 / 4" } })] : _vm._e()], 2) : _vm._e(), _vm.hasField("buttons") && _vm.spaceBand("buttons") ? _c("div", { staticClass: "pw-space-band", class: ["is-" + _vm.spaceBand("buttons").prev, { "is-hot": _vm.highlight === _vm.spaceBand("buttons").prev + "-spacing" }], style: { height: _vm.spaceBand("buttons").height } }) : _vm._e(), _vm.hasField("buttons") ? _c("div", { style: _vm.buttonsStyle }, [_c("span", { style: _vm.buttonStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.button")))])]) : _vm._e(), _vm.isCardlets && _vm.guides && _vm.cardTextGap ? _c("div", { staticClass: "pw-logocloud-text-gap", class: { "is-hot": _vm.highlight === "item-text-gap" }, style: { height: _vm.cardTextGap } }) : _vm._e(), _vm.isCardlets ? _c("div", { staticClass: "pw-cardlets-items pw-featurelist-items", class: { "is-row": _vm.cardColumns > 1 }, style: _vm.cardItemsStyle }, [_vm._l(2, function(n) {
      return [_vm.guides && n > 1 ? _c("span", { key: "card-gap-" + n, staticClass: "pw-featurelist-gap", class: { "is-hot": _vm.highlight === "item-gap" }, style: _vm.cardColumns > 1 ? { width: _vm.itemValueAt("item-gap") } : { height: _vm.itemValueAt("item-gap") } }) : _vm._e(), _c("div", { key: "card-" + n, staticClass: "pw-cardlets-item", style: _vm.cardStyle }, [_c("div", { staticClass: "pw-cardlets-image-wrap", class: { "is-overhang": _vm.cardOverhang } }, [_vm.cardOverhang ? _c("span", { staticClass: "pw-cardlets-overhang", style: _vm.cardOverhangStyle }) : _vm._e(), _vm.cardOverhang && _vm.guides ? _c("span", { staticClass: "pw-card-overhang", class: { "is-hot": _vm.highlight === "item-overhang" }, style: { height: _vm.itemValueAt("item-overhang") } }) : _vm._e(), _c("div", { staticClass: "pw-media-preview-photo pw-cardlets-image", class: { "is-overlay": _vm.cardOverlay, "is-cutout": _vm.cardOverhang }, style: _vm.cardImageStyle })]), _vm.cardOverlay ? _c("div", { staticClass: "pw-cardlets-overlay", style: _vm.cardOverlayStyle }) : _vm._e(), _c("div", { staticClass: "pw-cardlets-content", class: { "has-pad-guides": _vm.guides, "is-hot-x": _vm.highlight === "item-padding-x", "is-hot-y": _vm.highlight === "item-padding-y" }, style: _vm.cardContentStyle }, [_vm._l(_vm.cardFields, function(el) {
        return [_c("div", { key: "cf-" + el, style: _vm.cardFieldStyle(el) }, [_vm._v(_vm._s(_vm.cardFieldText(el, n)))]), _vm.guides && _vm.cardGapAfter(el) ? _c("span", { key: "cg-" + el, staticClass: "pw-card-gap", class: ["is-" + _vm.cardGapKind(el), { "is-hot": _vm.highlight === _vm.cardGapVar(el) }], style: { height: _vm.cardGapAfter(el) } }) : _vm._e()];
      }), _c("span", { staticClass: "pw-cardlets-cta", style: _vm.cardCtaStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.card.cta"))), _vm.cardCtaIcon ? _c("svg", { attrs: { "viewBox": "0 0 24 24", "aria-hidden": "true" }, domProps: { "innerHTML": _vm._s(_vm.cardCtaIcon) } }) : _vm._e()])], 2)])];
    })], 2) : _vm._e(), _vm.isMulticolumn ? _c("div", { staticClass: "pw-mc-preview", style: _vm.mcStyle }, [_c("div", { staticClass: "pw-mc-column", style: _vm.mcColumnStyle("left") }, [_c("div", { style: _vm.mcTextStyle("tagline", "tagline") }, [_vm._v(_vm._s(_vm.$t("prw.preview.tagline")))]), _vm.guides ? _c("span", { staticClass: "pw-mc-band is-tagline", class: { "is-hot": _vm.highlight === "tagline-spacing" }, style: { height: _vm.spaceAfter("tagline") } }) : _vm._e(), _c("div", { style: _vm.mcTextStyle("heading", "heading") }, [_vm._v(_vm._s(_vm.$t("prw.preview.heading")))]), _vm.guides ? _c("span", { staticClass: "pw-mc-band is-heading", class: { "is-hot": _vm.highlight === "heading-spacing" }, style: { height: _vm.spaceAfter("heading") } }) : _vm._e(), _c("p", { style: _vm.mcTextStyle("editor", "editor") }, [_vm._v(_vm._s(_vm.$t("prw.preview.card.textLong")))]), _vm.guides ? _c("span", { staticClass: "pw-mc-band is-editor", class: { "is-hot": _vm.highlight === "editor-spacing" }, style: { height: _vm.spaceAfter("editor") } }) : _vm._e(), _c("ul", { staticClass: "pw-mc-list", style: _vm.mcListStyle }, _vm._l(2, function(n) {
      return _c("li", { key: "mcl-" + n }, [_vm._v(_vm._s(_vm.$t("prw.preview.list." + n)))]);
    }), 0), _vm.guides ? _c("span", { staticClass: "pw-mc-band is-list", class: { "is-hot": _vm.highlight === "list-spacing" }, style: { height: _vm.mcListSpacing, fontSize: _vm.mcListStyle.fontSize } }) : _vm._e(), _c("p", { style: _vm.mcTextStyle("editor", null) }, [_vm._v(_vm._s(_vm.$t("prw.preview.mc.text")))])]), _vm.guides ? _c("span", { staticClass: "pw-mc-gap", class: { "is-row": !_vm.mcSide, "is-hot": _vm.highlight === (_vm.mcSide ? "column-gap" : "row-gap") }, style: _vm.mcSide ? null : { height: _vm.itemValueAt("row-gap") } }) : _vm._e(), _c("div", { staticClass: "pw-mc-column", style: _vm.mcColumnStyle("right") }, [_c("blockquote", { staticClass: "pw-mc-quote", style: _vm.mcQuoteStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.quote")))]), _vm.guides ? _c("span", { staticClass: "pw-mc-band is-quote", class: { "is-hot": _vm.highlight === "quote-spacing" }, style: { height: _vm.spaceAfter("quote") } }) : _vm._e(), _c("div", { staticClass: "pw-media-preview-photo pw-mc-image", style: { marginBottom: _vm.guides ? 0 : _vm.spaceAfter("media") } }), _vm.guides ? _c("span", { staticClass: "pw-mc-band is-media", class: { "is-hot": _vm.highlight === "media-spacing" }, style: { height: _vm.spaceAfter("media") } }) : _vm._e(), _c("div", { style: { marginBottom: _vm.guides ? 0 : _vm.spaceAfter("button"), textAlign: _vm.preset("button", "align") || "left" } }, [_c("span", { style: _vm.buttonStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.button")))])]), _vm.guides ? _c("span", { staticClass: "pw-mc-band is-button", class: { "is-hot": _vm.highlight === "button-spacing" }, style: { height: _vm.spaceAfter("button") } }) : _vm._e(), _c("p", { style: _vm.mcTextStyle("editor", null) }, [_vm._v(_vm._s(_vm.$t("prw.preview.mc.text")))])])]) : _vm._e(), _vm.isFeaturelist && _vm.guides && _vm.featureTextGap ? _c("div", { staticClass: "pw-logocloud-text-gap", class: { "is-hot": _vm.highlight === "item-text-gap" }, style: { height: _vm.featureTextGap } }) : _vm._e(), _vm.isFeaturelist ? _c("div", { staticClass: "pw-featurelist-items", class: { "has-guides": _vm.guides, "is-row": _vm.featureColumns > 1 }, style: _vm.featureItemsStyle }, [_vm._l(2, function(n) {
      return [_vm.guides && n > 1 ? _c("span", { key: "feature-gap-" + n, staticClass: "pw-featurelist-gap", class: { "is-hot": _vm.highlight === "item-gap" }, style: _vm.featureGapStyle }) : _vm._e(), _c("div", { key: "feature-" + n, staticClass: "pw-featurelist-item", class: { "is-top": _vm.featureIconTop }, style: _vm.featureItemStyle }, [!_vm.featureNoIcon ? _c("div", { staticClass: "pw-featurelist-icon", style: _vm.featureIconStyle }, [_c("svg", { style: _vm.featureSvgStyle, attrs: { "viewBox": "0 0 24 24", "aria-hidden": "true" } }, [_c("path", { attrs: { "d": _vm.featureIcons[n - 1] } })]), _vm.guides && _vm.featureTile ? _c("span", { staticClass: "pw-featurelist-pad", style: { inset: _vm.itemValue("item-icon-tile-padding") } }) : _vm._e()]) : _vm._e(), _vm.guides && !_vm.featureNoIcon ? _c("span", { staticClass: "pw-featurelist-icon-gap", class: { "is-hot": _vm.highlight === "item-icon-gap" }, style: _vm.featureIconGapStyle }) : _vm._e(), _c("div", { staticClass: "pw-featurelist-content" }, [_vm.featureTitleInline ? _c("div", { style: _vm.featureTextStyle }, [_c("strong", { style: _vm.featureTitleInlineStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.feature.title")) + " " + _vm._s(n) + ".")]), _vm._v(" " + _vm._s(_vm.$t("prw.preview.feature.text")))]) : [_c("div", { style: _vm.featureTitleStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.feature.title")) + " " + _vm._s(n))]), _vm.guides ? _c("span", { staticClass: "pw-featurelist-title-gap", class: { "is-hot": _vm.highlight === "item-title-spacing" }, style: { height: _vm.entryValue("item-title-spacing") } }) : _vm._e(), _c("div", { style: _vm.featureTextBelowStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.feature.text")))])]], 2)])];
    })], 2) : _vm._e(), _vm.isFaq && _vm.guides && _vm.faqTextGap ? _c("div", { staticClass: "pw-logocloud-text-gap", class: { "is-hot": _vm.highlight === "item-text-gap" }, style: { height: _vm.faqTextGap } }) : _vm._e(), _vm.isFaq ? _c("div", { staticClass: "pw-faq-preview", style: _vm.faqListStyle }, _vm._l(3, function(n) {
      return _c("div", { key: "faq-" + n, staticClass: "pw-faq-item", style: _vm.faqItemStyle(n) }, [_vm.guides && _vm.currentFaqStyle === "cards" ? _c("span", { staticClass: "pw-faq-pad-x", class: { "is-hot": _vm.highlight === "item-padding-x" }, style: { inset: "0 " + _vm.itemValueAt("item-padding-x") } }) : _vm._e(), _vm.guides ? _c("span", { staticClass: "pw-faq-pad-y", class: { "is-hot": _vm.highlight === "item-padding-y" }, style: { inset: _vm.itemValueAt("item-padding-y") + " 0" } }) : _vm._e(), _c("div", { staticClass: "pw-faq-summary", style: _vm.faqSummaryStyle }, [_c("div", { style: _vm.faqQuestionStyle }, [_vm._v(_vm._s(_vm.faqSampleQuestion(n)))]), _vm.faqIconSvg && !_vm.faqAlwaysOpen ? _c("span", { staticClass: "pw-faq-icon", class: { "is-open": _vm.faqOpen(n) }, style: _vm.faqIconStyle(_vm.faqOpen(n)), attrs: { "data-kind": _vm.faqIconKind }, domProps: { "innerHTML": _vm._s(_vm.faqIconSvg) } }) : _vm._e()]), _vm.faqOpen(n) ? _c("div", { style: { ..._vm.faqAnswerStyle, position: "relative" } }, [_vm.guides ? _c("span", { staticClass: "pw-faq-answer-gap", class: { "is-hot": _vm.highlight === "item-answer-gap" }, style: { top: "calc(-1 * " + (_vm.itemValue("item-answer-gap") || "0rem") + ")", height: _vm.itemValue("item-answer-gap") || "0rem" } }) : _vm._e(), _vm._v(" " + _vm._s(_vm.$t("prw.preview.faq.answer")) + " ")]) : _vm._e()]);
    }), 0) : _vm._e(), _vm.isSteplist && _vm.guides && _vm.stepTextGap ? _c("div", { staticClass: "pw-logocloud-text-gap", class: { "is-hot": _vm.highlight === "item-text-gap" }, style: { height: _vm.stepTextGap } }) : _vm._e(), _vm.isSteplist ? _c("div", { staticClass: "pw-steplist-items", class: { "has-guides": _vm.guides, "is-row": _vm.stepColumns > 1 }, style: _vm.stepItemsStyle }, [_vm._l(_vm.stepCount, function(n) {
      return [_vm.guides && n > 1 ? _c("span", { key: "step-gap-" + n, staticClass: "pw-steplist-step-gap", class: { "is-hot": _vm.highlight === "item-gap" }, style: _vm.stepStepGapStyle }) : _vm._e(), _c("div", { key: "step-" + n, staticClass: "pw-steplist-item", class: { "is-connected": _vm.currentStepStyle === "connected", "is-centered": _vm.currentStepStyle === "centered" }, style: _vm.stepItemStyle }, [_vm.currentStepStyle === "connected" ? _c("span", { staticClass: "pw-steplist-connector", style: _vm.stepConnectorStyle(n) }) : _vm._e(), _c("div", { staticClass: "pw-steplist-number", style: _vm.stepNumberStyle }, [_vm._v(_vm._s(n))]), _vm.guides ? _c("span", { staticClass: "pw-steplist-gap", class: { "is-hot": _vm.highlight && _vm.highlight.startsWith("item-content-gap") }, style: _vm.stepGapStyle }) : _vm._e(), _c("div", { staticClass: "pw-steplist-content" }, [_c("div", { style: _vm.stepHeadingStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.step.title")) + " " + _vm._s(n))]), _vm.guides ? _c("span", { staticClass: "pw-featurelist-title-gap", class: { "is-hot": _vm.highlight === "item-title-spacing" }, style: { height: _vm.entryValue("item-title-spacing") } }) : _vm._e(), _c("div", { style: _vm.stepTextStyle }, [_vm._v(_vm._s(_vm.$t("prw.preview.step.text")))])])])];
    })], 2) : _vm._e()])])])])])])]);
  };
  var _sfc_staticRenderFns$a = [];
  _sfc_render$a._withStripped = true;
  var __component__$a = /* @__PURE__ */ normalizeComponent(
    _sfc_main$a,
    _sfc_render$a,
    _sfc_staticRenderFns$a
  );
  __component__$a.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BlockPreview.vue";
  const BlockPreview = __component__$a.exports;
  const _sfc_main$9 = {
    props: {
      // the block's content (mediatype, image, slideshow, video, videourl …)
      content: { type: Object, default: () => ({}) },
      // size, alignment, corners and the gap above (PanelRender)
      boxStyle: { type: Object, default: () => ({}) },
      captionStyle: { type: Object, default: () => ({}) }
    },
    data() {
      return { meta: {} };
    },
    computed: {
      kind() {
        return this.content.mediatype || "image";
      },
      files() {
        const list = this.content[this.kind === "slideshow" ? "slideshow" : this.kind];
        return Array.isArray(list) ? list.filter(Boolean) : [];
      },
      // the image, the slideshow's first one, the video file
      file() {
        if (this.kind === "video" && this.content.videosource === "external") return null;
        return this.files[0] || null;
      },
      externalUrl() {
        return this.kind === "video" && this.content.videosource === "external" ? String(this.content.videourl || "") : "";
      },
      externalHost() {
        try {
          return new URL(this.externalUrl).hostname.replace(/^www\./, "");
        } catch (e) {
          return "";
        }
      },
      srcset() {
        const f = this.file || {};
        return f.image && f.image.srcset || null;
      },
      round() {
        return this.content.mediaradius === "round";
      },
      // ratio and crop: the file's (round: square, cropped); an external
      // video 16:9
      ratio() {
        if (this.round) return "1/1";
        if (this.externalUrl) return "16/9";
        const r = this.kind === "video" ? this.meta.videoratio : this.meta.imageratio;
        return r && r !== "auto" ? r : "";
      },
      crop() {
        return this.round || this.kind !== "video" && (this.meta.imagecrop === true || this.meta.imagecrop === "true");
      },
      figureStyle() {
        return {
          margin: 0,
          overflow: "hidden",
          borderRadius: this.round ? "9999px" : this.boxStyle.borderRadius
        };
      },
      frameStyle() {
        return this.ratio ? { aspectRatio: this.ratio.replace("/", " / "), overflow: "hidden" } : {};
      },
      fitStyle() {
        if (!this.ratio) return { display: "block", width: "100%", height: "auto" };
        return {
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: this.crop ? "cover" : "contain",
          objectPosition: this.crop ? this.meta.focus || "50% 50%" : null
        };
      },
      caption() {
        return this.kind === "image" ? String(this.meta.imagecaption || "").trim() : "";
      }
    },
    watch: {
      // (another file chosen: its values)
      "file.link": {
        immediate: true,
        handler() {
          this.load();
        }
      }
    },
    methods: {
      async load() {
        this.meta = {};
        if (!this.file || !this.file.link) return;
        try {
          const response = await this.$api.get(this.file.link, { select: "content" });
          this.meta = response && response.content || {};
        } catch (e) {
          this.meta = {};
        }
      }
    }
  };
  var _sfc_render$9 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _vm.file || _vm.externalUrl ? _c("div", { staticClass: "pw-panel-media", style: _vm.boxStyle }, [_c("figure", { style: _vm.figureStyle }, [_c("div", { staticClass: "pw-panel-media-frame", style: _vm.frameStyle }, [_vm.kind !== "video" ? _c("img", { style: _vm.fitStyle, attrs: { "src": _vm.file.url, "srcset": _vm.srcset, "alt": "" } }) : _vm.file ? _c("video", { style: _vm.fitStyle, attrs: { "src": _vm.file.url, "preload": "metadata", "muted": "" }, domProps: { "muted": true } }) : _c("div", { staticClass: "pw-panel-media-external" }, [_c("svg", { attrs: { "viewBox": "0 0 24 24", "aria-hidden": "true" } }, [_c("circle", { attrs: { "cx": "12", "cy": "12", "r": "11", "fill": "none", "stroke": "currentColor", "stroke-width": "1.5" } }), _c("polygon", { attrs: { "points": "10,8 17,12 10,16", "fill": "currentColor" } })]), _c("small", [_vm._v(_vm._s(_vm.externalHost))])])]), _vm.caption ? _c("figcaption", { style: _vm.captionStyle }, [_vm._v(_vm._s(_vm.caption))]) : _vm._e()]), _vm.kind === "slideshow" && _vm.files.length > 1 ? _c("div", { staticClass: "pw-panel-media-dots" }, _vm._l(_vm.files, function(f, i) {
      return _c("span", { key: f.id || i, class: { "is-current": i === 0 } });
    }), 0) : _vm._e()]) : _vm._e();
  };
  var _sfc_staticRenderFns$9 = [];
  _sfc_render$9._withStripped = true;
  var __component__$9 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$9,
    _sfc_render$9,
    _sfc_staticRenderFns$9
  );
  __component__$9.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/PanelMedia.vue";
  const PanelMedia = __component__$9.exports;
  const parse = (value) => {
    if (value && typeof value === "object") return value;
    if (typeof value !== "string" || value.trim()[0] !== "{") return {};
    try {
      return JSON.parse(value) || {};
    } catch (e) {
      return {};
    }
  };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const _sfc_main$8 = {
    extends: BlockPreview,
    components: { "pw-panel-media": PanelMedia },
    props: {
      // the block's content (Kirby's block content: fields in lower case)
      content: { type: Object, default: () => ({}) },
      // the grid's columns as lines over the block
      gridLines: { type: Boolean, default: false }
    },
    data() {
      return { cardMeta: {} };
    },
    watch: {
      cardImageLinks: {
        immediate: true,
        handler(links) {
          links.filter((link) => !(link in this.cardMeta)).forEach((link) => this.loadCardMeta(link));
        }
      }
    },
    computed: {
      // the block's own variant (a colour variant no longer active, or the
      // custom colours: the default one)
      currentTheme() {
        const chosen = this.content.theme || this.setting("style", "theme") || "default";
        return this.themes.includes(chosen) ? chosen : "default";
      },
      // custom colours (the block's own): background and text colour from the
      // block, the buttons in the chosen variant's colours, the rest as the
      // default variant – as the frontend's custom-css
      isCustom() {
        return this.content.theme === "custom";
      },
      headingLines() {
        const d = this.fieldData("heading");
        const text = String(d.text || "");
        if (d.multiline !== "enabled") return [text];
        return text.split(/\r\n|\r|\n/).filter((line) => line !== "");
      },
      headingMarked() {
        return this.fieldData("heading").textbackground === "enabled";
      },
      headingStyle() {
        const style = this.fieldStyle("heading");
        if (this.headingMarked) style.lineHeight = this.elementValue("heading", "marked-line-height") || style.lineHeight;
        return style;
      },
      markedStyle() {
        return {
          color: this.elementColor("heading", "element-heading-marked-text"),
          backgroundColor: this.elementColor("heading", "element-heading-marked-background"),
          borderRadius: this.elementValue("heading", "marked-radius")
        };
      },
      flourishStyle() {
        const align = this.preset("heading", "align") || "left";
        return {
          width: this.elementValue("heading", "flourish-width") || "4em",
          height: this.elementValue("heading", "flourish-height") || "0.15em",
          backgroundColor: this.elementColor("heading", "element-heading-flourish-color") || this.elementColor("heading", "element-heading-text"),
          marginTop: this.elementValue("heading", "flourish-margin-top") || "0.5em",
          marginBottom: this.elementValue("heading", "flourish-margin-bottom") || 0,
          marginLeft: align === "left" ? 0 : "auto",
          marginRight: align === "right" ? 0 : "auto",
          fontSize: this.headingStyle.fontSize
        };
      },
      // the text as the frontend has it: the writer's HTML; plain text (and
      // markdown, rarely used) masked with its line breaks
      editorHtml() {
        const d = this.fieldData("editor");
        const mode = d.mode || "textarea";
        const text = String(d[mode] || "");
        if (mode === "writer") return text;
        return esc(text).replace(/\r\n|\r|\n/g, "<br>");
      },
      // the quote: plain text, masked, its line breaks kept; in marks unless
      // the element switches them off
      quoteHtml() {
        const d = this.fieldData("quote");
        const text = String(d[d.mode || "textarea"] || d.textarea || "").trim();
        if (!text) return "";
        const html = esc(text).replace(/\r\n|\r|\n/g, "<br>");
        return this.elementValue("quote", "marks") !== "disabled" ? "„" + html + "“" : html;
      },
      // paragraphs, lists and links in the text (Elements › Text, Lists,
      // Blocks › Links)
      richStyle() {
        const bullet = { disc: "disc", circle: "circle", box: "square", dash: '"–  "', arrow: '"→  "', chevron: '"›  "', check: '"✓  "', star: '"★  "' }[this.elementValue("list", "marker")] || "disc";
        const number = { decimal: "decimal", "decimal-paren": "decimal", "lower-alpha": "lower-alpha", "lower-roman": "lower-roman" }[this.elementValue("list", "number-format")] || "decimal";
        return {
          "--pw-paragraph-gap": this.elementValue("editor", "paragraph-spacing") || "1em",
          "--pw-ul-style": bullet,
          "--pw-ol-style": number,
          "--pw-ul-indent": this.elementValue("list", "indent") || "1.25em",
          "--pw-ol-indent": this.elementValue("list", "number-indent") || "1.5em",
          "--pw-list-gap": this.elementValue("list", "item-spacing") || 0,
          "--pw-list-marker": this.elementColor("list", "element-list-marker") || "currentColor",
          "--pw-list-number": this.elementColor("list", "element-list-number") || "currentColor",
          "--pw-list-marker-size": this.elementValue("list", "marker-size") || "100%",
          // (below a list: the lists' space to what follows)
          "--pw-list-spacing": this.elementValue("list", "spacing") || this.elementValue("editor", "paragraph-spacing") || "1em",
          // the links (Blocks › Links), as variables: the text keeps its own weight
          "--pw-link": this.globalColor("block-link") || "inherit",
          "--pw-link-hover": this.globalColor("block-link-hover") || this.globalColor("block-link") || "inherit",
          "--pw-link-decoration": (this.linkValue("block-link-decoration") || "none") === "none" ? "none" : "underline",
          "--pw-link-weight": this.linkValue("block-link-weight") === "bold" ? 700 : "inherit",
          "--pw-link-thickness": this.linkValue("block-link-thickness") || "auto",
          "--pw-link-offset": this.linkValue("block-link-offset") || "auto"
        };
      },
      // the media's box: the block's size (none set: full width) and
      // alignment, the corners switched on with the element's radii, the gap
      // to the intro above
      panelMediaStyle() {
        const style = { ...this.mediaStyle };
        const widths = { xsmall: "25%", small: "33%", medium: "50%", large: "75%", fullscreen: "100%" };
        style.maxWidth = widths[this.content.mediasize] || "100%";
        return style;
      },
      // the multicolumn's columns with their sub-blocks (an empty one left out,
      // as the snippet)
      mcColumns() {
        if (!this.isMulticolumn) return [];
        return ["left", "right"].map((side) => ({ side, items: (Array.isArray(this.content["blocks" + side]) ? this.content["blocks" + side] : []).filter((item) => item && item.content) })).filter((col) => col.items.length > 0);
      },
      // the distribution at the size shown (the block's own, else the start value)
      mcDist() {
        if (!this.hasGrid) return "";
        return this.content["distribution" + this.bp] || this.setting("layout", "columns-" + this.bp) || "";
      },
      // side by side in the distribution's shares, the column gap between them;
      // else below each other with the row gap
      mcStyle() {
        const m = /^dist-(\d)-(\d)$/.exec(this.mcDist);
        if (!m) return { display: "flex", flexDirection: "column", gap: this.itemValueAt("row-gap") };
        return { display: "grid", gridTemplateColumns: "minmax(0, " + m[1] + "fr) minmax(0, " + m[2] + "fr)", columnGap: this.itemValueAt("column-gap") };
      },
      // the faq's questions: those with a question (as the snippet)
      faqItems() {
        if (!this.isFaq) return [];
        return this.stepItems.filter((item) => String(item.content.question || "").trim() !== "");
      },
      // the cards: those with a text shown (as the snippet)
      panelCards() {
        if (!this.isCardlets) return [];
        return this.stepItems.filter((item) => this.itemCardFields(item).length > 0);
      },
      // the cards' columns at the size shown, as set (XS: one)
      cardColumns() {
        if (!this.hasGrid) return 1;
        return Number(this.setting("layout", "columns-" + this.bp)) || 1;
      },
      // the cards' image files (their settings loaded below)
      cardImageLinks() {
        const files = [...this.panelCards.map((item) => this.cardImage(item)), this.isHero ? this.heroFile : null];
        return files.filter((f) => f && f.link).map((f) => f.link);
      },
      // the hero's background file (image or video)
      heroFile() {
        const list = this.content[this.heroBackground === "video" ? "video" : "image"];
        return Array.isArray(list) ? list[0] || null : null;
      },
      // its picture: filling the hero, at the image's focus, blurred if set
      heroBgStyle() {
        const meta = this.heroFile && this.cardMeta[this.heroFile.link] || {};
        const blur = parseInt(this.content[this.heroBackground === "video" ? "blurvideo" : "blurimage"], 10) || 0;
        return {
          objectPosition: this.heroBackground === "image" ? meta.focus || "50% 50%" : null,
          filter: blur > 0 ? "blur(" + blur + "px)" : null,
          transform: blur > 0 ? "scale(1.05)" : null
        };
      },
      // the overlay: the variant's colour at the block's strength, over the
      // whole hero or as a gradient from one side (as the block's CSS)
      panelHeroOverlayStyle() {
        const type = this.content.overlaytype;
        if (type !== "solid" && type !== "gradient") return null;
        const strength = parseInt(this.content[type === "solid" ? "overlayintensity" : "overlaygradientintensity"], 10) || 0;
        const color = "color-mix(in srgb, " + (this.itemColor("overlay") || "#000000") + " " + strength + "%, transparent)";
        if (type === "solid") return { inset: 0, background: color };
        const side = this.content.overlayposition || "left";
        const own = parseInt(this.content.overlaywidth, 10);
        const size2 = (isNaN(own) ? { small: 25, medium: 50, large: 75, xlarge: 100 }[this.content.overlaysize] || 50 : own) + "%";
        const across = side === "left" || side === "right";
        const base = this.itemColor("overlay") || "#000000";
        const stops = [[1, 0], [1, 35], [0.85, 45], [0.62, 55], [0.4, 65], [0.2, 75], [0.07, 87]].map(([k, at]) => "color-mix(in srgb, " + base + " " + strength * k + "%, transparent) " + at + "%");
        return {
          top: side === "bottom" ? "auto" : 0,
          bottom: side === "top" ? "auto" : 0,
          left: side === "right" ? "auto" : 0,
          right: side === "left" ? "auto" : 0,
          width: across ? size2 : "100%",
          height: across ? "100%" : size2,
          background: "linear-gradient(to " + { left: "right", right: "left", top: "bottom", bottom: "top" }[side] + ", " + stops.join(", ") + ", transparent 100%)"
        };
      },
      // the logocloud's logos (its files field)
      panelLogos() {
        const logos = Array.isArray(this.content.logos) ? this.content.logos : [];
        return logos.filter((logo) => logo && logo.url);
      },
      // the logos' row, as the block's CSS: at most "per row" tiles wide
      // (flexible: no limit), wrapping, aligned as set; the gap to the intro
      panelLogosStyle() {
        const size2 = this.itemValueAt("item-size") || "8rem";
        const gap = this.itemValue("item-gap") || "1.5rem";
        const rowGap = this.itemValue("item-row-gap") || gap;
        const perRow = Number(this.setting("layout", "logos-" + ({ md: "md", lg: "lg", xl: "xl" }[this.bp] || "sm"))) || 2;
        const align = this.preset("logos", "align") || "center";
        return {
          display: "flex",
          flexWrap: "wrap",
          justifyContent: { left: "flex-start", right: "flex-end" }[align] || "center",
          columnGap: gap,
          rowGap,
          maxWidth: this.logosFlexible ? "none" : "calc(" + perRow + " * " + size2 + " + " + (perRow - 1) + " * " + gap + ")",
          marginLeft: align === "left" ? 0 : "auto",
          marginRight: align === "right" ? 0 : "auto",
          marginTop: this.logosTextGap
        };
      },
      panelLogoStyle() {
        const style = { ...this.logoStyle, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", overflow: "hidden" };
        if (this.logosFlexible) return { ...style, flex: "0 0 auto" };
        return { ...style, flex: "0 0 " + (this.itemValueAt("item-size") || "8rem"), maxWidth: "100%" };
      },
      panelLogoImgStyle() {
        return this.logosFlexible ? { display: "block", width: "auto", maxWidth: "100%", height: "100%", objectFit: "contain" } : { display: "block", width: "100%", height: "100%", objectFit: "contain" };
      },
      // the image's caption (Elements › Caption)
      captionStyle() {
        return {
          ...this.typography("caption"),
          color: this.elementColor("caption", "element-caption-text"),
          marginTop: this.elementValue("caption", "spacing")
        };
      },
      // an entry's description (steplist, featurelist): its paragraphs and
      // lists with the entries' paragraph spacing (Elements › Items), as the
      // frontend – no extra space below a list there
      entryRichStyle() {
        const gap = this.entryValue("item-text-paragraph-spacing") || this.richStyle["--pw-paragraph-gap"];
        return { ...this.richStyle, "--pw-paragraph-gap": gap, "--pw-list-spacing": gap };
      },
      // the steplist's steps (its blocks field)
      stepItems() {
        const items = Array.isArray(this.content.blocks) ? this.content.blocks : [];
        return items.filter((item) => item && item.content);
      },
      // the featurelist's features (its blocks field)
      featureItems() {
        return this.isFeaturelist ? this.stepItems : [];
      },
      // the features' columns at the device shown, as set (mobile: one)
      featureColumns() {
        if (!this.hasGrid) return 1;
        return Number(this.setting("layout", "columns-" + this.bp)) || 1;
      },
      // the icon's size and colour for its own SVG
      featureSvgVars() {
        const s = this.featureSvgStyle;
        return { "--pw-feature-size": s.width, "--pw-feature-fill": s.fill };
      },
      // (the connector ends at the last step shown)
      stepCount() {
        return this.stepItems.length;
      },
      // the buttons: hidden ones faded (so they can still be found), those
      // without a link left out – as the frontend does
      visibleButtons() {
        const buttons = Array.isArray(this.content.buttons) ? this.content.buttons : [];
        return buttons.filter((b) => b && b.content && (b.content.linkinternal || b.content.linkexternal));
      },
      // a button's icon: its own colour, size and gap to the text (Elements ›
      // Buttons), as the frontend's .link-icon
      buttonIconStyle() {
        return {
          color: this.elementColor("button", "element-button-icon") || "currentColor",
          "--pw-icon-size": this.elementValue("button", "icon-size") || "1em",
          gap: this.elementValue("button", "icon-gap") || "0.4em"
        };
      },
      buttonsRowStyle() {
        return {
          ...this.buttonsStyle,
          flexWrap: "wrap",
          columnGap: this.elementValue("button", "gap") || "0.5rem",
          rowGap: this.elementValue("button", "row-gap") || "0.5rem"
        };
      }
    },
    methods: {
      elementColor(element, name) {
        var _a, _b, _c;
        if (this.isCustom) {
          const text = ["element-tagline-text", "element-heading-text", "element-editor-text", "element-list-marker", "element-list-number", "element-quote-text", "element-cite-text"];
          if (text.includes(name) && this.content.textcolor) return this.content.textcolor;
          if (element === "button") {
            const theme = this.themes.includes(this.content.buttonstyle) ? this.content.buttonstyle : "default";
            return ((this.elementOverrides.global || {})[theme] || {})[name] || ((_c = (_b = (_a = this.elementDefaults.button) == null ? void 0 : _a.colors) == null ? void 0 : _b[name]) == null ? void 0 : _c[theme]) || "";
          }
        }
        return BlockPreview.methods.elementColor.call(this, element, name);
      },
      globalColor(name) {
        if (this.isCustom && name === "block-background" && this.content.backgroundcolor) return this.content.backgroundcolor;
        return BlockPreview.methods.globalColor.call(this, name);
      },
      // a field's own data (tagline, heading, editor: pagewizard's JSON)
      fieldData(field) {
        return parse(this.content[field]);
      },
      // a block setting: the block's own (content keys: without hyphens),
      // else the project's start value
      // (a field the block has but left empty – a padding switched off –
      // counts as empty, as in the frontend; only a field it does not have
      // yet takes the start value)
      setting(category, key) {
        const k = key.replace(/-/g, "");
        if (Object.prototype.hasOwnProperty.call(this.content, k) && this.content[k] !== null) return this.content[k];
        return BlockPreview.methods.setting.call(this, category, key);
      },
      // a field's alignment, size, level …: its own, else the start value
      preset(field, prop) {
        if (field === "buttons" && prop === "align") {
          return this.content.buttonsalignment || BlockPreview.methods.preset.call(this, field, prop);
        }
        if (field === "media") {
          const key = { size: "mediasize", align: "mediaalignment", radius: "mediaradius" }[prop] || prop.replace(/-/g, "");
          const own = this.content[key];
          if (own !== void 0 && own !== null && own !== "") return own;
          return BlockPreview.methods.preset.call(this, field, prop);
        }
        if (field === "logos" && prop === "align") {
          return this.content.logosalignment || BlockPreview.methods.preset.call(this, field, prop);
        }
        if (field === "blocks" && prop === "align") {
          return this.content.blocksalignment || BlockPreview.methods.preset.call(this, field, prop);
        }
        const v = this.fieldData(field)[prop === "sizes" ? "size" : prop];
        return v || BlockPreview.methods.preset.call(this, field, prop);
      },
      // a field in the block (switched on for the project) and filled
      hasField(field) {
        if (!BlockPreview.methods.hasField.call(this, field)) return false;
        if (field === "buttons") return this.visibleButtons.length > 0;
        if (field === "editor") {
          const d = this.fieldData("editor");
          return String(d[d.mode || "textarea"] || "").replace(/<[^>]*>/g, "").trim() !== "";
        }
        if (["tagline", "heading", "author"].includes(field)) {
          return String(this.fieldData(field).text || "").replace(/<[^>]*>/g, "").trim() !== "";
        }
        return true;
      },
      // a step's number: counting the shown steps (hidden ones have none)
      stepNumber(index) {
        return this.stepItems.slice(0, index + 1).filter((item) => !item.isHidden).length;
      },
      // a writer's text with something in it
      richFilled(html) {
        return String(html || "").replace(/<[^>]*>/g, "").trim() !== "";
      },
      // a column of the grid the block's content stands on (its size and
      // offset at the device shown)
      gridUsed(n) {
        const size2 = Number(this.setting("grid", "grid-size-" + this.bp)) || 12;
        const offset = Number(this.setting("grid", "grid-offset-" + this.bp)) || 0;
        return n > offset && n <= offset + Math.min(size2, 12 - offset);
      },
      // pagewizard's JSON of a field
      parseJson(value) {
        return parse(value);
      },
      // a sub-block's kind (multicolumnheadlineleft → headline)
      mcKind(item) {
        return String(item.type || "").replace(/^multicolumn/, "").replace(/(left|right)$/, "");
      },
      // a column's vertical place next to the other (the block's own)
      mcColumnStyle(side) {
        if (!this.mcSide) return null;
        const v = this.content[side + "positionvertical"] || this.setting("layout", "multicolumn-" + side);
        return { alignSelf: { top: "start", middle: "center", bottom: "end" }[v] || "start" };
      },
      // the space below a sub-block: the element's (the lists' for a list)
      mcSpace(item) {
        const kind = this.mcKind(item);
        if (kind === "list") return this.mcListSpacing;
        return this.spaceAfter({ headline: "heading", text: "editor" }[kind] || kind);
      },
      mcTaglineStyle(item) {
        const d = parse(item.content.tagline);
        return { ...this.typography("tagline"), color: this.elementColor("tagline", "element-tagline-text"), textAlign: d.align || this.preset("tagline", "align") || "left", margin: 0 };
      },
      mcHeadlineSize(item) {
        const d = parse(item.content.heading);
        return this.sizeStep("heading", d.size || this.preset("headline", "sizes") || "lg");
      },
      mcHeadlineStyle(item) {
        const d = parse(item.content.heading);
        const style = { ...this.typography("heading"), color: this.elementColor("heading", "element-heading-text"), textAlign: d.align || this.preset("headline", "align") || "left", margin: 0 };
        const size2 = this.mcHeadlineSize(item);
        if (size2) style.fontSize = size2;
        if (d.textbackground === "enabled") style.lineHeight = this.elementValue("heading", "marked-line-height") || style.lineHeight;
        return style;
      },
      mcHeadlineHtml(item) {
        const d = parse(item.content.heading);
        const text = String(d.text || "");
        return d.multiline === "enabled" ? text.split(/\r\n|\r|\n/).filter((l) => l !== "").join("<br>") : text;
      },
      mcFlourishStyle(item) {
        const align = parse(item.content.heading).align || this.preset("headline", "align") || "left";
        return { ...this.flourishStyle, fontSize: this.mcHeadlineSize(item) || this.flourishStyle.fontSize, marginLeft: align === "left" ? 0 : "auto", marginRight: align === "right" ? 0 : "auto" };
      },
      mcTextSize(item) {
        const d = parse(item.content.editor);
        const size2 = d.size || this.preset("text", "sizes") || "normal";
        const step = size2 !== "normal" ? this.sizeStep("editor", size2) : "";
        return { ...this.typography("editor"), ...step ? { fontSize: step } : {}, color: this.elementColor("editor", "element-editor-text"), textAlign: d.align || this.preset("text", "align") || "left" };
      },
      mcTextHtml(item) {
        const d = parse(item.content.editor);
        const mode = d.mode || "textarea";
        const text = String(d[mode] || "");
        return mode === "writer" ? text : esc(text).replace(/\r\n|\r|\n/g, "<br>");
      },
      mcListTag(item) {
        return item.content.liststyle === "ordered" ? "ol" : "ul";
      },
      mcListItems(item) {
        let items = item.content.items;
        if (typeof items === "string") {
          try {
            items = JSON.parse(items);
          } catch (e) {
            items = [];
          }
        }
        items = Array.isArray(items) ? items : [];
        return items.map((li) => li && li.text || "").filter((t) => t !== "");
      },
      // the list: its style, alignment and size; marker, indent and gap as
      // the lists (Elements › Lists)
      mcItemListStyle(item) {
        const kind = item.content.liststyle || "bullet";
        const size2 = item.content.listsize || "normal";
        const step = size2 !== "normal" ? this.sizeStep("editor", size2) : "";
        const marker = kind === "none" ? "none" : kind === "ordered" ? { decimal: "decimal", "decimal-paren": "decimal", "lower-alpha": "lower-alpha", "lower-roman": "lower-roman" }[this.elementValue("list", "number-format")] || "decimal" : { disc: "disc", circle: "circle", box: "square", dash: '"–  "', arrow: '"→  "', chevron: '"›  "', check: '"✓  "', star: '"★  "' }[this.elementValue("list", "marker")] || "disc";
        return {
          ...this.typography("editor"),
          ...step ? { fontSize: step } : {},
          color: this.elementColor("editor", "element-editor-text"),
          textAlign: item.content.listalignment || "left",
          margin: 0,
          paddingLeft: kind === "none" ? 0 : this.elementValue("list", kind === "ordered" ? "number-indent" : "indent"),
          listStyleType: marker,
          "--pw-list-gap": this.elementValue("list", "item-spacing") || 0,
          "--pw-list-marker": this.elementColor("list", kind === "ordered" ? "element-list-number" : "element-list-marker") || "currentColor",
          "--pw-list-marker-size": kind === "ordered" ? "100%" : this.elementValue("list", "marker-size") || "100%"
        };
      },
      mcQuoteHtml(item) {
        const d = parse(item.content.quote);
        const text = String(d[d.mode || "textarea"] || d.textarea || d.text || "").trim();
        if (!text) return "";
        const html = esc(text).replace(/\r\n|\r|\n/g, "<br>");
        return this.elementValue("quote", "marks") !== "disabled" ? "„" + html + "“" : html;
      },
      mcItemQuoteStyle(item) {
        const d = parse(item.content.quote);
        const size2 = d.size || this.preset("quote", "sizes") || "lg";
        return { ...this.quoteStyle, fontSize: this.sizeStep("quote", size2) || this.quoteStyle.fontSize, textAlign: d.align || this.quoteStyle.textAlign };
      },
      // a media sub-block's box: its size, alignment and corners
      mcMediaBox(c) {
        var _a, _b, _c;
        const widths = { xsmall: "25%", small: "33%", medium: "50%", large: "75%", fullscreen: "100%" };
        const align = c.mediaalignment || this.preset("media", "align") || "left";
        const def = ((_c = (_b = (_a = this.elementDefaults.media) == null ? void 0 : _a.vars) == null ? void 0 : _b["media-radius"]) == null ? void 0 : _c.value) || [];
        const ov = (this.elementOverrides.global || {})["media-radius"];
        const r = Array.isArray(ov) ? ov : def;
        const on = (v) => v === true || v === "true";
        const corner = (flag, idx) => c.mediaradius === "custom" && on(flag) ? r[idx] || 0 : 0;
        return {
          maxWidth: widths[c.mediasize] || "100%",
          marginLeft: align === "left" ? 0 : "auto",
          marginRight: align === "right" ? 0 : "auto",
          borderRadius: [corner(c.radiustopleft, 0), corner(c.radiustopright, 1), corner(c.radiusbottomright, 3), corner(c.radiusbottomleft, 2)].join(" ")
        };
      },
      // a button's icon on one side (older: one icon field)
      mcButtonIcon(item, side) {
        const c = item.content || {};
        if ((c.iconposition || "") !== side) return "";
        return (side === "left" ? c.iconleft : c.iconright) || c.icon || "";
      },
      // faq: open as the frontend starts – always open: all; else the first
      // when set
      faqOpen(n) {
        if (this.faqAlwaysOpen) return true;
        return n === 1 && this.setting("style", "faq-first-open") === "yes";
      },
      // an answer: the writer's HTML; plain text masked with its breaks
      faqAnswerHtml(item) {
        const d = parse(item.content.answer);
        const mode = d.mode || "textarea";
        const text = String(d[mode] || "");
        if (text.replace(/<[^>]*>/g, "").trim() === "") return "";
        return mode === "writer" ? text : esc(text).replace(/\r\n|\r|\n/g, "<br>");
      },
      // a card's tagline, heading or text (pagewizard's JSON)
      cardJson(item, el) {
        return parse(item.content[{ tagline: "tagline", heading: "heading", editor: "description" }[el]]);
      },
      // the card's texts: switched on for the project and filled
      itemCardFields(item) {
        return ["tagline", "heading", "editor"].filter((el) => {
          if (!this.hasField("item-" + el)) return false;
          const d = this.cardJson(item, el);
          const text = el === "editor" ? d[d.mode || "textarea"] : d.text;
          return String(text || "").replace(/<[^>]*>/g, "").trim() !== "";
        });
      },
      cardImage(item) {
        return Array.isArray(item.content.image) ? item.content.image[0] || null : null;
      },
      cardImageUrl(item) {
        const image = this.cardImage(item);
        return image && image.url ? image.url : "";
      },
      async loadCardMeta(link) {
        this.$set(this.cardMeta, link, {});
        try {
          const response = await this.$api.get(link, { select: "content" });
          this.$set(this.cardMeta, link, response && response.content || {});
        } catch (e) {
        }
      },
      // the card's image as the frontend: the set ratio of the size shown
      // (Original: the file's), above cropped at its focus, standing out the
      // whole cut-out at the bottom; none set: the file's ratio, crop and
      // focus; on the image filling the card
      panelCardImageStyle(item) {
        const image = this.cardImage(item) || {};
        const meta = this.cardMeta[image.link] || {};
        const fileRatio = meta.imageratio && meta.imageratio !== "auto" ? meta.imageratio : "";
        const fileCrop = meta.imagecrop === true || meta.imagecrop === "true";
        const focus = meta.focus || "50% 50%";
        const style = { display: "block", width: "100%" };
        if (this.cardOverlay) {
          return { ...style, position: "absolute", inset: 0, height: "100%", objectFit: "cover", objectPosition: fileCrop ? focus : "center" };
        }
        const key = this.cardOverhang ? "item-cutout-ratio" : "item-image-ratio";
        const set = [key, key + "-lg", key + "-xl"].some((k) => (this.setting("layout", k) || "auto") !== "auto");
        const ratioOf = (r) => r ? { aspectRatio: r.replace("/", " / "), height: "auto" } : { height: "auto" };
        if (set) {
          const own = this.setting("layout", key + ({ lg: "-lg", xl: "-xl" }[this.bp] || "")) || "auto";
          const ratio = own !== "auto" ? own : fileRatio;
          if (this.cardOverhang) return { ...style, ...ratioOf(ratio), objectFit: "contain", objectPosition: "center bottom" };
          return { ...style, ...ratioOf(ratio), objectFit: "cover", objectPosition: focus };
        }
        return { ...style, ...ratioOf(fileRatio), objectFit: fileCrop ? "cover" : "contain", objectPosition: fileCrop ? focus : "center" };
      },
      // a text in the card: as the wizard's, with its own alignment and size;
      // the gap below to the next text, the last one to the link (none
      // without a link)
      panelCardFieldStyle(item, el) {
        const style = this.cardFieldStyle(el);
        const d = this.cardJson(item, el);
        if (d.align) style.textAlign = d.align;
        if (d.size && d.size !== "normal") {
          const step = this.sizeStep(el, d.size);
          if (step) style.fontSize = step;
        }
        const fields = this.itemCardFields(item);
        const last = fields.indexOf(el) === fields.length - 1;
        style.marginBottom = last ? item.content.linkinternal ? this.itemValue("item-cta-gap") : 0 : this.itemValue(el === "tagline" ? "item-tagline-spacing" : "item-heading-spacing");
        return style;
      },
      // the card's text: the writer's HTML; plain text masked with its breaks
      cardEditorHtml(item) {
        const d = this.cardJson(item, "editor");
        const mode = d.mode || "textarea";
        const text = String(d[mode] || "");
        return mode === "writer" ? text : esc(text).replace(/\r\n|\r|\n/g, "<br>");
      },
      // the link: its own alignment
      panelCtaStyle(item) {
        const align = item.content.linkalign || "left";
        return { ...this.cardCtaStyle, alignSelf: { center: "center", right: "flex-end" }[align] || "flex-start" };
      },
      // a feature's title as run-in at the start of its text ("Title. Text …"),
      // in its first paragraph as the snippet does
      featureRunIn(c) {
        const text = String(c.description || "");
        const heading = String(c.heading || "");
        if (!heading) return text;
        const runIn = '<strong class="pw-panel-runin">' + esc(heading) + ".</strong> ";
        const pos = text.indexOf("<p>");
        return pos !== -1 && text.slice(0, pos).trim() === "" ? text.slice(0, pos) + "<p>" + runIn + text.slice(pos + 3) : runIn + text;
      },
      // a button's icon on one side (its position: left or right)
      buttonIcon(button, side) {
        const c = button.content || {};
        if ((c.iconposition || "") !== side) return "";
        return side === "left" ? c.iconleft || "" : c.iconright || "";
      }
    }
  };
  var _sfc_render$8 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-panel-render", style: { backgroundColor: _vm.bodyBackground } }, [_c("div", { staticClass: "pw-block-live-block", class: { "is-fullscreen": _vm.setting("settings", "block-size") === "fullscreen" }, style: _vm.blockStyle }, [_vm.gridLines && _vm.hasGrid ? _c("div", { staticClass: "pw-panel-gridlines", style: { columnGap: _vm.gridStyle.columnGap }, attrs: { "aria-hidden": "true" } }, _vm._l(12, function(n) {
      return _c("span", { key: "gl-" + n, class: { "is-used": _vm.gridUsed(n) } });
    }), 0) : _vm._e(), _c("section", { staticClass: "pw-block-live-section", style: _vm.sectionStyle }, [_vm.isHero ? [_vm.heroBackground === "image" && _vm.heroFile ? _c("img", { staticClass: "pw-panel-hero-bg", style: _vm.heroBgStyle, attrs: { "src": _vm.heroFile.url, "alt": "" } }) : _vm.heroBackground === "video" && _vm.heroFile ? _c("video", { staticClass: "pw-panel-hero-bg", style: _vm.heroBgStyle, attrs: { "src": _vm.heroFile.url, "muted": "", "preload": "metadata" }, domProps: { "muted": true } }) : _vm._e(), _vm.panelHeroOverlayStyle ? _c("span", { staticClass: "pw-panel-hero-overlay", style: _vm.panelHeroOverlayStyle }) : _vm._e()] : _vm._e(), _c("div", { staticClass: "pw-block-live-grid", style: _vm.gridStyle }, [_c("div", { staticClass: "pw-block-live-item", style: _vm.itemStyle }, [_c("div", { staticClass: "pw-block-live-content", style: _vm.contentStyle }, [_c("div", { staticClass: "pw-block-live-intro" }, [_vm.hasField("tagline") ? _c("p", { style: _vm.fieldStyle("tagline"), domProps: { "innerHTML": _vm._s(_vm.fieldData("tagline").text) } }) : _vm._e(), _vm.hasField("heading") ? [_c("div", { style: _vm.headingStyle }, [_vm.headingMarked ? [_vm._l(_vm.headingLines, function(line, i) {
      return [i ? _c("br", { key: "br-" + i }) : _vm._e(), _c("span", { key: "l-" + i, staticClass: "pw-panel-marked", style: _vm.markedStyle, domProps: { "innerHTML": _vm._s(line) } })];
    })] : _c("span", { domProps: { "innerHTML": _vm._s(_vm.headingLines.join("<br>")) } })], 2), _vm.fieldData("heading").flourish === "enabled" ? _c("span", { staticClass: "pw-panel-flourish", style: _vm.flourishStyle }) : _vm._e()] : _vm._e(), _vm.hasField("editor") ? _c("div", { staticClass: "pw-panel-rich", style: { ..._vm.fieldStyle("editor"), ..._vm.richStyle }, domProps: { "innerHTML": _vm._s(_vm.editorHtml) } }) : _vm._e()], 2), _vm.isMedia ? _c("pw-panel-media", { attrs: { "content": _vm.content, "box-style": _vm.panelMediaStyle, "caption-style": _vm.captionStyle } }) : _vm._e(), _vm.isLogocloud && _vm.panelLogos.length ? _c("div", { style: _vm.panelLogosStyle }, _vm._l(_vm.panelLogos, function(logo, i) {
      return _c("div", { key: logo.id || i, style: _vm.panelLogoStyle }, [_c("img", { style: _vm.panelLogoImgStyle, attrs: { "src": logo.url, "alt": "" } })]);
    }), 0) : _vm._e(), _vm.isCardlets && _vm.panelCards.length ? _c("div", { staticClass: "pw-cardlets-items pw-featurelist-items", class: { "is-row": _vm.cardColumns > 1 }, style: _vm.cardItemsStyle }, _vm._l(_vm.panelCards, function(item, i) {
      return _c("div", { key: item.id || i, staticClass: "pw-cardlets-item", class: { "is-hidden": item.isHidden }, style: _vm.cardStyle }, [_vm.cardImageUrl(item) ? _c("div", { staticClass: "pw-cardlets-image-wrap", class: { "is-overhang": _vm.cardOverhang } }, [_vm.cardOverhang ? _c("span", { staticClass: "pw-cardlets-overhang", style: _vm.cardOverhangStyle }) : _vm._e(), _c("img", { staticClass: "pw-panel-card-image", style: _vm.panelCardImageStyle(item), attrs: { "src": _vm.cardImageUrl(item), "alt": "" } })]) : _vm._e(), _vm.cardOverlay ? _c("div", { staticClass: "pw-cardlets-overlay", style: _vm.cardOverlayStyle }) : _vm._e(), _c("div", { staticClass: "pw-cardlets-content", style: _vm.cardContentStyle }, [_vm._l(_vm.itemCardFields(item), function(el) {
        return [el === "editor" ? _c("div", { key: "cf-" + el, staticClass: "pw-panel-rich", style: { ..._vm.panelCardFieldStyle(item, el), ..._vm.richStyle }, domProps: { "innerHTML": _vm._s(_vm.cardEditorHtml(item)) } }) : el === "heading" && _vm.cardJson(item, el).textbackground === "enabled" ? _c("div", { key: "cf-" + el, style: { ..._vm.panelCardFieldStyle(item, el), lineHeight: _vm.elementValue("heading", "marked-line-height") || null } }, [_c("span", { staticClass: "pw-panel-marked", style: _vm.markedStyle, domProps: { "innerHTML": _vm._s(_vm.cardJson(item, el).text) } })]) : _c("div", { key: "cf-" + el, style: _vm.panelCardFieldStyle(item, el), domProps: { "innerHTML": _vm._s(_vm.cardJson(item, el).text) } })];
      }), item.content.linkinternal ? _c("span", { staticClass: "pw-cardlets-cta", style: _vm.panelCtaStyle(item) }, [_vm._v(_vm._s(item.content.linktext || _vm.$t("kirbyblock-cardlets.item.cta"))), _vm.cardCtaIcon ? _c("svg", { attrs: { "viewBox": "0 0 24 24", "aria-hidden": "true" }, domProps: { "innerHTML": _vm._s(_vm.cardCtaIcon) } }) : _vm._e()]) : _vm._e()], 2)]);
    }), 0) : _vm._e(), _vm.isMulticolumn && _vm.mcColumns.length ? _c("div", { staticClass: "pw-mc-preview", style: _vm.mcStyle }, _vm._l(_vm.mcColumns, function(col) {
      return _c("div", { key: col.side, staticClass: "pw-mc-column", style: _vm.mcColumnStyle(col.side) }, _vm._l(col.items, function(item, i) {
        return _c("pw-panel-sub", _vm._b({ key: item.id || i, class: { "is-hidden": item.isHidden }, style: { marginBottom: i < col.items.length - 1 ? _vm.mcSpace(item) : 0 }, attrs: { "item": item } }, "pw-panel-sub", _vm.$props, false));
      }), 1);
    }), 0) : _vm._e(), _vm.isFaq && _vm.faqItems.length ? _c("div", { staticClass: "pw-faq-preview", style: _vm.faqListStyle }, _vm._l(_vm.faqItems, function(item, i) {
      return _c("div", { key: item.id || i, staticClass: "pw-faq-item", class: { "is-hidden": item.isHidden }, style: _vm.faqItemStyle(i + 1) }, [_c("div", { staticClass: "pw-faq-summary", style: _vm.faqSummaryStyle }, [_c("div", { style: _vm.faqQuestionStyle }, [_vm._v(_vm._s(item.content.question))]), _vm.faqIconSvg && !_vm.faqAlwaysOpen ? _c("span", { staticClass: "pw-faq-icon", class: { "is-open": _vm.faqOpen(i + 1) }, style: _vm.faqIconStyle(_vm.faqOpen(i + 1)), attrs: { "data-kind": _vm.faqIconKind }, domProps: { "innerHTML": _vm._s(_vm.faqIconSvg) } }) : _vm._e()]), _vm.faqOpen(i + 1) && _vm.faqAnswerHtml(item) ? _c("div", { staticClass: "pw-panel-rich", style: { ..._vm.faqAnswerStyle, ..._vm.entryRichStyle }, domProps: { "innerHTML": _vm._s(_vm.faqAnswerHtml(item)) } }) : _vm._e()]);
    }), 0) : _vm._e(), _vm.isFeaturelist && _vm.featureItems.length ? _c("div", { staticClass: "pw-featurelist-items", class: { "is-row": _vm.featureColumns > 1 }, style: _vm.featureItemsStyle }, _vm._l(_vm.featureItems, function(item, i) {
      return _c("div", { key: item.id || i, staticClass: "pw-featurelist-item", class: { "is-top": _vm.featureIconTop, "is-hidden": item.isHidden }, style: _vm.featureItemStyle }, [!_vm.featureNoIcon && item.content.icon ? _c("div", { staticClass: "pw-featurelist-icon", style: _vm.featureIconStyle }, [_c("span", { staticClass: "pw-panel-feature-svg", style: _vm.featureSvgVars, domProps: { "innerHTML": _vm._s(item.content.icon) } })]) : _vm._e(), _c("div", { staticClass: "pw-featurelist-content" }, [_vm.featureTitleInline ? _c("div", { staticClass: "pw-panel-rich", style: { ..._vm.featureTextStyle, ..._vm.entryRichStyle, "--pw-runin-font": _vm.featureTitleInlineStyle.fontFamily, "--pw-runin-weight": _vm.featureTitleInlineStyle.fontWeight, "--pw-runin-color": _vm.featureTitleInlineStyle.color }, domProps: { "innerHTML": _vm._s(_vm.featureRunIn(item.content)) } }) : [item.content.heading ? _c("div", { style: _vm.featureTitleStyle }, [_vm._v(_vm._s(item.content.heading))]) : _vm._e(), _vm.richFilled(item.content.description) ? _c("div", { staticClass: "pw-panel-rich", style: { ..._vm.featureTextBelowStyle, ...item.content.heading ? {} : { marginTop: 0 }, ..._vm.entryRichStyle }, domProps: { "innerHTML": _vm._s(item.content.description) } }) : _vm._e()]], 2)]);
    }), 0) : _vm._e(), _vm.isQuote && _vm.quoteHtml ? _c("figure", { staticClass: "pw-panel-quote" }, [_c("blockquote", { style: _vm.quoteStyle, domProps: { "innerHTML": _vm._s(_vm.quoteHtml) } }), _vm.hasField("author") ? _c("figcaption", [_c("cite", { style: _vm.citeStyle }, [_vm._v(_vm._s(_vm.fieldData("author").text))])]) : _vm._e()]) : _vm._e(), _vm.isSteplist && _vm.stepItems.length ? _c("div", { staticClass: "pw-steplist-items", class: { "is-row": _vm.stepColumns > 1 }, style: _vm.stepItemsStyle }, _vm._l(_vm.stepItems, function(item, i) {
      return _c("div", { key: item.id || i, staticClass: "pw-steplist-item", class: { "is-connected": _vm.currentStepStyle === "connected", "is-centered": _vm.currentStepStyle === "centered", "is-hidden": item.isHidden }, style: _vm.stepItemStyle }, [_vm.currentStepStyle === "connected" ? _c("span", { staticClass: "pw-steplist-connector", style: _vm.stepConnectorStyle(i + 1) }) : _vm._e(), _c("div", { staticClass: "pw-steplist-number", style: _vm.stepNumberStyle }, [_vm._v(_vm._s(item.isHidden ? "" : _vm.stepNumber(i)))]), _c("div", { staticClass: "pw-steplist-content" }, [item.content.heading ? _c("div", { style: _vm.stepHeadingStyle }, [_vm._v(_vm._s(item.content.heading))]) : _vm._e(), _vm.richFilled(item.content.description) ? _c("div", { staticClass: "pw-panel-rich", style: { ..._vm.stepTextStyle, ...item.content.heading ? {} : { marginTop: 0 }, ..._vm.entryRichStyle }, domProps: { "innerHTML": _vm._s(item.content.description) } }) : _vm._e()])]);
    }), 0) : _vm._e(), _vm.hasField("buttons") ? _c("div", { style: _vm.buttonsRowStyle }, _vm._l(_vm.visibleButtons, function(button) {
      return _c("span", { key: button.id, staticClass: "pw-panel-button", class: { "is-hidden": button.isHidden }, style: _vm.buttonStyle }, [_vm.buttonIcon(button, "left") ? _c("span", { staticClass: "pw-panel-button-icon", style: { ..._vm.buttonIconStyle, marginRight: _vm.buttonIconStyle.gap }, domProps: { "innerHTML": _vm._s(_vm.buttonIcon(button, "left")) } }) : _vm._e(), _c("span", [_vm._v(_vm._s(button.content.linktext || _vm.$t("pw.field.link-text.placeholder")))]), _vm.buttonIcon(button, "right") ? _c("span", { staticClass: "pw-panel-button-icon", style: { ..._vm.buttonIconStyle, marginLeft: _vm.buttonIconStyle.gap }, domProps: { "innerHTML": _vm._s(_vm.buttonIcon(button, "right")) } }) : _vm._e()]);
    }), 0) : _vm._e()], 1)])])], 2)])]);
  };
  var _sfc_staticRenderFns$8 = [];
  _sfc_render$8._withStripped = true;
  var __component__$8 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$8,
    _sfc_render$8,
    _sfc_staticRenderFns$8
  );
  __component__$8.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/PanelRender.vue";
  const PanelRender = __component__$8.exports;
  function themes(activeVariants) {
    return ["default", ...activeVariants || []];
  }
  function bodyDefaultFont(globalDefaults, globalOverrides) {
    let def = "Inter";
    for (const group of Object.values(globalDefaults || {})) {
      if (group && group.vars && group.vars["font-family-default"]) {
        def = group.vars["font-family-default"].value || def;
      }
    }
    const ov = globalOverrides && globalOverrides.global;
    return ov && ov["font-family-default"] || def;
  }
  function bodyBackground(globalDefaults, globalOverrides) {
    const ov = ((globalOverrides || {}).global || {})["body-background"];
    if (ov) return ov;
    const def = globalDefaults && globalDefaults.colors && globalDefaults.colors.vars && globalDefaults.colors.vars["body-background"];
    return def && def.value || "#E8E8E8";
  }
  const _sfc_main$7 = {
    props: {
      // the block type (pwtext, pwhero …)
      type: { type: String, required: true },
      // the block's content
      content: { type: Object, default: null },
      // a multicolumn sub-block alone ({ type, content }): only it, on the
      // block's background (the drawer)
      sub: { type: Object, default: null }
    },
    computed: {
      state() {
        return previewState();
      },
      data() {
        return this.state.data;
      },
      block() {
        return this.data ? this.data.blocks[this.type] : null;
      },
      themeList() {
        return themes(this.data.variants);
      },
      bodyFont() {
        return bodyDefaultFont(this.data.global.defaults, this.data.global.overrides);
      },
      background() {
        return bodyBackground(this.data.global.defaults, this.data.global.overrides);
      },
      // the device by the browser window, as the frontend and the old
      // preview do: desktop from 1280 px (its grid values), tablet from
      // 1024 px, below as a phone (no grid)
      bp() {
        return shownDevice();
      }
    },
    watch: {
      // (dropped after a save in the wizard: loaded again)
      "state.version"() {
        ensurePreviewData(this.$api);
      }
    },
    created() {
      ensurePreviewData(this.$api);
    },
    methods: {
      // links in the text lead nowhere here (a click selects the block)
      guardLinks(event) {
        if (event.target.closest && event.target.closest("a")) event.preventDefault();
      }
    }
  };
  var _sfc_render$7 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-panel-preview", attrs: { "data-device": !_vm.sub && _vm.state.device && _vm.bp === _vm.state.device ? _vm.state.device : null }, on: { "!click": function($event) {
      return _vm.guardLinks.apply(null, arguments);
    } } }, [_vm.data && _vm.block ? _c(_vm.sub ? "pw-panel-sub" : "pw-panel-render", _vm._b({ tag: "component", attrs: { "block-type": _vm.type, "content": _vm.content || {}, "config": _vm.block.config, "overrides": _vm.block.overrides, "value-defaults": _vm.block.valueDefaults, "value-overrides": _vm.block.valueOverrides, "element-defaults": _vm.data.elements.defaults, "element-overrides": _vm.data.elements.overrides, "global-defaults": _vm.data.global.defaults, "global-overrides": _vm.data.global.overrides, "font-defaults": _vm.data.fontsizes.defaults, "font-overrides": _vm.data.fontsizes.overrides, "fonts": _vm.data.fonts, "body-default-font": _vm.bodyFont, "body-background": _vm.background, "themes": _vm.themeList, "bp": _vm.bp, "guides": false, "with-block-guides": false, "grid-lines": _vm.state.gridLines } }, "component", _vm.sub ? { item: _vm.sub, standalone: true } : {}, false)) : _c("div", { staticClass: "pw-panel-preview-wait" })], 1);
  };
  var _sfc_staticRenderFns$7 = [];
  _sfc_render$7._withStripped = true;
  var __component__$7 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$7,
    _sfc_render$7,
    _sfc_staticRenderFns$7
  );
  __component__$7.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/PanelPreview.vue";
  const PanelPreview = __component__$7.exports;
  const _sfc_main$6 = {
    extends: PanelRender,
    props: {
      // the sub-block: { type, content }
      item: { type: Object, required: true },
      // alone in the drawer (its own background and room)
      standalone: { type: Boolean, default: false }
    },
    computed: {
      standaloneStyle() {
        return {
          backgroundColor: this.globalColor("block-background") || this.bodyBackground,
          padding: "var(--spacing-3)",
          borderRadius: "var(--rounded)",
          colorScheme: "light",
          overflowWrap: "break-word"
        };
      }
    }
  };
  var _sfc_render$6 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("div", { staticClass: "pw-mc-el", class: { "is-standalone": _vm.standalone }, style: _vm.standalone ? _vm.standaloneStyle : null }, [_vm.mcKind(_vm.item) === "tagline" ? _c("p", { style: _vm.mcTaglineStyle(_vm.item), domProps: { "innerHTML": _vm._s(_vm.parseJson(_vm.item.content.tagline).text) } }) : _vm.mcKind(_vm.item) === "headline" ? [_c("div", { style: _vm.mcHeadlineStyle(_vm.item) }, [_vm.parseJson(_vm.item.content.heading).textbackground === "enabled" ? _c("span", { staticClass: "pw-panel-marked", style: _vm.markedStyle, domProps: { "innerHTML": _vm._s(_vm.mcHeadlineHtml(_vm.item)) } }) : _c("span", { domProps: { "innerHTML": _vm._s(_vm.mcHeadlineHtml(_vm.item)) } })]), _vm.parseJson(_vm.item.content.heading).flourish === "enabled" ? _c("span", { staticClass: "pw-panel-flourish", style: _vm.mcFlourishStyle(_vm.item) }) : _vm._e()] : _vm.mcKind(_vm.item) === "text" ? _c("div", { staticClass: "pw-panel-rich", style: { ..._vm.mcTextSize(_vm.item), ..._vm.richStyle }, domProps: { "innerHTML": _vm._s(_vm.mcTextHtml(_vm.item)) } }) : _vm.mcKind(_vm.item) === "list" ? _c(_vm.mcListTag(_vm.item), { tag: "component", staticClass: "pw-panel-mc-list", style: _vm.mcItemListStyle(_vm.item) }, _vm._l(_vm.mcListItems(_vm.item), function(li, n) {
      return _c("li", { key: n }, [_vm._v(_vm._s(li))]);
    }), 0) : _vm.mcKind(_vm.item) === "quote" && _vm.mcQuoteHtml(_vm.item) ? _c("figure", { staticClass: "pw-panel-quote" }, [_c("blockquote", { style: _vm.mcItemQuoteStyle(_vm.item), domProps: { "innerHTML": _vm._s(_vm.mcQuoteHtml(_vm.item)) } }), _vm.parseJson(_vm.item.content.author).text ? _c("figcaption", [_c("cite", { style: { ..._vm.citeStyle, textAlign: _vm.parseJson(_vm.item.content.author).align || _vm.citeStyle.textAlign } }, [_vm._v(_vm._s(_vm.parseJson(_vm.item.content.author).text))])]) : _vm._e()]) : _vm.mcKind(_vm.item) === "media" ? _c("pw-panel-media", { attrs: { "content": _vm.item.content, "box-style": _vm.mcMediaBox(_vm.item.content), "caption-style": _vm.captionStyle } }) : _vm.mcKind(_vm.item) === "button" ? _c("div", { style: { textAlign: _vm.item.content.buttonalignment || _vm.preset("button", "align") || "left" } }, [_c("span", { staticClass: "pw-panel-button", style: _vm.buttonStyle }, [_vm.mcButtonIcon(_vm.item, "left") ? _c("span", { staticClass: "pw-panel-button-icon", style: { ..._vm.buttonIconStyle, marginRight: _vm.buttonIconStyle.gap }, domProps: { "innerHTML": _vm._s(_vm.mcButtonIcon(_vm.item, "left")) } }) : _vm._e(), _c("span", [_vm._v(_vm._s(_vm.item.content.linktext || _vm.$t("pw.field.link-text.placeholder")))]), _vm.mcButtonIcon(_vm.item, "right") ? _c("span", { staticClass: "pw-panel-button-icon", style: { ..._vm.buttonIconStyle, marginLeft: _vm.buttonIconStyle.gap }, domProps: { "innerHTML": _vm._s(_vm.mcButtonIcon(_vm.item, "right")) } }) : _vm._e()])]) : _vm._e()], 2);
  };
  var _sfc_staticRenderFns$6 = [];
  _sfc_render$6._withStripped = true;
  var __component__$6 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$6,
    _sfc_render$6,
    _sfc_staticRenderFns$6
  );
  __component__$6.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/PanelSubBlock.vue";
  const PanelSubBlock = __component__$6.exports;
  const _sfc_main$5 = {
    extends: "k-blocks-field",
    computed: {
      // the menu's entries (a list: Kirby calls an options function with a
      // callback); the one shown marked
      deviceOptions() {
        const widths = { default: "", sm: "≥ 640 px", md: "≥ 768 px", lg: "≥ 1024 px", xl: "≥ 1280 px" };
        return PANEL_SIZES.map((bp) => ({
          value: bp,
          text: this.deviceCode(bp),
          width: widths[bp],
          title: this.deviceLabel(bp),
          current: this.device === bp,
          // (wider than the window: greyed out until it is wide enough)
          disabled: !deviceFits(bp)
        }));
      },
      gridLines() {
        return previewState().gridLines;
      },
      // the device shown: the one chosen, else by the browser window
      device() {
        const state2 = previewState();
        return state2.device || state2.windowDevice ? shownDevice() : "xl";
      }
    },
    mounted() {
      this.$watch(() => this.$refs.blocks && this.$refs.blocks.selected, (now) => {
        if (Array.isArray(now) && now.length === 1) {
          this._lastSelected = now[0];
          return;
        }
        if (Array.isArray(now) && now.length === 0 && this._lastSelected && Date.now() < (this._restoreUntil || 0)) {
          const id = this._lastSelected;
          this.$nextTick(() => {
            if (this.$refs.blocks && this.$refs.blocks.find(id)) this.$refs.blocks.selected = [id];
          });
        }
      });
      this.$watch(() => this.$panel.drawer.isOpen, (open, was) => {
        if (was && !open) this._restoreUntil = Date.now() + 600;
      });
    },
    methods: {
      chooseDevice(bp) {
        setPreviewDevice(bp);
        this.$refs.device.close();
      },
      toggleGridLines() {
        setGridLines(!this.gridLines);
      },
      deviceLabel(bp) {
        return this.$t("prw.panel.size." + bp);
      },
      deviceCode(bp) {
        return { default: "XS", sm: "SM", md: "MD", lg: "LG", xl: "XL" }[bp];
      }
    }
  };
  var _sfc_render$5 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-field", _vm._b({ class: ["k-blocks-field", _vm.$attrs.class], style: _vm.$attrs.style, attrs: { "input": false }, scopedSlots: _vm._u([!_vm.disabled && _vm.hasFieldsets ? { key: "options", fn: function() {
      return [_c("div", { staticClass: "pw-blocks-field-options" }, [_c("k-button", { attrs: { "title": _vm.$t("prw.panel.gridlines"), "aria-pressed": _vm.gridLines ? "true" : "false", "disabled": _vm.device === "default", "theme": _vm.gridLines && _vm.device !== "default" ? "pink" : null, "icon": "prw-guides", "variant": "filled", "size": "xs" }, on: { "click": _vm.toggleGridLines } }), _c("k-button", { attrs: { "text": _vm.deviceCode(_vm.device), "title": _vm.deviceLabel(_vm.device), "dropdown": true, "variant": "filled", "size": "xs" }, on: { "click": function($event) {
        return _vm.$refs.device.toggle();
      } } }), _c("k-dropdown-content", { ref: "device", attrs: { "align-x": "end" } }, _vm._l(_vm.deviceOptions, function(option) {
        return _c("k-dropdown-item", { key: option.value, staticClass: "k-languages-dropdown-item", attrs: { "current": option.current, "disabled": option.disabled, "title": option.title }, on: { "click": function($event) {
          return _vm.chooseDevice(option.value);
        } } }, [_vm._v(" " + _vm._s(option.text) + " "), option.width ? _c("span", { staticClass: "k-languages-dropdown-item-info" }, [_c("span", { staticClass: "k-languages-dropdown-item-code" }, [_vm._v(_vm._s(option.width))])]) : _vm._e()]);
      }), 1), _c("k-button-group", { attrs: { "layout": "collapsed" } }, [_c("k-button", { staticClass: "input-focus", attrs: { "autofocus": _vm.autofocus, "disabled": _vm.isFull, "responsive": true, "text": _vm.$t("add"), "icon": "add", "variant": "filled", "size": "xs" }, on: { "click": function($event) {
        return _vm.$refs.blocks.choose(_vm.value.length);
      } } }), _c("k-button", { attrs: { "title": _vm.$t("options"), "icon": "dots", "variant": "filled", "size": "xs" }, on: { "click": function($event) {
        return _vm.$refs.options.toggle();
      } } }), _c("k-dropdown-content", { ref: "options", attrs: { "options": _vm.options, "align-x": "end" } })], 1)], 1)];
    }, proxy: true } : null], null, true) }, "k-field", _vm.$props, false), [_c("k-input-validator", _vm._b({ attrs: { "value": JSON.stringify(_vm.value) } }, "k-input-validator", { min: _vm.min, max: _vm.max, required: _vm.required }, false), [_c("k-blocks", _vm._b({ ref: "blocks", on: { "close": function($event) {
      _vm.opened = $event;
    }, "open": function($event) {
      _vm.opened = $event;
    }, "input": function($event) {
      return _vm.$emit("input", $event);
    } } }, "k-blocks", _vm.$props, false))], 1), !_vm.disabled && !_vm.isEmpty && !_vm.isFull && _vm.hasFieldsets ? _c("footer", [_c("k-button", { attrs: { "title": _vm.$t("add"), "icon": "add", "size": "xs", "variant": "filled" }, on: { "click": function($event) {
      return _vm.$refs.blocks.choose(_vm.value.length);
    } } })], 1) : _vm._e()], 1);
  };
  var _sfc_staticRenderFns$5 = [];
  _sfc_render$5._withStripped = true;
  var __component__$5 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$5,
    _sfc_render$5,
    _sfc_staticRenderFns$5
  );
  __component__$5.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/BlocksField.vue";
  const BlocksField = __component__$5.exports;
  const _sfc_main$4 = {
    extends: "k-range-field",
    props: {
      // the block whose overlay colour it shows (pwcardlets …)
      block: { type: String, default: "" },
      // the colour's name in its values (cards: item-overlay, hero: overlay)
      swatch: { type: String, default: "item-overlay" }
    },
    computed: {
      blockData() {
        const data = previewState().data;
        return data ? data.blocks[this.block] : null;
      },
      // the form's values: of the fieldset around the field
      formValues() {
        let vm = this.$parent;
        while (vm && vm.$options.name !== "k-fieldset") vm = vm.$parent;
        return vm && vm.value || {};
      },
      // the block's colour variant (custom colours, one no longer active: the
      // default one)
      theme() {
        const data = previewState().data;
        const list = data ? themes(data.variants) : ["default"];
        const chosen = this.formValues.theme || "default";
        return list.includes(chosen) ? chosen : "default";
      },
      // the overlay colour of that variant (the project's, else the plugin's)
      overlayColor() {
        const b = this.blockData;
        if (!b) return "#000000";
        const own = ((b.valueOverrides || {})[this.theme] || {})[this.swatch];
        if (own) return own;
        for (const group of Object.values(b.valueDefaults || {})) {
          if (group && group.colors && group.colors[this.swatch]) return group.colors[this.swatch][this.theme] || "#000000";
        }
        return "#000000";
      },
      // the project's strength (Project Wizard › Cards › Design)
      projectValue() {
        const b = this.blockData;
        if (!b) return null;
        let raw = (b.valueOverrides || {})["item-overlay-strength"];
        if (raw === void 0 || raw === "") {
          for (const group of Object.values(b.valueDefaults || {})) {
            if (group && group.vars && group.vars["item-overlay-strength"]) raw = group.vars["item-overlay-strength"].value;
          }
        }
        const n = parseFloat(raw);
        return isNaN(n) ? null : n;
      },
      // the block's value (a new block starts with the project's); a block
      // from before without one: the project's
      shownValue() {
        return this.value !== null && this.value !== void 0 && this.value !== "" ? this.value : this.projectValue;
      }
    },
    created() {
      ensurePreviewData(this.$api);
    }
  };
  var _sfc_render$4 = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("k-field", _vm._b({ class: ["k-range-field", "pw-overlay-field", _vm.$attrs.class], style: _vm.$attrs.style, attrs: { "input": _vm.id } }, "k-field", _vm.$props, false), [_c("div", { staticClass: "pw-overlay-row" }, [_c("span", { staticClass: "pw-overlay-swatch", style: { backgroundColor: _vm.overlayColor }, attrs: { "title": _vm.overlayColor } }), _c("k-input", _vm._b({ ref: "input", staticClass: "pw-overlay-range", attrs: { "value": _vm.shownValue, "type": "range" }, on: { "input": function($event) {
      return _vm.$emit("input", $event);
    } } }, "k-input", _vm.$props, false))], 1)]);
  };
  var _sfc_staticRenderFns$4 = [];
  _sfc_render$4._withStripped = true;
  var __component__$4 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$4,
    _sfc_render$4,
    _sfc_staticRenderFns$4
  );
  __component__$4.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/OverlayField.vue";
  const OverlayField = __component__$4.exports;
  const _sfc_main$3 = {
    data() {
      return {
        projectName: "",
        valetHost: "",
        isPublic: false,
        // the default languages to choose from (code => name)
        languages: {},
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
        this.languages = res.languages || {};
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
              },
              // the default language (more in the panel later)
              language: {
                type: "select",
                label: this.$t("prw.setup.language"),
                help: this.$t("prw.setup.language.help"),
                options: Object.entries(this.languages).map(([value, text]) => ({ value, text })),
                empty: false,
                required: true
              }
            },
            value: { language: "de" },
            submitButton: {
              text: this.$t("prw.setup.run"),
              theme: "negative"
            }
          },
          on: {
            submit: (value) => {
              this.runSetup(value && value.language || "de");
            },
            cancel: () => {
              this.$panel.dialog.close();
              window.location.href = "/panel";
            }
          }
        });
      },
      async runSetup(language) {
        this.running = true;
        const stepsHtml = [
          "prw.setup.step.clean",
          "prw.setup.step.directories",
          "prw.setup.step.files",
          "prw.setup.step.language",
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
          const res = await this.$api.post("projectwizard/setup/run", { language }, { timeout: 3e5 });
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
  const _sfc_main$1 = {
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
  var _sfc_render$1 = function render() {
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
  var _sfc_staticRenderFns$1 = [];
  _sfc_render$1._withStripped = true;
  var __component__$1 = /* @__PURE__ */ normalizeComponent(
    _sfc_main$1,
    _sfc_render$1,
    _sfc_staticRenderFns$1
  );
  __component__$1.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/DeviceSelect.vue";
  const DeviceSelect = __component__$1.exports;
  const _sfc_main = {
    name: "pw-json-node",
    props: {
      nodeKey: { type: String, required: true },
      // (a block: its name and icon next to its type)
      label: { type: String, default: "" },
      icon: { type: String, default: "" },
      value: { default: null },
      path: { type: Array, default: () => [] },
      depth: { type: Number, default: 0 },
      // the path at the configuration editor's cursor: opened up to it, the
      // entry marked (a list of plain values: the list itself)
      focusPath: { type: Array, default: null }
    },
    data() {
      return { open: false };
    },
    watch: {
      focusPath: {
        immediate: true,
        handler() {
          if (this.focusMatch && this.isBranch) this.open = true;
          if (!this.isFocus && !(this.depth === 0 && this.focusMatch === "exact")) return;
          this.$nextTick(() => {
            if (!this.$refs.row || !window.matchMedia("(min-width: 75rem)").matches) return;
            this.$refs.row.scrollIntoView({ block: "center", behavior: "smooth" });
          });
        }
      }
    },
    computed: {
      // this node on the focus path: the path's end, or on the way to it
      focusMatch() {
        const focus = this.focusPath;
        if (!focus || this.path.length > focus.length) return null;
        if (!this.path.every((key, i) => String(key) === focus[i])) return null;
        return this.path.length === focus.length ? "exact" : "prefix";
      },
      isFocus() {
        return this.depth > 0 && (this.focusMatch === "exact" || this.focusMatch === "prefix" && !this.isBranch);
      },
      // objects open; lists of plain values (options, nodes …) show as one value
      isBranch() {
        if (!this.value || typeof this.value !== "object") return false;
        if (Array.isArray(this.value)) return this.value.some((v) => v && typeof v === "object");
        return Object.keys(this.value).length > 0;
      },
      tokens() {
        const token = (v) => {
          if (v === null) return { type: "null", text: "null" };
          if (typeof v === "string") return { type: "string", text: JSON.stringify(v) };
          if (typeof v === "number") return { type: "number", text: String(v) };
          if (typeof v === "boolean") return { type: "boolean", text: String(v) };
          return { type: null, text: JSON.stringify(v) };
        };
        if (!Array.isArray(this.value)) {
          return this.value && typeof this.value === "object" ? [{ type: "punct", text: "{}" }] : [token(this.value)];
        }
        const out = [{ type: "punct", text: "[" }];
        this.value.forEach((v, i) => {
          if (i) out.push({ type: "punct", text: ", " });
          out.push(token(v));
        });
        out.push({ type: "punct", text: "]" });
        return out;
      },
      count() {
        return Array.isArray(this.value) ? this.value.length : Object.keys(this.value).length;
      }
    }
  };
  var _sfc_render = function render() {
    var _vm = this, _c = _vm._self._c;
    return _c("li", { staticClass: "pw-json-node", class: { "is-block": _vm.depth === 0, "is-section": _vm.depth === 1 } }, [_c("div", { ref: "row", staticClass: "pw-json-row", class: { "is-open": _vm.open, "is-branch": _vm.isBranch, "is-focus": _vm.isFocus }, on: { "click": function($event) {
      _vm.isBranch && (_vm.open = !_vm.open);
    } } }, [_c("span", { staticClass: "pw-json-toggle" }, [_vm.isBranch ? _c("k-icon", { attrs: { "type": _vm.open ? "angle-down" : "angle-right" } }) : _vm._e()], 1), _vm.depth === 0 ? [_c("k-icon", { staticClass: "pw-json-block-icon", attrs: { "type": _vm.icon || "box" } }), _c("span", { staticClass: "pw-json-block-name" }, [_vm._v(_vm._s(_vm.label || _vm.nodeKey))]), _c("code", { staticClass: "pw-json-block-type" }, [_vm._v(_vm._s(_vm.nodeKey))])] : [_c("span", { staticClass: "pw-json-key" }, [_vm._v(_vm._s(_vm.nodeKey))]), !_vm.isBranch ? _c("span", { staticClass: "pw-json-colon" }, [_vm._v(":")]) : _vm._e()], !_vm.isBranch ? _c("span", { staticClass: "pw-json-value" }, _vm._l(_vm.tokens, function(token, i) {
      return _c("span", { key: i, class: token.type ? "is-" + token.type : null }, [_vm._v(_vm._s(token.text))]);
    }), 0) : !_vm.open ? _c("span", { staticClass: "pw-json-count" }, [_vm._v(_vm._s(_vm.count))]) : _vm._e(), _vm.depth > 0 ? _c("button", { staticClass: "pw-json-add", attrs: { "type": "button", "title": _vm.$t("prw.patches.take"), "aria-label": _vm.$t("prw.patches.take") }, on: { "click": function($event) {
      $event.stopPropagation();
      return _vm.$emit("take", { path: _vm.path, value: _vm.value });
    } } }, [_c("k-icon", { attrs: { "type": "add" } })], 1) : _vm._e()], 2), _vm.isBranch && _vm.open ? _c("ul", { staticClass: "pw-json-children" }, _vm._l(_vm.value, function(child, key) {
      return _c("pw-json-node", { key, attrs: { "node-key": String(key), "value": child, "path": [..._vm.path, key], "depth": _vm.depth + 1, "focus-path": _vm.focusPath }, on: { "take": function($event) {
        return _vm.$emit("take", $event);
      } } });
    }), 1) : _vm._e()]);
  };
  var _sfc_staticRenderFns = [];
  _sfc_render._withStripped = true;
  var __component__ = /* @__PURE__ */ normalizeComponent(
    _sfc_main,
    _sfc_render,
    _sfc_staticRenderFns
  );
  __component__.options.__file = "/Users/christian/Projects/pluginsources/kirby-projectwizard/src/views/components/JsonNode.vue";
  const JsonNode = __component__.exports;
  panel.plugin("kirbydesk/kirby-projectwizard", {
    icons: {
      // text transform: glyphs instead of names (as in design tools)
      "prw-case-none": '<rect x="6" y="11" width="12" height="2.2" rx="1.1"/>',
      "prw-case-upper": '<text x="12" y="17.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600">AA</text>',
      "prw-case-lower": '<text x="12" y="17" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600">aa</text>',
      "prw-case-capitalize": '<text x="12" y="17.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15.5" font-weight="600">Aa</text>',
      "prw-step-large": '<path d="M18.2072 9.0428 12.0001 2.83569 5.793 9.0428 7.20721 10.457 12.0001 5.66412 16.793 10.457 18.2072 9.0428ZM5.79285 14.9572 12 21.1643 18.2071 14.9572 16.7928 13.543 12 18.3359 7.20706 13.543 5.79285 14.9572Z"></path>',
      "prw-step-small": '<path d="M5.79285 5.20718 12 11.4143 18.2071 5.20718 16.7928 3.79297 12 8.58586 7.20706 3.79297 5.79285 5.20718ZM18.2072 18.7928 12.0001 12.5857 5.793 18.7928 7.20721 20.207 12.0001 15.4141 16.793 20.207 18.2072 18.7928Z"></path>',
      // the lists' markers (Elements › Lists › Bullets): dot, dash, check
      "prw-marker-disc": '<circle cx="12" cy="12" r="3.5"></circle>',
      "prw-marker-circle": '<path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM12 17.5C8.96243 17.5 6.5 15.0376 6.5 12C6.5 8.96243 8.96243 6.5 12 6.5C15.0376 6.5 17.5 8.96243 17.5 12C17.5 15.0376 15.0376 17.5 12 17.5Z"></path>',
      "prw-marker-box": '<path d="M8.5 8.5H15.5V15.5H8.5V8.5Z"></path>',
      "prw-marker-arrow": '<path d="M16.17 11L10.81 5.64L12.22 4.22L20 12L12.22 19.78L10.81 18.36L16.17 13H4V11H16.17Z"></path>',
      "prw-marker-chevron": '<path d="M13.17 12L8.22 7.05L9.64 5.64L16 12L9.64 18.36L8.22 16.95L13.17 12Z"></path>',
      "prw-marker-star": '<path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"></path>',
      "prw-marker-dash": '<path d="M6 11H18V13H6V11Z"></path>',
      "prw-marker-check": '<path d="M10 15.17L19.19 5.98L20.61 7.39L10 18L3.64 11.64L5.05 10.22L10 15.17Z"></path>',
      // the lists (Elements › Lists): points with lines
      "prw-list": '<path d="M8 4H21V6H8V4ZM3 3.5H6V6.5H3V3.5ZM3 10.5H6V13.5H3V10.5ZM3 17.5H6V20.5H3V17.5ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z"></path>',
      // the entries (Elements › Entries): shapes with lines
      "prw-entries": '<path d="M13 4H21V6H13V4ZM13 11H21V13H13V11ZM13 18H21V20H13V18ZM6.5 19C5.39543 19 4.5 18.1046 4.5 17C4.5 15.8954 5.39543 15 6.5 15C7.60457 15 8.5 15.8954 8.5 17C8.5 18.1046 7.60457 19 6.5 19ZM6.5 21C8.70914 21 10.5 19.2091 10.5 17C10.5 14.7909 8.70914 13 6.5 13C4.29086 13 2.5 14.7909 2.5 17C2.5 19.2091 4.29086 21 6.5 21ZM5 6V9H8V6H5ZM3 4H10V11H3V4Z"></path>',
      // the design tab: pencil and ruler
      "prw-design": '<path d="M5 8V20H9V8H5ZM3 7L7 2L11 7V22H3V7ZM19 16V14H16V12H19V10H17V8H19V6H15V20H19V18H17V16H19ZM14 4H20C20.5523 4 21 4.44772 21 5V21C21 21.5523 20.5523 22 20 22H14C13.4477 22 13 21.5523 13 21V5C13 4.44772 13.4477 4 14 4Z"></path>',
      "prw-guides": '<path d="M8 8V16H16V8H8ZM6 6H18V18H6V6ZM6 2H8V5H6V2ZM6 19H8V22H6V19ZM2 6H5V8H2V6ZM2 16H5V18H2V16ZM19 6H22V8H19V6ZM19 16H22V18H19V16ZM16 2H18V5H16V2ZM16 19H18V22H16V19Z"></path>',
      "prw-header": '<path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM18 7V9H6V7H18Z"></path>',
      // expand / collapse all (Remix add-box-line, checkbox-indeterminate-line)
      "prw-expand": '<path d="M4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM5 5V19H19V5H5ZM11 11V7H13V11H17V13H13V17H11V13H7V11H11Z"></path>',
      "prw-collapse": '<path d="M4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM5 5V19H19V5H5ZM7 11H17V13H7V11Z"></path>',
      "prw-footer": '<path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM4 16V19H20V16H4ZM4 14H20V5H4V14Z"></path>'
    },
    // the pages' blocks field (pagewizard's pwblocks): the device of the
    // block previews next to "Add" – Kirby's own blocks field stays untouched
    fields: {
      pwblocks: BlocksField,
      // the overlay's strength: a range with the block's overlay colour
      pwoverlay: OverlayField
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
      "pw-device-select": DeviceSelect,
      "pw-json-node": JsonNode,
      "pw-lock": Lock,
      "pw-translate-node": TranslateNode,
      "pw-batch-dialog": BatchDialog,
      // the block previews on the pages (used by the block plugins)
      "pw-panel-render": PanelRender,
      "pw-block-panel-preview": PanelPreview,
      // a multicolumn sub-block (preview columns, drawer)
      "pw-panel-sub": PanelSubBlock
    }
  });
})();
