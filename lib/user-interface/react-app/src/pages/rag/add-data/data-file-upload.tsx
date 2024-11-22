import {
  Button,
  Container,
  FileUpload,
  Flashbar,
  FlashbarProps,
  Form,
  FormField,
  Modal,
  ProgressBar,
  ProgressBarProps,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useContext, useState } from "react";
import { AddDataData } from "./types";
import { AppContext } from "../../../common/app-context";
import { ApiClient } from "../../../common/api-client/api-client";
import { Utils } from "../../../common/utils";
import { FileUploader } from "../../../common/file-uploader";
import { useNavigate } from "react-router-dom";
import { Workspace } from "../../../API";

export interface DataFileUploadProps {
  data: AddDataData;
  validate: () => boolean;
  selectedWorkspace?: Workspace;
}

const fileExtensions = new Set([
  ".csv",
  ".doc",
  ".docx",
  ".epub",
  ".odt",
  ".pdf",
  ".ppt",
  ".pptx",
  ".tsv",
  ".xlsx",
  ".eml",
  ".html",
  ".json",
  ".md",
  ".msg",
  ".rst",
  ".rtf",
  ".txt",
  ".xml",
]);

export default function DataFileUpload(props: DataFileUploadProps) {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [uploadingStatus, setUploadingStatus] =
    useState<FlashbarProps.Type>("info");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingIndex, setUploadingIndex] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [uploadPanelDismissed, setUploadPanelDismissed] =
    useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const onSetFiles = (files: File[]) => {
    const errors: string[] = [];
    const filesToUpload: File[] = [];
    setUploadError(undefined);

    if (files.length > 100) {
      setUploadError("Max 100 files allowed");
      files = files.slice(0, 100);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!fileExtensions.has(`.${fileExtension}`)) {
        errors[i] = "Format not supported";
      } else if (file.size > 1000 * 1000 * 100) {
        errors[i] = "File size is too large, max 100MB";
      } else {
        filesToUpload.push(file);
      }
    }

    setFiles(files);
    setFileErrors(errors);
    setFilesToUpload(filesToUpload);
  };

  const onUpload = async () => {
    if (!props.validate()) return;
    if (!appContext) return;
    if (!props.data.workspace?.value) return;
    setUploadingStatus("in-progress");
    setUploadProgress(0);
    setUploadingIndex(1);
    setUploadPanelDismissed(false);

    const uploader = new FileUploader();
    const apiClient = new ApiClient(appContext);
    const totalSize = filesToUpload.reduce((acc, file) => acc + file.size, 0);
    let accumulator = 0;
    let hasError = false;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setCurrentFileName(file.name);
      let fileUploaded = 0;

      try {
        const result = await apiClient.documents.presignedFileUploadPost(
          props.data.workspace?.value,
          file.name
        );

        try {
          await uploader.upload(
            file,
            result.data!.getUploadFileURL!,
            (uploaded: number) => {
              fileUploaded = uploaded;
              const totalUploaded = fileUploaded + accumulator;
              const percent = Math.round((totalUploaded / totalSize) * 100);
              setUploadProgress(percent);
            }
          );

          accumulator += file.size;
          setUploadingIndex(Math.min(filesToUpload.length, i + 2));
        } catch (error) {
          console.error(error);
          setUploadingStatus("error");
          hasError = true;
          break;
        }
      } catch (error: any) {
        setGlobalError(Utils.getErrorMessage(error));
        console.error(Utils.getErrorMessage(error));
        setUploadingStatus("error");
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      setUploadingStatus("success");
      setFilesToUpload([]);
      setFiles([]);
      setShowModal(true); // Show modal after successful upload
    }
  };

  const startKendraSync = async () => {
    if (!appContext || !props.data.workspace?.value) return;

    setIsSyncing(true); // Indicate that syncing is in progress
    try {
      const apiClient = new ApiClient(appContext);
      await apiClient.kendra.startKendraDataSync(props.data.workspace?.value);
      console.log("Kendra Data Sync started.");
    } catch (error) {
      console.error("Error starting Kendra Data Sync:", error);
    } finally {
      setIsSyncing(false); // Reset syncing state
    }
  };

  const getProgressbarStatus = (): ProgressBarProps.Status => {
    if (uploadingStatus === "error") return "error";
    if (uploadingStatus === "success") return "success";
    return "in-progress";
  };

  const hasReadyWorkspace =
    typeof props.data.workspace?.value !== "undefined" &&
    typeof props.selectedWorkspace !== "undefined" &&
    props.selectedWorkspace.status === "ready";

  return (
    <Form
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            data-testid="create"
            variant="primary"
            disabled={
              filesToUpload.length === 0 ||
              uploadingStatus === "in-progress" ||
              !hasReadyWorkspace
            }
            onClick={onUpload}
          >
            Upload files
          </Button>
        </SpaceBetween>
      }
      errorText={globalError}
    >
      <SpaceBetween size="l">
        <Container>
          <SpaceBetween size="l">
            <FormField>
              <FileUpload
                onChange={({ detail }) => onSetFiles(detail.value)}
                value={files}
                multiple
                showFileLastModified
                showFileSize
                showFileThumbnail
                tokenLimit={3}
                constraintText={`Text documents up to 100MB supported (${Array.from(
                  fileExtensions.values()
                ).join(", ")})`}
                fileErrors={fileErrors}
                errorText={uploadError}
                i18nStrings={{
                  uploadButtonText: (fileCount) =>
                    fileCount ? "Choose files" : "Choose file",
                  dropzoneText: (fileCount) =>
                    fileCount ? "Drop files to upload" : "Drop file to upload",
                  removeFileAriaLabel: (index) => `Remove file ${index + 1}`,
                  limitShowFewer: "Show fewer files",
                  limitShowMore: "Show more files",
                  errorIconAriaLabel: "Error",
                }}
              />
            </FormField>
          </SpaceBetween>
        </Container>
        {showModal && (
          <Modal
            onDismiss={() => setShowModal(false)}
            visible={showModal}
            header="File Uploaded"
            footer={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => {
                    setShowModal(false);
                    navigate(
                      `/rag/workspaces/add-data?workspaceId=${props.data.workspace?.value}?tab=file`
                    );
                  }}
                >
                  Upload more files
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    await startKendraSync();
                    navigate("/chatbot/playground");
                  }}
                  disabled={isSyncing}
                >
                  {isSyncing
                    ? "Syncing..."
                    : "Start conversation with GENIE"}
                </Button>
              </SpaceBetween>
            }
          >
            Your file has been uploaded successfully! You can now start a conversation with GENIE or upload more documents. 
          </Modal>
        )}
        {uploadingStatus !== "info" && !uploadPanelDismissed && (
          <Flashbar
            items={[
              {
                content: (
                  <ProgressBar
                    value={uploadProgress}
                    variant="flash"
                    description={
                      uploadingStatus === "success" ||
                      uploadingStatus === "error"
                        ? null
                        : currentFileName
                    }
                    label={
                      uploadingStatus === "success" ||
                      uploadingStatus === "error"
                        ? "Uploading files"
                        : `Uploading files ${uploadingIndex} of ${filesToUpload.length}`
                    }
                    status={getProgressbarStatus()}
                    resultText={
                      uploadingStatus === "success"
                        ? "Upload complete"
                        : "Upload failed"
                    }
                  />
                ),
                type: uploadingStatus,
                dismissible:
                  uploadingStatus === "success" || uploadingStatus === "error",
                onDismiss: () => setUploadPanelDismissed(true),
                buttonText:
                  uploadingStatus === "success" ? "View files" : undefined,
                onButtonClick: () =>
                  navigate(
                    `/rag/workspaces/${props.data.workspace?.value}?tab=file`
                  ),
              },
            ]}
          />
        )}
      </SpaceBetween>
    </Form>
  );
}
