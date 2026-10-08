import {
  defaultSchema
} from "./chunks/chunk-CEKA3FL6.js";
import {
  RANDOMIZER_DEFAULTS,
  defineSchema,
  paletteShiftCss,
  paletteToCss,
  schemaDefaults,
  validatePalette,
  validateRandomizer,
  withDefaults
} from "./chunks/chunk-GY2PRZL3.js";

// src/vite.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var PRESETS = fileURLToPath(new URL("../presets/", import.meta.url));
var TEMPLATE_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
var readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
var serialize = (value) => `${JSON.stringify(value, null, 2)}
`;
var readBody = (req) => new Promise((resolve, reject) => {
  let data = "";
  req.on("data", (chunk) => data += chunk);
  req.on("end", () => resolve(data));
  req.on("error", reject);
});
function palettePlugin(options = {}) {
  const schema = defineSchema(options.schema ?? defaultSchema);
  const preset = schema.preset && options.builtinTemplates !== false ? path.join(PRESETS, schema.preset) : null;
  const endpoint = options.endpoint ?? "/__palette";
  const styleId = options.styleId ?? "palette";
  const skip = typeof options.randomizerSkip === "function" ? options.randomizerSkip : options.randomizerSkip instanceof RegExp ? (file2) => options.randomizerSkip.test(file2) : () => false;
  let root = process.cwd();
  let lastWritten = null;
  const file = {};
  const rel = (p) => path.relative(root, p).split(path.sep).join("/");
  function resolvePaths(base) {
    root = base;
    file.palette = path.resolve(root, options.palette ?? "src/config/palette.json");
    file.defaults = path.resolve(root, options.defaults ?? "src/config/palette.defaults.json");
    file.templates = path.resolve(root, options.templates ?? "src/config/palettes");
    file.randomizer = options.randomizer === false ? null : path.resolve(root, options.randomizer ?? "src/config/palette.randomizer.json");
  }
  resolvePaths(root);
  const readDefaults = () => {
    const defaults = withDefaults(schema, fs.existsSync(file.defaults) ? readJson(file.defaults) : {}, schemaDefaults(schema));
    const error = validatePalette(schema, defaults);
    if (error) {
      throw new Error(
        `palette-editor: no default colour for ${error.replace(/ must.*$/, "")}. Give the token a \`default\` in your schema, or add it to ${rel(file.defaults)}.`
      );
    }
    return defaults;
  };
  const readPalette = () => {
    const defaults = readDefaults();
    return fs.existsSync(file.palette) ? withDefaults(schema, readJson(file.palette), defaults) : defaults;
  };
  const templateFile = (name) => path.join(file.templates, `${name}.json`);
  function templatesIn(dir, defaults, builtin) {
    if (!dir || !fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).flatMap((f) => {
      try {
        const palette = withDefaults(schema, readJson(path.join(dir, f)), defaults);
        return validatePalette(schema, palette) ? [] : [{ name: f.slice(0, -5), palette, builtin }];
      } catch {
        return [];
      }
    });
  }
  function readTemplates() {
    const defaults = readDefaults();
    const own = templatesIn(file.templates, defaults, false);
    const builtin = templatesIn(preset && path.join(preset, "palettes"), defaults, true).filter((b) => !own.some((t) => t.name === b.name));
    return [...own, ...builtin].sort((a, b) => a.name.localeCompare(b.name));
  }
  function readRandomizer() {
    if (!file.randomizer) return null;
    const source = fs.existsSync(file.randomizer) ? file.randomizer : preset && path.join(preset, "palette.randomizer.json");
    try {
      const settings = { ...RANDOMIZER_DEFAULTS, ...source && fs.existsSync(source) ? readJson(source) : {} };
      return validateRandomizer(settings) ? RANDOMIZER_DEFAULTS : settings;
    } catch {
      return RANDOMIZER_DEFAULTS;
    }
  }
  function randomizerTags() {
    const settings = readRandomizer();
    if (!settings) return [];
    const { onRefresh, everySeconds, fadeSeconds, exclude } = settings;
    if (!onRefresh && !everySeconds) return [];
    const pool = readTemplates().filter((t) => !exclude.includes(t.name));
    if (pool.length < 2) return [];
    const config = { names: pool.map((t) => t.name), onRefresh, everySeconds, fadeSeconds };
    const script = `(function(){try{var c=${JSON.stringify(config)};window.__paletteRandomizer=c;if(!c.onRefresh)return;var k='palette:last',l=null;try{l=localStorage.getItem(k)}catch(e){}var n=c.names.filter(function(x){return x!==l});var p=n[Math.floor(Math.random()*n.length)];document.documentElement.setAttribute('data-palette',p);try{localStorage.setItem(k,p)}catch(e){}}catch(e){}})()`;
    return [
      {
        tag: "style",
        attrs: { id: `${styleId}-templates` },
        // The drift CSS is only needed when the palette changes while you watch
        children: (everySeconds && fadeSeconds ? paletteShiftCss(schema, fadeSeconds) : "") + pool.map((t) => paletteToCss(schema, t.palette, t.name)).join(""),
        injectTo: "head"
      },
      { tag: "script", children: script, injectTo: "head" }
    ];
  }
  return {
    name: "palette-editor",
    configResolved(config) {
      resolvePaths(config.root);
    },
    transformIndexHtml(_html, ctx) {
      const palette = readPalette();
      const error = validatePalette(schema, palette);
      if (error) throw new Error(`${rel(file.palette)}: ${error}`);
      const page = ctx.filename ?? ctx.path ?? "";
      return [{ tag: "style", attrs: { id: styleId }, children: paletteToCss(schema, palette), injectTo: "head" }, ...skip(page) ? [] : randomizerTags()];
    },
    configureServer(server) {
      const watched = [file.palette, file.randomizer].filter(Boolean);
      server.watcher.add(watched);
      server.watcher.on("change", (changed) => {
        changed = path.resolve(changed);
        if (changed === file.randomizer) return server.ws.send({ type: "full-reload" });
        if (changed !== file.palette) return;
        if (fs.readFileSync(file.palette, "utf8") === lastWritten) return;
        server.ws.send({ type: "full-reload" });
      });
      server.middlewares.use(endpoint, async (req, res) => {
        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        const write = (text) => {
          lastWritten = text;
          fs.mkdirSync(path.dirname(file.palette), { recursive: true });
          fs.writeFileSync(file.palette, text);
        };
        const url = (req.url ?? "/").split("?")[0];
        try {
          if (req.method === "GET") {
            return send(200, {
              palette: readPalette(),
              defaults: readDefaults(),
              templates: readTemplates(),
              randomizer: readRandomizer(),
              files: { palette: rel(file.palette), defaults: rel(file.defaults), templates: `${rel(file.templates)}/` }
            });
          }
          if (url === "/randomizer" && req.method === "PUT") {
            if (!file.randomizer) return send(404, { error: "The randomizer is turned off in the Vite config." });
            const settings = JSON.parse(await readBody(req));
            const error = validateRandomizer(settings);
            if (error) return send(400, { error });
            const { onRefresh, everySeconds, fadeSeconds, exclude } = settings;
            fs.mkdirSync(path.dirname(file.randomizer), { recursive: true });
            fs.writeFileSync(file.randomizer, serialize({ onRefresh, everySeconds, fadeSeconds, exclude: [...new Set(exclude)].sort() }));
            return send(200, { randomizer: readRandomizer() });
          }
          const template = url.match(/^\/templates\/([^/]+)$/);
          if (template) {
            const name = decodeURIComponent(template[1]);
            if (!TEMPLATE_NAME.test(name)) return send(400, { error: "Use lowercase letters, numbers and dashes for the name." });
            if (req.method === "PUT") {
              const palette = JSON.parse(await readBody(req));
              const error = validatePalette(schema, palette);
              if (error) return send(400, { error });
              fs.mkdirSync(file.templates, { recursive: true });
              fs.writeFileSync(templateFile(name), serialize(palette));
              return send(200, { templates: readTemplates() });
            }
            if (req.method === "DELETE") {
              if (!fs.existsSync(templateFile(name))) {
                return send(400, { error: `\u201C${name}\u201D is built in, so it can't be deleted. Leave it out of the randomizer's mix instead.` });
              }
              fs.unlinkSync(templateFile(name));
              return send(200, { templates: readTemplates() });
            }
          }
          if (req.method === "PUT" && url === "/") {
            const palette = JSON.parse(await readBody(req));
            const error = validatePalette(schema, palette);
            if (error) return send(400, { error });
            write(serialize(palette));
            return send(200, { palette });
          }
          if (req.method === "POST" && url === "/reset") {
            write(fs.existsSync(file.defaults) ? fs.readFileSync(file.defaults, "utf8") : serialize(readDefaults()));
            return send(200, { palette: readPalette() });
          }
          send(405, { error: "Method not allowed" });
        } catch (err) {
          send(500, { error: err.message });
        }
      });
    }
  };
}
export {
  palettePlugin as default,
  palettePlugin
};
