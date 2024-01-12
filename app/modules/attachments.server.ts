import type { UploadHandler } from '@remix-run/node';
import {
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
} from '@remix-run/node';

const standardFileUploadHandler = unstable_createFileUploadHandler({
  directory: './attachments',
  avoidFileConflicts: true,
});

const attachmentsUploadHandler: UploadHandler = async (args) => {
  if (args.name !== 'attachment' || !args.filename) return null;
  const file = await standardFileUploadHandler(args);
  if (!file) return null;
  if (!typeof file === 'string') return file;
  return file.name;
};

export const uploadHandler = unstable_composeUploadHandlers(
  attachmentsUploadHandler,
  unstable_createMemoryUploadHandler(),
);
