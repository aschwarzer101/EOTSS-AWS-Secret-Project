import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { Shared } from "../shared";
import { SystemConfig } from "../shared/types";
import { AuroraPgVector } from "./aurora-pgvector";
import { DataImport } from "./data-import";
import { KendraRetrieval } from "./kendra-retrieval";
import { OpenSearchVector } from "./opensearch-vector";
import { RagDynamoDBTables } from "./rag-dynamodb-tables";
import { SageMakerRagModels } from "./sagemaker-rag-models";
import { Workspaces } from "./workspaces";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import path = require("path");
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface RagEnginesProps {
  readonly uploadBucket: s3.Bucket;
  readonly config: SystemConfig;
  readonly shared: Shared;
}

export class RagEngines extends Construct {
  public readonly auroraPgVector: AuroraPgVector | null;
  public readonly openSearchVector: OpenSearchVector | null;
  public readonly kendraRetrieval: KendraRetrieval | null;
  public readonly sageMakerRagModels: SageMakerRagModels | null;
  public readonly uploadBucket: s3.Bucket;
  public readonly processingBucket: s3.Bucket;
  public readonly documentsTable: dynamodb.Table;
  public readonly workspacesTable: dynamodb.Table;
  public readonly workspacesByObjectTypeIndexName: string;
  public readonly documentsByCompountKeyIndexName: string;
  public readonly documentsByStatusIndexName: string;
  public readonly fileImportWorkflow?: sfn.StateMachine;
  public readonly websiteCrawlingWorkflow?: sfn.StateMachine;
  public readonly deleteWorkspaceWorkflow?: sfn.StateMachine;
  public readonly dataImport: DataImport;
  metadataHandlerFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: RagEnginesProps) {
    super(scope, id);

    const tables = new RagDynamoDBTables(this, "RagDynamoDBTables");

    let sageMakerRagModels: SageMakerRagModels | null = null;
    if (
      props.config.rag.engines.aurora.enabled ||
      props.config.rag.engines.opensearch.enabled
    ) {
      sageMakerRagModels = new SageMakerRagModels(this, "SageMaker", {
        shared: props.shared,
        config: props.config,
      });
    }

    let auroraPgVector: AuroraPgVector | null = null;
    if (props.config.rag.engines.aurora.enabled) {
      auroraPgVector = new AuroraPgVector(this, "AuroraPgVector", {
        shared: props.shared,
        config: props.config,
        ragDynamoDBTables: tables,
      });
    }

    let openSearchVector: OpenSearchVector | null = null;
    if (props.config.rag.engines.opensearch.enabled) {
      openSearchVector = new OpenSearchVector(this, "OpenSearchVector", {
        shared: props.shared,
        config: props.config,
        ragDynamoDBTables: tables,
      });
    }

    let kendraRetrieval: KendraRetrieval | null = null;
    if (props.config.rag.engines.kendra.enabled) {
      kendraRetrieval = new KendraRetrieval(this, "KendraRetrieval", {
        shared: props.shared,
        config: props.config,
        ragDynamoDBTables: tables,
      });
    }

    const dataImport = new DataImport(this, "DataImport", {
      shared: props.shared,
      config: props.config,
      auroraDatabase: auroraPgVector?.database,
      sageMakerRagModels: sageMakerRagModels ?? undefined,
      workspacesTable: tables.workspacesTable,
      documentsTable: tables.documentsTable,
      ragDynamoDBTables: tables,
      workspacesByObjectTypeIndexName: tables.workspacesByObjectTypeIndexName,
      documentsByCompoundKeyIndexName: tables.documentsByCompoundKeyIndexName,
      openSearchVector: openSearchVector ?? undefined,
      kendraRetrieval: kendraRetrieval ?? undefined,
    });

    const workspaces = new Workspaces(this, "Workspaces", {
      shared: props.shared,
      config: props.config,
      dataImport,
      ragDynamoDBTables: tables,
      auroraPgVector: auroraPgVector ?? undefined,
      openSearchVector: openSearchVector ?? undefined,
      kendraRetrieval: kendraRetrieval ?? undefined,
    });

    const metadataHandlerFunction = new lambda.Function(scope, 'MetadataHandlerFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(path.join(__dirname, 'metadata-handler')),
      handler: 'lambda_function.lambda_handler',
      timeout: cdk.Duration.seconds(30),
      environment: {
        "BUCKET": props.uploadBucket.bucketName,
        // "KB_ID": props.uploadBucket.attrKnowledgeBaseId
      },
  });



    metadataHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:*' ,// Grants full access to all S3 actions (read, write, delete, etc.)
        'bedrock:InvokeModel',
        'bedrock:Retrieve',
      ],
      resources: [
        props.uploadBucket.bucketArn,               // Grants access to the bucket itself (for actions like ListBucket)
        props.uploadBucket.bucketArn + "/*" ,        // Grants access to all objects within the bucket
        'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',  // Add the Bedrock model resource explicitly


      ]
    }));


// Trigger the lambda function when a document is uploaded

    this.metadataHandlerFunction = metadataHandlerFunction;

      metadataHandlerFunction.addEventSource(new S3EventSource(props.uploadBucket, {
        events: [s3.EventType.OBJECT_CREATED],
      }));

    this.auroraPgVector = auroraPgVector;
    this.openSearchVector = openSearchVector;
    this.kendraRetrieval = kendraRetrieval;
    this.sageMakerRagModels = sageMakerRagModels;
    this.uploadBucket = dataImport.uploadBucket;
    this.processingBucket = dataImport.processingBucket;
    this.workspacesTable = tables.workspacesTable;
    this.documentsTable = tables.documentsTable;
    this.workspacesByObjectTypeIndexName =
      tables.workspacesByObjectTypeIndexName;
    this.documentsByCompountKeyIndexName =
      tables.documentsByCompoundKeyIndexName;
    this.documentsByStatusIndexName = tables.documentsByStatusIndexName;
    this.fileImportWorkflow = dataImport.fileImportWorkflow;
    this.websiteCrawlingWorkflow = dataImport.websiteCrawlingWorkflow;
    this.deleteWorkspaceWorkflow = workspaces.deleteWorkspaceWorkflow;
    this.dataImport = dataImport;
  }
}
