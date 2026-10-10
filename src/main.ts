import { prepareUpload } from "./creator_upload.js";

const result = await prepareUpload({ creatorId: "demo-creator", assetName: "launch-video.mp4", contentType: "video/mp4", sizeBytes: 8_000_000, subscriberIds: ["sub-101", "sub-202"] });
console.log(JSON.stringify(result, null, 2));
