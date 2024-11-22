import React, { useState } from "react";

const GenieFeaturesPage = () => {
  const [showModelDetails, setShowModelDetails] = useState(false);

  const toggleModelDetails = () => {
    setShowModelDetails(!showModelDetails);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", color: "#333" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#000716", color: "white", padding: "20px" }}>
        <h1>Learn More About GENIE</h1>
        <p>Explore the features of our AI-powered chatbot and tools.</p>
      </header>

      {/* Main Content */}
      <div style={{ padding: "20px" }}>
        {/* Chatbot Section */}
        <section
          style={{
            border: "2px #9dadff solid",
            borderRadius: "10px",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#c2ccff",
          }}
        >
          <h2 style={{ color: "black" }}>Chatbot</h2>
          <p>The Chatbot feature enables users to:</p>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li><b>Ask General Questions: </b>Similar to queries you might enter into an internet search engine like Google.</li>
            <li><b>Query Uploaded Documents: </b>Pose questions about a document or set of documents you’ve uploaded to GENIE.</li>
            <li><b>Simplify Repetitive Tasks: </b>Optimize daily repeitive or time consuming tasks such as summarization, drafting, synthesizing, etc.</li>
          </ul>
          <h3 style={{ color: "black" }}>Bottom Bar</h3>
          <p>
              <strong>Smart Model:</strong> Automatically selects the best model for your query.
            </p>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li> No configuration required!</li>
            <li> Automatically selects the best Large Language Model (LLM) from over 10 supported LLMs to answer your questions.
            </li>
            <li> Prefer customization? You can manually select your preferred LLM for answering questions. </li>
          </ul>
        </section>

        {/* Multi-Chat Playground Section */}
        <section
          style={{
            border: "2px solid indigo",
            borderRadius: "10px",
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f0f8ff",
          }}
        >
          <h2 style={{ color: "pink" }}>Multi-Chat Playground</h2>
          <p>Compare outputs from multiple models side by side.</p>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li>Select a model for each panel.</li>
            <li>Choose a workspace or Basic Chat (No Workspace).</li>
            <li>Enter your question and compare outputs.</li>
          </ul>
          <button
            onClick={toggleModelDetails}
            style={{
              marginTop: "10px",
              padding: "10px 15px",
              backgroundColor: "purple",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {showModelDetails ? "Hide Models" : "Learn More About the Models"}
          </button>
        </section>

        {/* Model Details Section */}
        {showModelDetails && (
          <section
            style={{
              border: "2px dashed indigo",
              borderRadius: "10px",
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#f5f5f5",
            }}
          >
            <h2 style={{ color: "indigo" }}>Supported Models</h2>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              <li>
                <strong>Claude Series by Anthropic:</strong> Advanced conversational AI with various versions like Claude 3.5 Sonnet and Claude 3 Haiku for improved reasoning and speed.
              </li>
              <li>
                <strong>Cohere Command Models:</strong> Versatile models for text generation, summarization, and more.
              </li>
              <li>
                <strong>LLaMA Series:</strong> Large language models fine-tuned for instruction following and detailed text generation.
              </li>
              <li>
                <strong>Mistral Models:</strong> Optimized for efficient and versatile text generation.
              </li>
              <li>
                <strong>Amazon Titan Text:</strong> High-quality text generation integrated seamlessly with AWS services.
              </li>
            </ul>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: "indigo", color: "white", padding: "10px" }}>
        <p>© 2024 GENIE AI Interface. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default GenieFeaturesPage;


