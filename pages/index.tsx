import type { NextPage } from 'next'
import Head from 'next/head'
import MainDashboard from '../src/components/Dashboard/MainDashboard'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>BugTracker Dashboard - Unified Bug Tracking System</title>
        <meta name="description" content="Unified bug tracking dashboard integrating Slack, Zendesk, and Shortcut data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainDashboard />
    </>
  )
}

export default Home
