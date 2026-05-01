"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";

// SVG Icons
const UploadCloudIcon = () => (
  <svg
    className="w-10 h-10 text-indigo-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);
const FileTextIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);
const TrashIcon = () => (
  <svg
    className="w-4 h-4 text-red-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ALLOWED_TYPES = ["application/pdf", "text/plain"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function KnowledgeBasePage() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [maxDocs, setMaxDocs] = useState<number>(1);
  const [workspaceTier, setWorkspaceTier] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [fetchError, setFetchError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: session } = useSession();
  const { toast } = useToast();
  const email = session?.user?.email as string | undefined;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchDocuments = useCallback(async () => {
    if (!email) return;
    setFetchError(false);
    try {
      const res = await fetch(`${API_URL}/knowledge?email=${email}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch documents (${res.status})`);
      }
      const data = await res.json();
      setDocuments(data);
    } catch (error: any) {
      console.error("Failed to fetch documents:", error);
      setFetchError(true);
      toast(
        "Could not load your documents. Please check your connection and try again.",
        "error",
      );
    }
  }, [email, API_URL, toast]);

  const fetchWorkspaceLimits = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(
        `${API_URL}/api/workspace?email=${encodeURIComponent(email)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.workspace) {
          setWorkspaceTier(data.workspace.subscriptionTier);
          setMaxDocs(data.workspace.limits?.maxStorageDocs || 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspace limits:", error);
    }
  }, [email, API_URL]);

  useEffect(() => {
    fetchDocuments();
    fetchWorkspaceLimits();
  }, [fetchDocuments, fetchWorkspaceLimits]);

  // File validation helper
  const validateFiles = (incomingFiles: File[]): File[] => {
    const availableSlots = maxDocs - (documents.length + files.length);

    if (availableSlots <= 0) {
      toast(
        "You have reached your document limit. Delete existing documents or upgrade your plan.",
        "error",
      );
      return [];
    }

    const valid: File[] = [];
    for (const file of incomingFiles) {
      if (valid.length >= availableSlots) {
        toast(
          `You can only upload ${availableSlots} more document${availableSlots > 1 ? "s" : ""}. "${file.name}" was skipped.`,
          "warning",
        );
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast(
          `"${file.name}" is not a supported file type. Please upload PDF or TXT files only.`,
          "warning",
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast(
          `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
          "warning",
        );
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(droppedFiles);
      setFiles((prev) => [...prev, ...validFiles]);
      if (validFiles.length > 0 && validFiles.length === droppedFiles.length) {
        toast(`${validFiles.length} file(s) added successfully.`, "success");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = validateFiles(selectedFiles);
      setFiles((prev) => [...prev, ...validFiles]);
      if (validFiles.length > 0) {
        toast(`${validFiles.length} file(s) added. Ready to upload.`, "info");
      }
    }
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !email) return;
    setIsUploading(true);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("email", email);

        const response = await fetch(`${API_URL}/knowledge/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Upload failed (${response.status})`,
          );
        }

        // Verify the document was created successfully
        const uploadedDoc = await response.json();
        console.log("Uploaded document:", uploadedDoc); // Debug log

        successCount++;
      } catch (error: any) {
        console.error(`Upload failed for ${file.name}:`, error);
        failCount++;
        toast(`Failed to upload "${file.name}": ${error.message}`, "error");
      }
    }

    // Clear the file list
    setFiles([]);

    // Force a small delay to ensure database writes are complete, then refresh
    setTimeout(async () => {
      await fetchDocuments();
      await fetchWorkspaceLimits();
    }, 500);

    if (successCount > 0) {
      toast(
        `${successCount} document(s) successfully uploaded and vectorized into your Second Brain!`,
        "success",
      );
    }
    if (failCount > 0) {
      toast(
        `${failCount} document(s) failed to process. Please try again.`,
        "error",
      );
    }

    setIsUploading(false);
  };

  const confirmDelete = (doc: any) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(docToDelete.id);
    setDeleteModalOpen(false);

    try {
      const res = await fetch(
        `${API_URL}/knowledge/${docToDelete.id}?email=${email}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast(`"${docToDelete.fileName}" deleted successfully.`, "success");
      await fetchDocuments();
    } catch (error: any) {
      toast(`Failed to delete document: ${error.message}`, "error");
    } finally {
      setIsDeleting(null);
      setDocToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      READY: "bg-green-100 text-green-700 border-green-200",
      PROCESSING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      FAILED: "bg-red-100 text-red-700 border-red-200",
      ERROR: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span
        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
      >
        {status === "PROCESSING" && <SpinnerIcon />}
        <span className={status === "PROCESSING" ? "ml-1.5" : ""}>
          {status}
        </span>
      </span>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload company documents to train your AI. Supported formats: PDF, TXT
          (max {MAX_FILE_SIZE_MB}MB each).
        </p>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700">
              Failed to load documents. Please check your connection.
            </p>
          </div>
          <button
            onClick={fetchDocuments}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* LIMIT REACHED BANNER */}
        {/* LIMIT REACHED BANNER */}
        {documents.length + files.length >= maxDocs && (
          <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Document Limit Reached
            </h3>
            <p className="text-sm text-amber-700">
              Delete an existing document or upgrade your plan to upload more.
            </p>
            {!workspaceTier && (
              <a
                href="/dashboard/billing"
                className="mt-4 inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upgrade Plan
              </a>
            )}
          </div>
        )}

        {/* DRAG AND DROP ZONE — Hide when limit reached */}
        {documents.length + files.length < maxDocs && (
          <div
            className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors ${
              dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.txt"
              onChange={handleChange}
              className="hidden"
            />
            <UploadCloudIcon />
            <p className="mt-4 text-sm font-medium text-gray-900">
              Drag & drop your files here, or{" "}
              <button
                onClick={() => inputRef.current?.click()}
                className="text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Maximum file size {MAX_FILE_SIZE_MB}MB. PDF and TXT only.
            </p>
          </div>
        )}

        {/* FILE LISTING */}
        {files.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Ready to Upload ({files.length} file{files.length > 1 ? "s" : ""})
            </h4>
            <ul className="space-y-3">
              {files.map((file, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <FileTextIcon />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.name)}
                    className="p-1 rounded-md hover:bg-red-50 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <SpinnerIcon />
                    <span className="ml-2">Processing...</span>
                  </>
                ) : (
                  "Train AI with Files"
                )}
              </button>
            </div>
          </div>
        )}

        {/* UPLOADED DOCUMENTS LIST */}
        {documents.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <FileTextIcon />{" "}
              <span className="ml-2">
                Your Knowledge Base ({documents.length} document
                {documents.length > 1 ? "s" : ""})
              </span>
            </h4>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileTextIcon />
                    <span className="text-sm font-medium text-gray-800">
                      {doc.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc.status)}
                    <button
                      onClick={() => confirmDelete(doc)}
                      disabled={isDeleting === doc.id}
                      className="p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label={`Delete ${doc.fileName}`}
                    >
                      {isDeleting === doc.id ? <SpinnerIcon /> : <TrashIcon />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && files.length === 0 && !fetchError && (
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileTextIcon />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              No documents yet
            </h4>
            <p className="text-xs text-gray-500">
              Upload PDFs or text files to train your AI agent.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Document"
        size="sm"
        actions={
          <>
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">
            &ldquo;{docToDelete?.fileName}&rdquo;
          </span>
          ? The AI will no longer be able to reference this document.
        </p>
      </Modal>
    </div>
  );
}
