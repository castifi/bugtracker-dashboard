import type { AppProps } from 'next/app'
import { ConfigProvider } from 'antd'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Component {...pageProps} />
    </ConfigProvider>
  )
}
