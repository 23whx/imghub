import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">组件渲染出错了</h2>
          <p className="text-gray-600 mb-4">请尝试刷新页面。如果问题持续存在，请联系开发者。</p>
          <div className="text-left bg-white p-4 rounded border border-red-100 overflow-auto max-h-60">
            <p className="font-mono text-sm text-red-500 mb-2">{this.state.error && this.state.error.toString()}</p>
            <pre className="font-mono text-xs text-gray-500 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
