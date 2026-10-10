import { z } from "zod";
import { infrai } from "./infrai_client.js";

export const uploadRequest = z.object({ creatorId: z.string().min(1), assetName: z.string().min(1), contentType: z.string().min(1), sizeBytes: z.number().int().positive(), subscriberIds: z.array(z.string().min(1)).default([]) });
export type UploadRequest = z.infer<typeof uploadRequest>;
const BUCKET = "creator-assets";

export async function prepareUpload(input: unknown): Promise<{ key: string; uploadUrl: string }> {
  const request = uploadRequest.parse(input);
  await infrai.storage.bucket.create({ name: BUCKET });
  const key = `${request.creatorId}/${request.assetName}`;
  const signed = await infrai.storage.object.presign(BUCKET, key, { op: "put", expires_seconds: 900, content_type: request.contentType, max_bytes: request.sizeBytes, idempotency_key: key });
  return { key, uploadUrl: signed.url };
}
