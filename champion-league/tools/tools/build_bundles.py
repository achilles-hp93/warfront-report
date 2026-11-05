# Build only the server engine bundle and the AI worker bundle into a scratch dir.
# usage: python build_bundles.py <repo> <outdir>
import os
import sys

repo, outdir = sys.argv[1], sys.argv[2]
sys.path.insert(0, repo)
os.chdir(repo)
import generator  # noqa: E402
import generator.editions  # noqa: E402
import generator.bundle  # noqa: E402
import generator.rules_js  # noqa: E402

cfg = generator.editions.load_edition_config("fantasy")
generator.editions.load_edition_data(cfg)
import generator.rules_catalog  # noqa: E402
generator.rules_catalog._ACTIVE_RULES_CATALOG = generator.rules_catalog._load_rules_catalog(cfg)
meta = generator.rules_js.build_build_metadata()
os.makedirs(outdir, exist_ok=True)
with open(os.path.join(outdir, "warfront-engine.js"), "w", encoding="utf-8") as f:
    f.write(generator.bundle.build_engine_bundle_js(meta, cfg))
with open(os.path.join(outdir, "ai-worker.js"), "w", encoding="utf-8") as f:
    f.write(generator.bundle.build_ai_worker_js(meta, cfg))
print("meta", meta)
