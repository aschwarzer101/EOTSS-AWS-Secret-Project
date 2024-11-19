import {
  ColumnLayout,
  SpaceBetween,
  Box,
  StatusIndicator,
  Form,
  Button,
  Container,
  Header,
  Flashbar,
} from "@cloudscape-design/components";
import { Labels } from "../../../common/constants";
import { useContext, useState } from "react";
import { AppContext } from "../../../common/app-context";
import { ApiClient } from "../../../common/api-client/api-client";
import { Workspace } from "../../../API";

export interface KendraWorkspaceSettingsProps {
  workspace: Workspace;
}

export default function KendraWorkspaceSettings(
  props: KendraWorkspaceSettingsProps
) {
  const appContext = useContext(AppContext);
  const [kendraIndexSyncing, setKendraIndexSyncing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const onStartKendraDataSync = async () => {
    if (!appContext) return;
    if (kendraIndexSyncing) return; // Prevent duplicate syncs while already syncing

    setSendingRequest(true);
    setGlobalError("");

    const apiClient = new ApiClient(appContext);
    try {
      await apiClient.kendra.startKendraDataSync(props.workspace.id);

      setKendraIndexSyncing(true);
    } catch (error: any) {
      console.error(error);
      setGlobalError(error.errors.map((e: any) => e.message).join(","));
    }

    setSendingRequest(false);
  };

  const onUploadDocument = () => {
    // Trigger Kendra sync when "Upload Document" is pressed
    onStartKendraDataSync();
  };

  return (
    <Form
      actions={
        !props.workspace.kendraIndexExternal ? (
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              data-testid="upload-document"
              variant="primary"
              disabled={sendingRequest || kendraIndexSyncing}
              onClick={onUploadDocument} // Call the upload handler
            >
              Upload Document
            </Button>
          </SpaceBetween>
        ) : undefined
      }
      errorText={globalError}
    >
      <SpaceBetween size="l">
        <Container
          header={<Header variant="h2">Kendra Workspace Settings</Header>}
        >
          <ColumnLayout columns={2} variant="text-grid">
            <SpaceBetween size="l">
              <div>
                <Box variant="awsui-key-label">Workspace Id</Box>
                <div>{props.workspace.id}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Engine</Box>
                <div>{Labels.engineMap[props.workspace.engine]}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Workspace Name</Box>
                <div>{props.workspace.name}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Status</Box>
                <div>
                  <StatusIndicator
                    type={Labels.statusTypeMap[props.workspace.status!]}
                  >
                    {Labels.statusMap[props.workspace.status!]}
                  </StatusIndicator>
                </div>
              </div>
            </SpaceBetween>
            <SpaceBetween size="l">
              {typeof props.workspace.kendraIndexId !== "undefined" && (
                <div>
                  <Box variant="awsui-key-label">Kendra Index Id</Box>
                  <div>{props.workspace.kendraIndexId}</div>
                </div>
              )}
              {typeof props.workspace.kendraIndexExternal !== "undefined" && (
                <div>
                  <Box variant="awsui-key-label">External</Box>
                  <div>
                    {props.workspace.kendraIndexExternal ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {typeof props.workspace.kendraUseAllData !== "undefined" && (
                <div>
                  <Box variant="awsui-key-label">Use All Data</Box>
                  <div>{props.workspace.kendraUseAllData ? "Yes" : "No"}</div>
                </div>
              )}
            </SpaceBetween>
          </ColumnLayout>
        </Container>
        {kendraIndexSyncing && (
          <Flashbar
            items={[
              {
                type: "in-progress",
                dismissible: false,
                content: (
                  <>Syncing. Please wait while the data is being updated.</>
                ),
              },
            ]}
          />
        )}
      </SpaceBetween>
    </Form>
  );
}
