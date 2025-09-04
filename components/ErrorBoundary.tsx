import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { isAppConfigured, getConfigurationErrorMessage } from '@/utils/validateEnv';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  isConfigurationError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, isConfigurationError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a configuration error
    const isConfigurationError = 
      error.message.includes('Supabase not configured') ||
      error.message.includes('auth') && error.message.includes('null') ||
      !isAppConfigured();

    return { 
      hasError: true, 
      error, 
      errorInfo: null, 
      isConfigurationError 
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if this is a configuration error
    const isConfigurationError = 
      error.message.includes('Supabase not configured') ||
      error.message.includes('auth') && error.message.includes('null') ||
      !isAppConfigured();
    
    // Report to crash analytics service
    if (__DEV__) {
      console.error('Component Stack:', errorInfo.componentStack);
    } else {
      // In production, send to crash reporting service
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    this.setState({ errorInfo, isConfigurationError });
  }

  handleRestart = () => {
    Alert.alert(
      '앱 재시작 필요 / App Restart Required',
      '앱을 완전히 종료한 후 다시 실행해주세요.\n' +
      'Please close the app completely and reopen it.',
      [
        {
          text: '확인 / OK',
          onPress: () => {
            if (__DEV__) {
              console.log('App restart requested - reload manually');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  render() {
    if (this.state.hasError) {
      // Show different UI for configuration errors vs general errors
      if (this.state.isConfigurationError) {
        const configError = getConfigurationErrorMessage('ko');
        const configErrorEn = getConfigurationErrorMessage('en');
        
        return (
          <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.title}>{configError.title}</Text>
              <Text style={styles.subtitle}>{configErrorEn.title}</Text>
              
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>설정 오류 / Configuration Error:</Text>
                <Text style={styles.errorMessage}>
                  {configError.message}
                </Text>
                <Text style={[styles.errorMessage, { marginTop: 16, fontStyle: 'italic' }]}>
                  {configErrorEn.message}
                </Text>
              </View>

              <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
                <Text style={styles.buttonText}>{configError.action} / {configErrorEn.action}</Text>
              </TouchableOpacity>

              <Text style={styles.helpText}>
                이 오류는 일반적으로 앱 업데이트로 해결됩니다.{'\n'}
                This error is usually resolved by updating the app.
              </Text>
            </ScrollView>
          </View>
        );
      }

      // General error UI
      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>앱에 문제가 발생했습니다</Text>
            <Text style={styles.subtitle}>Something went wrong</Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>오류 정보 / Error Details:</Text>
              <Text style={styles.errorMessage}>
                {this.state.error?.message || '알 수 없는 오류가 발생했습니다 / Unknown error occurred'}
              </Text>
              
              {__DEV__ && this.state.error?.stack && (
                <View style={styles.stackContainer}>
                  <Text style={styles.stackTitle}>Stack Trace (Dev Only):</Text>
                  <ScrollView style={styles.stackScroll} horizontal>
                    <Text style={styles.stackTrace}>{this.state.error.stack}</Text>
                  </ScrollView>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
              <Text style={styles.buttonText}>앱 다시 시작 / Restart App</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              문제가 계속되면 앱을 삭제 후 다시 설치해주세요.{'\n'}
              If the problem persists, please reinstall the app.
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  stackContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  stackTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  stackScroll: {
    maxHeight: 200,
  },
  stackTrace: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#495057',
    lineHeight: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ErrorBoundary;