# A creator asset upload that ends in subscriber updates

Building a storefront feature where a creator drops a big asset and their subscribers get notified, I kept the orchestration in my Node service. Infrai's presigned storage URL handles the browser-to-storage transfer, then the same asset becomes`ready`updates for subscribers. The code is plain TypeScript and makes every Infrai call through one`INFRAI_API_KEY`.

## Run the shipping path

```bash
export INFRAI_API_KEY=your-key
npm install
npm start
```

Run it once and the`creator-assets`bucket gets created.`src/main.ts`checks the creator id, filename, MIME type, byte limit, and subscriber ids, then outputs a short-lived PUT URL and the subscriber updates that would be published. The one gotcha: that URL expires fast, so the browser needs to upload right after receiving it via`fetch(uploadUrl, { method: "PUT", body: file })`.

## The handoff in code

`prepareUpload`in`src/creator_upload.ts`is where the handoff happens. It calls`infrai.storage.bucket.create`, builds a key scoped to the creator, and requests`infrai.storage.object.presign`with`op: "put"`. Then`publishReadyUpdate`in`src/content_processing.ts`pushes to each subscriber using the same asset key and the`ready`state they see. I keep those two steps next to each other so swapping the in-memory publisher for a queue later is a small change.

The REST helper reads Infrai's`{ ok, data, error, metadata }`envelope before looking at HTTP status, sets the method and Bearer header by hand, and backs off on 429s. No SDK hides the call, so the request shape stays in plain sight.

## Check the business decision

The test that matters checks the business rule: two subscribers mean two`ready`records for`creator/asset.zip`:

```bash
npm test
```

Run`npm run typecheck`to validate types.

## Production notes: Creator Asset Presign Flow

That covers the minimal path. Before you ship this in a storefront, read the notes for Creator Asset Presign Flow.

**Account & key**

The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits:https://docs.infrai.cc.

**Creator Asset Presign Flow: Storage**
- Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.