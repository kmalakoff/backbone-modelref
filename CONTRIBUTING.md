# Contributing

`master` contains the current TypeScript migration, project v2. `support/0.x` maintains the legacy project v1 package. Project v1 does not mean that this package has a 1.x version.

Make legacy fixes on `support/0.x` and port applicable fixes separately to `master`. Keep v2-only changes on `master`. Reviewed migration checkpoints reach local `master`; a checkpoint does not establish release readiness or complete validation.

Publishing is a maintainer action. Releases from `support/0.x` must explicitly use `--tag support-0`; `scripts/require-dist-tag.cjs` enforces this through `prepublishOnly`. Preserve the existing build and validation lifecycle on each line. No support release uses the default `latest` tag.
