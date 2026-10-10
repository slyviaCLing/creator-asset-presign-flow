import { publishReadyUpdate } from "./content_processing.js";

const updates = publishReadyUpdate("creator/asset.zip", ["a", "b"]);
if (updates.length !== 2 || updates.some((item) => item.state !== "ready" || item.assetKey !== "creator/asset.zip")) throw new Error("subscribers should receive a ready update for the uploaded asset");

process.env.INFRAI_API_KEY ??= "test-api-key";
globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, data: { url: "https://uploads.example/asset" } }), { status: 200 });
const { prepareUpload } = await import("./creator_upload.js");
const prepared = await prepareUpload({ creatorId: "creator", assetName: "asset.zip", contentType: "application/zip", sizeBytes: 1024, subscriberIds: ["a", "b"] });
if ("updates" in prepared) throw new Error("issuing a presigned upload URL must not publish ready updates");
console.log("subscriber update decision: ok");
