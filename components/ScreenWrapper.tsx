import React from 'react'
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native'

type Props = {
  children: React.ReactNode
  refreshing?: boolean
  onRefresh?: () => Promise<void> | void
}

export const ScreenWrapper = ({
  children,
  refreshing = false,
  onRefresh,
}: Props) => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
})
