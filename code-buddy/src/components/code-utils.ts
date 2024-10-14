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
    // In a real-world scenario, this would be handled by a backend service
    return new Promise((resolve) => {
      setTimeout(() => {
        let output = '';
        let error: string | undefined;
  
        try {
          switch (language) {
            case 'javascript':
              // Use a sandboxed environment to execute JavaScript
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
      }, 100); // Simulating a short delay
    });
  }
  
  export async function saveFile(name: string, content: string, language: string): Promise<void> {
    // In a real application, you might want to save this to a backend or local storage
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  export async function loadFile(): Promise<FileData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.html,.css,.js,.ts';
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
      case 'ts':
        return 'typescript';
      default:
        return 'javascript'; // Default to JavaScript if unknown
    }
  }
  
  export async function formatCode(code: string, language: string): Promise<string> {
    // In a real-world scenario, this would use a proper formatter like Prettier
    // This is a very basic implementation for demonstration purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        let formattedCode = code;
        switch (language) {
          case 'javascript':
          case 'html':
          case 'css':
            // Basic indentation for demonstration
            formattedCode = code.split('\n').map(line => line.trim()).join('\n');
            break;
          default:
            // For unsupported languages, return the original code
            break;
        }
        resolve(formattedCode);
      }, 100);
    });
  }
  
  export async function lintCode(code: string, language: string): Promise<string[]> {
    // In a real-world scenario, this would use a proper linter
    // This is a very basic implementation for demonstration purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        const warnings: string[] = [];
        switch (language) {
          case 'javascript':
            if (code.includes('var ')) {
              warnings.push('Consider using "let" or "const" instead of "var".');
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
          default:
            // For unsupported languages, return no warnings
            break;
        }
        resolve(warnings);
      }, 100);
    });
  }