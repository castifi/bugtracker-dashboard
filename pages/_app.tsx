import type { AppProps } from 'next/app'
import { ConfigProvider, theme } from 'antd'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          // Grafana Dark Theme Colors
          colorPrimary: '#ff7043',         // Orange accent color like Grafana
          colorSuccess: '#5cb85c',         // Green 
          colorWarning: '#f0ad4e',         // Yellow
          colorError: '#d9534f',           // Red
          colorInfo: '#5bc0de',            // Blue
          
          // Background colors
          colorBgBase: '#0d1117',          // Dark background like Grafana
          colorBgContainer: '#161b22',     // Card background
          colorBgElevated: '#21262d',      // Modal/dropdown background
          colorBgLayout: '#0d1117',        // Layout background
          
          // Border and divider colors
          colorBorder: '#30363d',          // Border color
          colorBorderSecondary: '#21262d', // Secondary border
          
          // Text colors
          colorText: '#f0f6fc',            // Primary text
          colorTextSecondary: '#8b949e',   // Secondary text
          colorTextTertiary: '#6e7681',    // Tertiary text
          colorTextQuaternary: '#484f58',  // Quaternary text
          
          // Component specific
          borderRadius: 8,
          wireframe: false,
          
          // Custom Grafana-like styling
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          boxShadowSecondary: '0 2px 8px rgba(0, 0, 0, 0.4)',
        },
        components: {
          Layout: {
            bodyBg: '#0d1117',
            headerBg: '#161b22',
            siderBg: '#161b22',
            triggerBg: '#21262d',
          },
          Menu: {
            darkItemBg: '#161b22',
            darkItemSelectedBg: '#ff7043',
            darkItemHoverBg: '#21262d',
            darkSubMenuItemBg: '#161b22',
          },
          Card: {
            colorBgContainer: '#161b22',
            colorBorderSecondary: '#30363d',
          },
          Table: {
            colorBgContainer: '#161b22',
            headerBg: '#21262d',
            headerColor: '#f0f6fc',
            rowHoverBg: '#21262d',
          },
          Input: {
            colorBgContainer: '#21262d',
            colorBorder: '#30363d',
          },
          Select: {
            colorBgContainer: '#21262d',
            colorBorder: '#30363d',
          },
          Button: {
            colorBgContainer: '#21262d',
            primaryShadow: '0 2px 4px rgba(255, 112, 67, 0.2)',
          }
        }
      }}
    >
      <Component {...pageProps} />
    </ConfigProvider>
  )
}
