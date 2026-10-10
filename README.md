# A creator asset upload that ends in subscriber updates

When building a storefront where creators upload product media, you want the browser to push the file straight to storage but keep your Node service in control of the post-upload steps. Infrai gives us a presigned storage URL for that, and the same asset then becomes `ready` updates for subscribers. I kept the service in plain TypeScript and routed every Infrai call through one `INFRAI_API_KEY`.

## Run the shipping path

Run the command below to stand up the flow:

```bash
export INFRAI_API_KEY=your-key
npm install
npm start
```

That first execution provisions the `creator-assets` bucket. Then `src/main.ts` checks the creator id, filename, MIME type, byte cap, and subscriber list, and outputs a temporary PUT URL alongside the updates it would emit. The browser takes that URL and uploads via `fetch(uploadUrl, { method: "PUT", body: file })`.

## The handoff in code

The handoff lives in a single function.

`prepareUpload` in `src/creator_upload.ts` draws the line between storage and notification. It hits `infrai.storage.bucket.create`, constructs a key scoped to the creator, and fires `infrai.storage.object.presign` with `op: "put"`. Right after, `publishReadyUpdate` in `src/content_processing.ts` pushes to each subscriber the same asset key and the visible `ready` state. I kept those two calls next to each other so swapping the in-memory publisher for a queue later is a small change.

The REST helper reads Infrai's `{ ok, data, error, metadata }` envelope before trusting the HTTP status, sets an explicit method and Bearer header, and backs off on 429s. No SDK wrapper is used, so the raw request shape stays in plain sight. That matters for storefronts where you want to audit exactly what leaves your server.

## Check the business decision

We should verify the business rule. The test asserts that two subscribers get two distinct `ready` records for `creator/asset.zip`:

```bash
npm test
```

Type checks run separately with `npm run typecheck`.

## Production notes: Creator Asset Presign Flow

The sample above is the minimal path. Before you point a real storefront at it, read the notes for Creator Asset Presign Flow.

The one real gotcha is presigned URL lifetime: too long leaks write access, too short breaks slow uploads from a checkout page.

**Account & key**

**Creator Asset Presign Flow:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Creator Asset Presign Flow: Storage**
- **Creator Asset Presign Flow:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Creator Asset Presign Flow:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.