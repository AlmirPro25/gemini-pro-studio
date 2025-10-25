import React, { useState, useRef, useEffect } from 'react';

interface InteractiveCodeBlockProps {
  htmlCode: string;
  theme: 'light' | 'dark';
  activeView: 'code' | 'preview';
}

export const InteractiveCodeBlock: React.FC<InteractiveCodeBlockProps> = React.memo(({ htmlCode, theme, activeView }) => {
  const [currentCode, setCurrentCode] = useState(htmlCode);
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoInstanceRef = useRef<any>(null);

  // Effect for creating and cleaning up the editor instance
  useEffect(() => {
    let editor: any;
    if (editorRef.current && window.require) {
      window.require(['vs/editor/editor.main'], () => {
        if (!monacoInstanceRef.current && editorRef.current) {
          editor = window.monaco.editor.create(editorRef.current, {
            value: htmlCode,
            language: 'html',
            theme: theme === 'dark' ? 'vs-dark' : 'vs',
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
            },
            fontSize: 14,
          });

          editor.onDidChangeModelContent(() => {
            setCurrentCode(editor.getValue());
          });
          monacoInstanceRef.current = editor;
        }
      });
    }
    
    return () => {
      monacoInstanceRef.current?.dispose();
      monacoInstanceRef.current = null;
    };
  }, []); // Only run on mount and unmount

  // Effect for updating theme
  useEffect(() => {
    if (monacoInstanceRef.current && window.monaco) {
      window.monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }, [theme]);
  
  // Effect for updating code from props (e.g., on regenerate)
  useEffect(() => {
    if (monacoInstanceRef.current && monacoInstanceRef.current.getValue() !== htmlCode) {
      monacoInstanceRef.current.setValue(htmlCode);
    }
    // Sync local state as well, primarily for the iframe key
    setCurrentCode(htmlCode);
  }, [htmlCode]);

  return (
    <div className="flex-1 min-h-0 relative bg-bg-primary h-full">
      <div className={`w-full h-full ${activeView === 'code' ? 'block' : 'hidden'}`} ref={editorRef}></div>
      {activeView === 'preview' && (
        <div className="w-full h-full bg-white">
          <iframe
            key={currentCode} // Force re-render iframe on code change
            srcDoc={currentCode}
            title="Interactive Code Preview"
            sandbox="allow-scripts allow-modals allow-popups allow-forms"
            className="w-full h-full border-0"
          />
        </div>
      )}
    </div>
  );
});
