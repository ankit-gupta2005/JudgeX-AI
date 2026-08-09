import Editor from "@monaco-editor/react";

function CodeEditor({ language, code, onChangeCode }) {
  return (
    <div className="w-full h-full bg-slate-950">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(val) => onChangeCode(val || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "Fira Code, Menlo, Monaco, Consolas, monospace",
          lineHeight: 22,
          padding: { top: 16 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          automaticLayout: true
        }}
      />
    </div>
  );
}

export default CodeEditor;