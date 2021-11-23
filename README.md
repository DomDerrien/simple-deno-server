# Goals

- Use Deno
  - Use Deno to run the services from TypeScript code.
  - Use Deno and ESBuild to serve TypeScript code over the wire.
  - Use Deno to serve local assets (supported MIME types: HTML, CSS, TS, SVG,
    JSON)
  - Use Deno to serve assets from protected S3 buckets (MIME types forward from
    S3)
- Deploy a TypeScript SDK for Unity WebGL games

# Directory Organization

The `src` folder contains all raw files.

The `src/server` folder contains the server files. Access to this folder is
blocked by the server code itself.

The server can be started with:

```bash
deno run \
    --watch \
    --allow-net \
    --allow-env \
    --allow-read=$PWD \
    --allow-write=$HOME/Library/Caches \
    --allow-run=$HOME/Library/Caches/esbuild/bin/esbuild-darwin-64@0.13.12 \
    src/server/main.ts
```

Notes:

- The `--allow-read` flag is used to access the local files to be served by the
  Web service.
- The `--allow-write` flag is required by the ESBuild modules which is going to
  download the latest EDBuild (Go) script.
- The `--allow-run` documents the exact ESBuild script to be run (the one
  processing the TS files). You may have to adapt the script name.

# Hosting Mocks

The folder `api-mocks` is meant to host JSON files that will be served as-is,
when the path corresponding to the request plus `.json` is found on disk.

For example:

- A `GET` call to `/api-mocks/v1/users/12345` is served with the content of the
  file from `src/api-mocks/v1/users/12345.json`—It is meant to be the answer to
  a `get-by-id` call, with only the payload of the identified entity.
- A `GET` call to`/api-mocks/v1/users` is served with the content of the file
  from `src/api-mocks/v1/users.json`—It is meant to be the answer to a `select`
  call, with an array of entities.
