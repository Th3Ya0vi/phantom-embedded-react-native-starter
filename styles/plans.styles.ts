import {  StyleSheet} from 'react-native';
import { Colors } from '../styles/colors';
import { Gradients } from '../styles/gradients';
import { Spacing } from '../styles/spacing';
import { Typography } from '../styles/typography';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    padding: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.h1,
  },
  subtitle: {
    color: Colors.textSecondary,
    ...Typography.body,
    marginTop: Spacing.xs,
  },

  regionScroll: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  regionOuter: {
    borderRadius: 20,
    marginRight: Spacing.sm,
    padding: 1,
  },
  regionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  regionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  plans: {
    padding: Spacing.lg,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  planPrice: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  planMeta: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  planHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  buyButton: {
    marginTop: Spacing.md,
    borderRadius: 14,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  buyText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
