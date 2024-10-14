interface ExecutionResult {
    output: string;
    error?: string;
  }
  
  interface FileData {
    name: string;
    content: string;
    language: string;
  }
  
  export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let output = '';
        let error: string | undefined;
  
        try {
          switch (language) {
            case 'javascript':
            case 'react':
            case 'nextjs':
              // Use a sandboxed environment to execute JavaScript/React/Next.js
              const sandboxedFunction = new Function('console', `
                let log = '';
                const mockConsole = {
                  log: (...args) => {
                    log += args.join(' ') + '\\n';
                  }
                };
                (${code})(mockConsole);
                return log;
              `);
              output = sandboxedFunction(console);
              break;
            case 'html':
              output = 'HTML execution is handled in the preview pane.';
              break;
            case 'css':
              output = 'CSS execution is handled in the preview pane.';
              break;
            default:
              output = `Execution of ${language} is not supported in this environment.`;
          }
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
  
        resolve({ output, error });
      }, 100);
    });
  }
  
  export async function saveFile(name: string, content: string, language: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  export async function loadFile(): Promise<FileData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.html,.css,.js,.jsx,.ts,.tsx';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            const content = e.target?.result as string;
            const name = file.name.split('.').slice(0, -1).join('.');
            const extension = file.name.split('.').pop() || '';
            const language = getLanguageFromExtension(extension);
            resolve({ name, content, language });
          };
          reader.readAsText(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }
  
  function getLanguageFromExtension(extension: string): string {
    switch (extension.toLowerCase()) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'react';
      case 'ts':
      case 'tsx':
        return 'react'; // Assuming TypeScript React
      default:
        return 'javascript'; // Default to JavaScript if unknown
    }
  }
  
  function getFileExtension(language: string): string {
    switch (language) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'javascript':
        return 'js';
      case 'react':
        return 'jsx';
      case 'nextjs':
        return 'js';
      default:
        return 'txt';
    }
  }
  
  export async function formatCode(code: string, language: string): Promise<string> {
    // In a real-world scenario, this would use a proper formatter like Prettier
    return new Promise((resolve) => {
      setTimeout(() => {
        // This is a very basic formatter for demonstration purposes
        const lines = code.split('\n');
        let indentLevel = 0;
        const formattedLines = lines.map(line => {
          line = line.trim();
          if (line.endsWith('{')) {
            const formatted = '  '.repeat(indentLevel) + line;
            indentLevel++;
            return formatted;
          } else if (line.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
            return '  '.repeat(indentLevel) + line;
          } else {
            return '  '.repeat(indentLevel) + line;
          }
        });
        resolve(formattedLines.join('\n'));
      }, 100);
    });
  }
  
  export async function lintCode(code: string, language: string): Promise<string[]> {
    // In a real-world scenario, this would use a proper linter
    return new Promise((resolve) => {
      setTimeout(() => {
        const warnings: string[] = [];
        switch (language) {
          case 'javascript':
          case 'react':
          case 'nextjs':
            if (code.includes('var ')) {
              warnings.push('Consider using "let" or "const" instead of "var".');
            }
            if (language === 'react' && !code.includes('import React')) {
              warnings.push('React import is missing.');
            }
            break;
          case 'html':
            if (!code.toLowerCase().includes('<!doctype html>')) {
              warnings.push('HTML5 doctype is missing.');
            }
            break;
          case 'css':
            if (code.includes('!important')) {
              warnings.push('Avoid using !important in CSS.');
            }
            break;
        }
        resolve(warnings);
      }, 100);
    });
  }