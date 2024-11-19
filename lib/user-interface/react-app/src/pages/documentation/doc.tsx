import React from "react";

const FeaturesOfGenie: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 min-h-screen text-white p-8 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold underline decoration-pink-300">Features of GENIE</h1>
        <p className="mt-4 text-lg">Discover how GENIE empowers your productivity with cutting-edge AI capabilities.</p>
      </header>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Chatbot</h2>
        <p className="mb-2">The Chatbot feature enables users to:</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>
            <strong className="text-pink-300">Ask General Questions:</strong> 
            Similar to queries you might enter into an internet search engine like Google.
          </li>
          <li>
            <strong className="text-pink-300">Query Uploaded Documents:</strong> 
            Pose questions about a document or set of documents you’ve uploaded to GENIE.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Bottom Bar</h2>
        <h3 className="text-2xl font-semibold mb-3 underline decoration-indigo-300">Smart Model</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>Automatically selects the best Large Language Model (LLM) from over 10 supported LLMs to answer your questions.</li>
          <li>No configuration required!</li>
          <li>Prefer customization? You can manually select your preferred LLM for answering questions.</li>
        </ul>

        <h3 className="text-2xl font-semibold mb-3 underline decoration-indigo-300">Basic Chat (No Workspace)</h3>
        <ul className="list-disc pl-8 space-y-2">
          <li>The default setting if no workspace is selected.</li>
          <li>To query uploaded documents, select the workspace associated with those files.</li>
          <li>
            Workspaces are automatically named (e.g., <code className="bg-purple-600 px-1 rounded">doc-upload-1</code>).
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Upload Documents</h2>
        <h3 className="text-2xl font-semibold mb-3 underline decoration-indigo-300">Ways to Upload Documents</h3>

        <h4 className="text-xl font-medium mb-2">Uploading a Single Document</h4>
        <ol className="list-decimal pl-8 space-y-2">
          <li>Click <strong className="text-pink-300">“Upload Document.”</strong></li>
          <li>Click <strong className="text-pink-300">“Upload Files.”</strong></li>
          <li>Select <strong className="text-pink-300">“Choose Files”</strong> and upload your document(s).</li>
          <li>Navigate back to the Chatbot using the left sidebar.</li>
          <li>Under <strong>“Basic Chat (No Workspace),”</strong> select the workspace you just created.</li>
          <li>Start querying your document in the chat.</li>
        </ol>

        <h4 className="text-xl font-medium mb-2">Uploading Multiple Documents</h4>
        <p>
          Follow the same steps as for a single document. GENIE will answer questions about all documents within the workspace.
        </p>

        <h3 className="text-2xl font-semibold mb-3 underline decoration-indigo-300">What Are Workspaces?</h3>
        <p>
          <strong>Definition:</strong> Workspaces function like folders, organizing all the documents you upload.
        </p>
        <p>
          <strong>Purpose:</strong> To query a chatbot about specific documents, select the appropriate workspace containing those files.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Multi-Chat Playground</h2>
        <p>This feature lets you compare outputs from multiple models side by side.</p>

        <h3 className="text-2xl font-semibold mb-3 underline decoration-indigo-300">How to Use</h3>
        <ol className="list-decimal pl-8 space-y-2">
          <li>Select a model for each panel.</li>
          <li>Choose either <strong className="text-pink-300">Basic Chat (No Workspace)</strong> or a workspace containing uploaded documents.</li>
          <li>Enter your question.</li>
          <li>View and compare outputs from the selected models.</li>
          <li>To add more models, click <strong className="text-pink-300">“Add Model.”</strong></li>
        </ol>
      </section>

      <footer className="text-center mt-12">
        <p className="text-sm">
          Expand your knowledge with <span className="text-pink-300">video tutorials</span> and <span className="text-pink-300">linked resources</span> available within the app.
        </p>
      </footer>
    </div>
  );
};

export default FeaturesOfGenie;
