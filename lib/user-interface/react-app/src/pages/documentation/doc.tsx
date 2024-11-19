import React from "react";

const FeaturesOfGenie: React.FC = () => {
  return (
    <div className="features-page">
      <header>
        <h1>Features of GENIE</h1>
      </header>

      <section>
        <h2>Chatbot</h2>
        <p>The Chatbot feature enables users to:</p>
        <ul>
          <li>
            <strong>Ask General Questions:</strong> Similar to queries you might
            enter into an internet search engine like Google.
          </li>
          <li>
            <strong>Query Uploaded Documents:</strong> Pose questions about a
            document or set of documents you’ve uploaded to GENIE.
          </li>
        </ul>
      </section>

      <section>
        <h2>Bottom Bar</h2>
        <h3>Smart Model</h3>
        <ul>
          <li>
            Automatically selects the best Large Language Model (LLM) from over
            10 supported LLMs to answer your questions.
          </li>
          <li>No configuration required!</li>
          <li>
            Prefer customization? You can manually select your preferred LLM
            for answering questions.
          </li>
        </ul>

        <h3>Basic Chat (No Workspace)</h3>
        <ul>
          <li>The default setting if no workspace is selected.</li>
          <li>
            To query uploaded documents, you must select the workspace
            associated with those files.
          </li>
          <li>
            Workspaces are automatically named (e.g., <code>doc-upload-1</code>
            ). The workspace name will appear in the top-left corner after
            clicking <strong>“Upload Document.”</strong>
          </li>
        </ul>
      </section>

      <section>
        <h2>Upload Documents</h2>
        <h3>Ways to Upload Documents</h3>

        <h4>Uploading a Single Document</h4>
        <ol>
          <li>Click <strong>“Upload Document.”</strong></li>
          <li>Click <strong>“Upload Files.”</strong></li>
          <li>Select <strong>“Choose Files”</strong> and upload your document(s).</li>
          <li>Navigate back to the Chatbot using the left side bar.</li>
          <li>
            Under <strong>“Basic Chat (No Workspace),”</strong> select the
            workspace you just created.
          </li>
          <li>Start querying your document in the chat.</li>
        </ol>

        <h4>Uploading Multiple Documents</h4>
        <p>Follow the same steps as for a single document. If all files are uploaded into the same workspace, GENIE will answer questions about all documents within that workspace.</p>

        <h3>What Are Workspaces?</h3>
        <p>
          <strong>Definition:</strong> Workspaces function like folders,
          organizing all the documents you upload.
        </p>
        <p>
          <strong>Purpose:</strong> To query a chatbot about specific documents,
          select the appropriate workspace containing those files.
        </p>

        <h4>Creating a Workspace</h4>
        <ol>
          <li>Click <strong>“Document Upload”</strong> in the sidebar.</li>
          <li>
            Choose a workspace engine (determines how documents are parsed to
            extract information).
          </li>
          <li>Name your workspace.</li>
          <li>Click <strong>“Create Workspace.”</strong></li>
        </ol>

        <h4>Deleting a Workspace</h4>
        <ol>
          <li>Click <strong>“Document Upload”</strong> in the sidebar.</li>
          <li>Click on the workspace you would like to delete.</li>
          <li>Select <strong>“Delete”</strong> in the top-right corner.</li>
        </ol>
      </section>

      <section>
        <h2>Multi-Chat Playground</h2>
        <p>This feature lets you compare outputs from multiple models side by side.</p>

        <h3>How to Use</h3>
        <ol>
          <li>Select a model for each panel.</li>
          <li>
            Choose either <strong>Basic Chat (No Workspace)</strong> or a
            workspace containing uploaded documents.
          </li>
          <li>Enter your question.</li>
          <li>View and compare outputs from the selected models.</li>
          <li>
            To add more models, click <strong>“Add Model”</strong> in the
            top-right corner.
          </li>
        </ol>
      </section>

      <section>
        <h2>Tasks</h2>
        <p>
          Streamline repetitive or time-consuming activities with task-based AI
          solutions. Select from a variety of tasks to assist with summarizing,
          drafting, and extracting information. Each task includes a
          description within the GENIE interface.
        </p>
      </section>

      <section>
        <h2>Learn More</h2>
        <p>Expand your understanding of Generative AI with:</p>
        <ul>
          <li><strong>Video Tutorials</strong></li>
          <li>
            <strong>Linked Resources</strong> to help improve your prompting
            skills.
          </li>
        </ul>
      </section>

      <section>
        <h2>Side Bar</h2>
        <ul>
          <li>
            <strong>Experiment with AI:</strong> Access the Chatbot interface.
          </li>
          <li>
            <strong>Compare Models:</strong> Open the Multi-Chat Playground.
          </li>
          <li>
            <strong>Chat History:</strong> View your entire conversation history
            with the Chatbot.
          </li>
          <li>
            <strong>Document Upload:</strong> Create custom workspaces and
            upload documents.
          </li>
          <li>
            <strong>Available Models:</strong> Browse all models supported by
            GENIE.
          </li>
          <li>
            <strong>Recent Chat History:</strong> Quickly access summaries of
            recent conversations. Click on any listed chat to return to its
            specific prompt.
          </li>
          <li>
            <strong>Explore Task-Based AI Solutions:</strong> View the full list
            of available tasks designed to help optimize your workflow.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default FeaturesOfGenie;
