"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Maximize2, Minimize2, Play, Save, Folder, Eye, Code, AlertTriangle, LayoutList } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { linter, lintGutter } from '@codemirror/lint'
import { executeCode, saveFile, loadFile } from './code-utils'

const languageOptions = [
  { value: 'html', label: 'HTML', extension: html },
  { value: 'css', label: 'CSS', extension: css },
  { value: 'javascript', label: 'JavaScript', extension: javascript },
]

export default function Editor() {
  const [tabs, setTabs] = useState([
    { id: 1, name: 'index.html', content: '<h1>Hello, World!</h1>', language: 'html' },
    { id: 2, name: 'styles.css', content: 'body { font-family: sans-serif; }', language: 'css' },
    { id: 3, name: 'script.js', content: 'console.log("Hello from JavaScript!");', language: 'javascript' }
  ])
  const [activeTab, setActiveTab] = useState(1)
  const [output, setOutput] = useState('')
  const [consoleOutput, setConsoleOutput] = useState([])
  const [showPreview, setShowPreview] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isSplitView, setIsSplitView] = useState(true)
  const [errors, setErrors] = useState([])
  const previewRef = useRef(null)
  const editorContainerRef = useRef(null)

  const handleCodeChange = (value: string, tabId: number) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, content: value } : tab
    ))
  }

  const handleLanguageChange = (value: string, tabId: number) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, language: value } : tab
    ))
  }

  const handleAddTab = () => {
    const newTab = { id: Date.now(), name: `Untitled ${tabs.length + 1}`, content: '', language: 'javascript' }
    setTabs([...tabs, newTab])
    setActiveTab(newTab.id)
  }

  const handleCloseTab = (tabId: number) => {
    setTabs(tabs.filter(tab => tab.id !== tabId))
    if (activeTab === tabId) {
      setActiveTab(tabs[0].id)
    }
  }

  const handleExecuteCode = async () => {
    const activeTabContent = tabs.find(tab => tab.id === activeTab)
    if (activeTabContent) {
      const result = await executeCode(activeTabContent.content, activeTabContent.language)
      setOutput(result)
    }
  }

  const handleSaveFile = async () => {
    const activeTabContent = tabs.find(tab => tab.id === activeTab)
    if (activeTabContent) {
      await saveFile(activeTabContent.name, activeTabContent.content, activeTabContent.language)
    }
  }

  const handleLoadFile = async () => {
    const file = await loadFile()
    if (file) {
      setTabs([...tabs, { id: Date.now(), name: file.name, content: file.content, language: file.language }])
    }
  }

  const updatePreview = () => {
    if (previewRef.current) {
      const htmlContent = tabs.find(tab => tab.language === 'html')?.content || ''
      const cssContent = tabs.find(tab => tab.language === 'css')?.content || ''
      const jsContent = tabs.find(tab => tab.language === 'javascript')?.content || ''

      const previewContent = `
        <html>
          <head>
            <style>${cssContent}</style>
          </head>
          <body>
            ${htmlContent}
            <script>
              // Capture console output
              (function() {
                var oldLog = console.log;
                var oldWarn = console.warn;
                var oldError = console.error;
                var oldInfo = console.info;
                console.log = function(...args) {
                  oldLog.apply(console, args);
                  window.parent.postMessage({type: 'console', level: 'log', content: args.join(' ')}, '*');
                };
                console.warn = function(...args) {
                  oldWarn.apply(console, args);
                  window.parent.postMessage({type: 'console', level: 'warn', content: args.join(' ')}, '*');
                };
                console.error = function(...args) {
                  oldError.apply(console, args);
                  window.parent.postMessage({type: 'console', level: 'error', content: args.join(' ')}, '*');
                };
                console.info = function(...args) {
                  oldInfo.apply(console, args);
                  window.parent.postMessage({type: 'console', level: 'info', content: args.join(' ')}, '*');
                };
              })();
              
              // Capture errors
              window.onerror = function(message, source, lineno, colno, error) {
                window.parent.postMessage({type: 'error', content: message, line: lineno, column: colno}, '*');
                return true;
              };

              ${jsContent}
            </script>
          </body>
        </html>
      `
      previewRef.current.srcdoc = previewContent
    }
  }

  useEffect(() => {
    updatePreview()
  }, [tabs])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        setConsoleOutput(prev => [...prev, { level: event.data.level, content: event.data.content }])
      } else if (event.data.type === 'error') {
        setErrors(prev => [...prev, { message: event.data.content, line: event.data.line, column: event.data.column }])
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [])

  const toggleFullScreen = () => {
    if (editorContainerRef.current && !document.fullscreenElement) {
      editorContainerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const errorLinter = linter((view) => {
    return errors.map(error => ({
      from: view.state.doc.line(error.line).from + error.column - 1,
      to: view.state.doc.line(error.line).to,
      severity: 'error',
      message: error.message
    }))
  })

  return (
    <TooltipProvider>
      <div ref={editorContainerRef} className={`container mx-auto p-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Advanced Collaborative Code Editor</CardTitle>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setIsSplitView(!isSplitView)}>
                    {isSplitView ? <LayoutList className="h-4 w-4" /> : ""}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSplitView ? 'Switch to stacked view' : 'Switch to split view'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={toggleFullScreen}>
                    {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullScreen ? 'Exit full screen' : 'Enter full screen'}
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid ${isSplitView ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div className={isSplitView ? '' : 'col-span-2'}>
                <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(parseInt(value))}>
                  <div className="flex justify-between items-center mb-4">
                    <TabsList>
                      {tabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id.toString()}>
                          {tab.name}
                          <button className="ml-2" onClick={() => handleCloseTab(tab.id)}>&times;</button>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <Button onClick={handleAddTab}>New Tab</Button>
                  </div>
                  {tabs.map(tab => (
                    <TabsContent key={tab.id} value={tab.id.toString()}>
                      <div className="mb-4">
                        <Select value={tab.language} onValueChange={(value) => handleLanguageChange(value, tab.id)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {languageOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <CodeMirror
                        value={tab.content}
                        height="400px"
                        extensions={[
                          languageOptions.find(lang => lang.value === tab.language)?.extension(),
                          lintGutter(),
                          errorLinter
                        ]}
                        onChange={(value) => handleCodeChange(value, tab.id)}
                        theme="dark"
                        className="border rounded"
                      />
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="mt-4 space-x-2">
                  <Button onClick={handleExecuteCode}><Play className="mr-2 h-4 w-4" /> Execute</Button>
                  <Button onClick={handleSaveFile}><Save className="mr-2 h-4 w-4" /> Save</Button>
                  <Button onClick={handleLoadFile}><Folder className="mr-2 h-4 w-4" /> Load</Button>
                </div>
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Console Output</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[100px]">
                      {consoleOutput.map((log, index) => (
                        <div key={index} className={`${
                          log.level === 'error' ? 'text-red-500' :
                          log.level === 'warn' ? 'text-yellow-500' :
                          log.level === 'info' ? 'text-blue-500' :
                          'text-green-500'
                        }`}>
                          [{log.level}] {log.content}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
                {errors.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                        Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[100px]">
                        {errors.map((error, index) => (
                          <div key={index} className="text-red-500">
                            Line {error.line}, Column {error.column}: {error.message}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
              {(showPreview && (isSplitView || !isFullScreen)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <iframe
                      ref={previewRef}
                      title="Live Preview"
                      className="w-full h-[600px] border rounded"
                      sandbox="allow-scripts"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}