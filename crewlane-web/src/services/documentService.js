import { v4 as uuidv4 } from 'uuid';
import apiClient, { apiErrorMessage } from './apiClient.js';
import { localFileStore } from './localFileStore.js';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
export const ACCEPTED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

async function requestUploadUrl({ companyId, employeeId, documentType, fileName, fileType }) {
  const { data } = await apiClient.post('/documents/upload-url', {
    companyId,
    employeeId,
    documentType,
    fileName,
    fileType,
  });
  return data;
}

async function putFile(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) {
    // A real response came back (e.g. an expired presigned URL) — this is
    // not a "server unreachable" situation, so it must not be treated as one.
    const err = new Error('Upload to storage failed.');
    err.isHttpResponse = true;
    throw err;
  }
}

// Only a genuine network failure — no response received at all — should
// trigger the local-fallback path. A real HTTP error response (401, 400,
// 500, an S3 rejection, ...) means the request landed and failed for a real
// reason, which must surface to the user instead of silently degrading.
function isNetworkFailure(err) {
  if (err?.isHttpResponse) return false;
  if (err?.isAxiosError) return !err.response;
  return err instanceof TypeError;
}

export const documentService = {
  validateFile(file, { images_only = false } = {}) {
    const acceptedTypes = images_only ? ACCEPTED_IMAGE_TYPES : ACCEPTED_DOCUMENT_TYPES;
    if (!acceptedTypes.includes(file.type)) {
      return images_only
        ? 'Only JPG or PNG images are accepted.'
        : 'Only JPG, PNG, or PDF files are accepted.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File must be 5MB or smaller.';
    }
    return null;
  },

  async uploadDocument({ companyId, employeeId, documentType, file, label = '' }) {
    try {
      const { uploadUrl, key } = await requestUploadUrl({
        companyId,
        employeeId,
        documentType,
        fileName: file.name,
        fileType: file.type,
      });
      await putFile(uploadUrl, file);

      const { data: record } = await apiClient.post('/documents', {
        documentType,
        label,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        s3Key: key,
      });
      return record;
    } catch (err) {
      if (!isNetworkFailure(err)) {
        throw new Error(apiErrorMessage(err, err.message || 'Failed to upload document.'));
      }
    }

    // Only reached when the backend/S3 was genuinely unreachable.
    const localFileRef = `doc-${uuidv4()}`;
    await localFileStore.saveBlob(localFileRef, file);
    return {
      id: localFileRef,
      companyId,
      employeeId,
      documentType,
      label: documentType === 'other' ? label.trim() : '',
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storageType: 'local',
      s3Key: null,
      localFileRef,
      uploadedAt: new Date().toISOString(),
    };
  },

  async getDocumentsForEmployee(employeeId) {
    const { data } = await apiClient.get('/documents', { params: { employeeId } });
    return data;
  },

  async getDocument(employeeId, documentType) {
    const documents = await this.getDocumentsForEmployee(employeeId);
    return documents.find((d) => d.documentType === documentType) || null;
  },

  // The one shared resolver for turning an EmployeeDocument record into a
  // displayable <img>/<a> src — every avatar and document preview spot
  // must go through this instead of assuming `s3Key` exists.
  async resolveDocumentSource(record) {
    if (!record) return null;
    if (record.storageType === 'local') {
      const blob = await localFileStore.getBlob(record.localFileRef);
      return blob ? URL.createObjectURL(blob) : null;
    }
    return documentService.getDownloadUrl(record.s3Key);
  },

  async getDownloadUrl(key) {
    const { data } = await apiClient.get('/documents/download-url', { params: { key } });
    return data.downloadUrl;
  },

  async deleteFromStorage(key) {
    await apiClient.delete('/documents', { params: { key } });
  },

  async deleteStoredFile(record) {
    if (!record) return;
    try {
      if (record.storageType === 'local') {
        if (record.localFileRef) await localFileStore.deleteBlob(record.localFileRef);
      }
      // s3-backed records are deleted server-side via removeDocument, which
      // also removes the object from S3.
    } catch {
      // best-effort cleanup of the replaced/removed file; keep going regardless
    }
  },

  async removeDocument(id) {
    if (typeof id === 'string' && id.startsWith('doc-')) {
      await localFileStore.deleteBlob(id);
      return;
    }
    await apiClient.delete(`/documents/${id}`);
  },

  async deleteByCompany() {
    // Deleted server-side as part of companyController.deleteCompany. Any
    // locally-stored fallback files for this session are best-effort only.
  },

  async deleteByEmployee() {
    // The employee's own device may still hold local-fallback files, but
    // there is no server-side call needed here — deletion happens per
    // document via removeDocument.
  },
};

export default documentService;
